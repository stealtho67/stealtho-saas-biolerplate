/**
 * platformSettings.js
 *
 * Backwards-compatible shim. The commission system now uses
 * lib/commissionRules.js with 3 dynamic rates.
 *
 * These functions are kept so old imports don't break,
 * but new code should use getCommissionRules() from commissionRules.js.
 */
import { base44 } from "@/api/base44Client";

export const DEFAULT_COMMISSION = 0.15;

export async function getCommissionRate() {
  // Read the "repeat_client" rate as the legacy single-rate fallback
  const settings = await base44.entities.PlatformSettings.filter({ setting_key: "rate_repeat_client" });
  if (settings.length > 0) {
    const val = parseFloat(settings[0].setting_value);
    if (!isNaN(val)) return val;
  }
  return DEFAULT_COMMISSION;
}

export async function setCommissionRate(rate) {
  // No-op shim — use saveCommissionRules from commissionRules.js instead
}

export function calcFeesWithRate(price, rate) {
  const servicePrice = Number(price) || 0;
  const platformFee = parseFloat((servicePrice * rate).toFixed(2));
  const barberEarnings = parseFloat((servicePrice - platformFee).toFixed(2));
  return { servicePrice, platformFee, barberEarnings, commissionRate: rate };
}