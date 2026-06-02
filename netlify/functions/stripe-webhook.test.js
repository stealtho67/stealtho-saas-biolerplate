import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockSupabaseFrom = vi.fn();
const mockSupabaseSelect = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseMaybeSingle = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseUpsert = vi.fn();

const mockSupabase = {
  from: mockSupabaseFrom,
};

function resetSupabaseMocks() {
  mockSupabaseFrom.mockReset();
  mockSupabaseSelect.mockReset();
  mockSupabaseEq.mockReset();
  mockSupabaseMaybeSingle.mockReset();
  mockSupabaseInsert.mockReset();
  mockSupabaseUpsert.mockReset();

  // Default: processed_events select returns nothing (not yet processed)
  mockSupabaseFrom.mockImplementation((table) => {
    if (table === 'processed_events') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => Promise.resolve({ error: null }),
      };
    }
    if (table === 'subscriptions') {
      return { upsert: () => Promise.resolve({ error: null }) };
    }
    return {};
  });
}

vi.mock('stripe', () => {
  const MockStripe = vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn((body, sig, secret) => {
        if (sig === 'invalid_sig') {
          throw new Error('Stripe signature verification failed');
        }

        const parsed = JSON.parse(body);
        return {
          id: parsed.id || 'evt_test_id',
          type: parsed.type,
          data: { object: parsed.data?.object || parsed.data },
        };
      }),
    },
    subscriptions: {
      retrieve: vi.fn(() =>
        Promise.resolve({
          id: 'sub_test_1',
          status: 'active',
          customer: 'cus_test_1',
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'price_test_1' } }] },
          metadata: { user_id: 'user_test_1' },
        }),
      ),
    },
  }));

  return { default: MockStripe };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// Import the handler after mocks are set up
const { handler } = await import('./stripe-webhook.js');

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildEvent(type, overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: {
      'stripe-signature': 'valid_sig',
    },
    body: JSON.stringify({
      id: overrides.eventId || `evt_${Date.now()}_${Math.random()}`,
      type,
      data: {
        object: {
          id: `sub_${Date.now()}`,
          status: 'active',
          customer: 'cus_test_1',
          client_reference_id: 'user_test_1',
          subscription: 'sub_test_1',
          metadata: { user_id: 'user_test_1' },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'price_test_1' } }] },
          ...overrides.object,
        },
      },
    }),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('stripe-webhook handler', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it('rejects non-POST requests', async () => {
    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(405);
  });

  it('rejects requests without a Stripe signature', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: {},
      body: '{}',
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/missing.*signature/i);
  });

  it('rejects requests with an invalid signature', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { 'stripe-signature': 'invalid_sig' },
      body: '{}',
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/signature verification failed/i);
  });

  it('processes checkout.session.completed', async () => {
    const event = buildEvent('checkout.session.completed');
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.received).toBe(true);

    // Should have upserted a subscription
    expect(mockSupabaseFrom).toHaveBeenCalledWith('subscriptions');
  });

  it('processes customer.subscription.updated', async () => {
    const event = buildEvent('customer.subscription.updated', {
      object: {
        metadata: { user_id: 'user_test_1' },
      },
    });
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('subscriptions');
  });

  it('processes customer.subscription.deleted', async () => {
    const event = buildEvent('customer.subscription.deleted', {
      object: {
        metadata: { user_id: 'user_test_1' },
      },
    });
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('subscriptions');
  });

  it('returns 200 for unhandled event types without upserting', async () => {
    const event = buildEvent('invoice.payment_succeeded');
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    // Should not have called subscriptions upsert
    const calls = mockSupabaseFrom.mock.calls.filter(([t]) => t === 'subscriptions');
    expect(calls).toHaveLength(0);
  });

  it('is idempotent — same event id returns 200 without reprocessing', async () => {
    const eventId = `evt_idempotent_${Date.now()}`;
    const event = buildEvent('checkout.session.completed', { eventId });

    // First call
    const res1 = await handler(event);
    expect(res1.statusCode).toBe(200);
    expect(JSON.parse(res1.body).received).toBe(true);

    // Second call — same event; should be caught by in-memory cache
    const res2 = await handler(event);
    expect(res2.statusCode).toBe(200);
    expect(JSON.parse(res2.body).idempotent).toBe(true);
  });
});
