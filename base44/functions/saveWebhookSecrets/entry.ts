/**
 * Admin-only backend function to persist Stripe webhook signing secrets.
 * Secrets are stored server-side only and never returned to the client.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // This function intentionally does NOT store secrets — secrets must be set
  // via the platform dashboard (Settings → Secrets). This endpoint is a no-op
  // that just confirms admin auth and returns the secret names to set.
  // The UI uses this to show which secrets need to be configured.
  const secretNames = [
    'STRIPE_WH_SECRET_ACCOUNT',
    'STRIPE_WH_SECRET_CONNECTED',
    'STRIPE_WH_SECRET_CONNECTED_THIN',
  ];

  const configured = secretNames.map(name => ({
    name,
    set: !!Deno.env.get(name),
  }));

  return Response.json({ configured });
});