// ─────────────────────────────────────────────
//  NextCut — Stripe-Ready Configuration
//  Replace VITE_STRIPE_PUBLISHABLE_KEY with your
//  real key to go live. No other changes needed.
// ─────────────────────────────────────────────

// DEPRECATED: Use getCommissionRules() from lib/commissionRules.js instead
// This is kept for backwards compatibility only
export const PLATFORM_FEE_PERCENT = 0.15; // Legacy fallback

// Publishable key — safe for frontend (never use secret key here)
// Set VITE_STRIPE_PUBLISHABLE_KEY in your Base44 environment variables
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

export const STRIPE_ACTIVE = !!STRIPE_PUBLISHABLE_KEY;

/**
 * Calculate fee breakdown for a booking price.
 * @param {number} price - Service price in dollars
 * @returns {{ servicePrice, platformFee, barberEarnings }}
 */
export function calcFees(price) {
  const servicePrice = Number(price) || 0;
  const platformFee = parseFloat((servicePrice * PLATFORM_FEE_PERCENT).toFixed(2));
  const barberEarnings = parseFloat((servicePrice - platformFee).toFixed(2));
  return { servicePrice, platformFee, barberEarnings };
}

/**
 * Human-readable Stripe status label + color
 */
export function stripeStatusInfo(stripe_status) {
  switch (stripe_status) {
    case "active":
      return { label: "Payouts Enabled", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
    case "onboarding_in_progress":
      return { label: "Onboarding In Progress", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
    case "onboarding_required":
      return { label: "Onboarding Required", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
    case "not_connected":
    default:
      return { label: "Not Connected", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" };
  }
}

// ─────────────────────────────────────────────
//  STRIPE BACKEND ENDPOINTS (future use)
//  When Backend Functions are enabled, create:
//
//  POST /api/stripe/connect-account
//    → Creates Stripe Connect account, returns onboarding URL
//    → Save stripe_account_id to Barber entity
//
//  POST /api/stripe/onboarding-link
//    → Returns a fresh account_link URL for incomplete onboarding
//
//  POST /api/stripe/sync-account-status
//    → Calls Stripe API to check charges_enabled / payouts_enabled
//    → Updates barber stripe_status + payouts_enabled fields
//
//  POST /api/stripe/create-payment-intent
//    → Creates PaymentIntent for a booking
//    → Returns client_secret to frontend
//    → Stores stripe_payment_intent_id on Booking
//
//  POST /api/stripe/webhook
//    → Handles: payment_intent.succeeded, account.updated, payout.paid
//    → Updates booking payment_status and barber payouts_enabled
//
//  Secret key (STRIPE_SECRET_KEY) lives ONLY in backend env.
//  Never expose it to frontend.
// ─────────────────────────────────────────────