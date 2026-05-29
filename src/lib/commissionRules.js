/**
 * NextCut Dynamic Commission Rules
 *
 * Commission types and their default rates:
 *   new_nextcut_lead     — 20%  (client found barber via NextCut marketplace/search)
 *   repeat_client        — 15%  (same client has prior completed+paid booking with this barber)
 *   barber_direct_client — 10%  (client came via barber's own referral/direct link)
 *
 * Tips go 100% to barber — never included in commission calculation.
 * Commission is locked onto the booking at creation time.
 * Cancelled and no_show bookings never generate commission.
 */

import { base44 } from "@/api/base44Client";

export const COMMISSION_DEFAULTS = {
  new_nextcut_lead: 0.07,
  repeat_client: 0.04,
  barber_direct_client: 0.03,
  barber_referral_link: 0.00, // Barber's own referral link — 0% platform commission
};

export const COMMISSION_LABELS = {
  new_nextcut_lead: "New NextCut Lead",
  repeat_client: "Repeat Client",
  barber_direct_client: "Barber Direct",
  barber_referral_link: "Your Referral Link",
};

export const SOURCE_TO_TYPE = {
  marketplace: "new_nextcut_lead",
  search: "new_nextcut_lead",
  featured: "new_nextcut_lead",
  nextcut_campaign: "new_nextcut_lead",
  barber_referral_link: "barber_referral_link", // 0% commission — barber keeps 100%
  barber_direct_link: "barber_direct_client",
  manual: "new_nextcut_lead",
};

/**
 * Load all 3 commission rates from PlatformSettings.
 * Falls back to COMMISSION_DEFAULTS if not set.
 */
export async function getCommissionRules() {
  const settings = await base44.entities.PlatformSettings.list();
  const map = {};
  settings.forEach(s => { map[s.setting_key] = parseFloat(s.setting_value); });
  return {
    new_nextcut_lead: map["rate_new_nextcut_lead"] ?? COMMISSION_DEFAULTS.new_nextcut_lead,
    repeat_client: map["rate_repeat_client"] ?? COMMISSION_DEFAULTS.repeat_client,
    barber_direct_client: map["rate_barber_direct_client"] ?? COMMISSION_DEFAULTS.barber_direct_client,
    barber_referral_link: 0.00, // Always 0% — barber keeps 100%
  };
}

/**
 * Save all 3 commission rates to PlatformSettings.
 */
export async function saveCommissionRules(rates) {
  const settings = await base44.entities.PlatformSettings.list();
  const map = {};
  settings.forEach(s => { map[s.setting_key] = s.id; });

  const keys = [
    { key: "rate_new_nextcut_lead", value: String(rates.new_nextcut_lead) },
    { key: "rate_repeat_client", value: String(rates.repeat_client) },
    { key: "rate_barber_direct_client", value: String(rates.barber_direct_client) },
  ];

  for (const { key, value } of keys) {
    if (map[key]) {
      await base44.entities.PlatformSettings.update(map[key], { setting_value: value });
    } else {
      await base44.entities.PlatformSettings.create({ setting_key: key, setting_value: value });
    }
  }
}

/**
 * Determine commission type for a new booking.
 *
 * Priority:
 *   1. barber_direct_client  — if customer_source is barber_referral_link or barber_direct_link
 *   2. repeat_client          — if prior completed+paid booking exists for this client+barber pair
 *   3. new_nextcut_lead       — all other marketplace/search traffic
 */
export async function resolveCommissionType(clientEmail, barberId, customerSource) {
  // 1. Barber's own referral link → 0% commission
  if (customerSource === "barber_referral_link") {
    return "barber_referral_link";
  }

  // 2. Barber direct link → reduced commission
  if (customerSource === "barber_direct_link") {
    return "barber_direct_client";
  }

  // 3. Check for prior completed+paid booking (repeat client)
  const priorBookings = await base44.entities.Booking.filter({
    client_email: clientEmail,
    barber_id: barberId,
    status: "completed",
    payment_status: "paid",
  });

  if (priorBookings.length > 0) {
    return "repeat_client";
  }

  // 4. Default — new NextCut lead
  return "new_nextcut_lead";
}

/**
 * Calculate fee breakdown for a booking.
 * tip_amount is excluded from commission — goes 100% to barber.
 *
 * @param {number} servicePrice
 * @param {number} tipAmount
 * @param {number} commissionRate  e.g. 0.20
 * @returns {{ platformFee, barberEarnings, totalClientPays }}
 */
export function calcCommission(servicePrice, tipAmount, commissionRate) {
  const price = Number(servicePrice) || 0;
  const tip = Number(tipAmount) || 0;
  const platformFee = parseFloat((price * commissionRate).toFixed(2));
  const barberEarnings = parseFloat((price - platformFee + tip).toFixed(2));
  return { platformFee, barberEarnings, totalClientPays: price + tip };
}