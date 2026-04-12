import { base44 } from "@/api/base44Client";

export const DEFAULT_COMMISSION = 0.15; // 15%

/**
 * Fetch the current platform commission rate.
 * Falls back to DEFAULT_COMMISSION if not set.
 */
export async function getCommissionRate() {
  const settings = await base44.entities.PlatformSettings.filter({ setting_key: "commission_rate" });
  if (settings.length > 0) {
    const val = parseFloat(settings[0].setting_value);
    if (!isNaN(val)) return val;
  }
  return DEFAULT_COMMISSION;
}

/**
 * Set the platform commission rate (admin only).
 * @param {number} rate - e.g. 0.10, 0.15, 0.20
 */
export async function setCommissionRate(rate) {
  const settings = await base44.entities.PlatformSettings.filter({ setting_key: "commission_rate" });
  if (settings.length > 0) {
    await base44.entities.PlatformSettings.update(settings[0].id, { setting_value: String(rate) });
  } else {
    await base44.entities.PlatformSettings.create({
      setting_key: "commission_rate",
      setting_value: String(rate),
      description: "Platform commission rate as decimal (e.g. 0.15 = 15%)",
    });
  }
}

/**
 * Calculate fee breakdown given a price and rate.
 */
export function calcFeesWithRate(price, rate) {
  const servicePrice = Number(price) || 0;
  const platformFee = parseFloat((servicePrice * rate).toFixed(2));
  const barberEarnings = parseFloat((servicePrice - platformFee).toFixed(2));
  return { servicePrice, platformFee, barberEarnings, commissionRate: rate };
}