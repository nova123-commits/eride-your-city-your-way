// Currency configuration for eRide
export type CurrencyCode = 'KES' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  exchangeRate: number; // Rate relative to KES (KES = 1)
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  KES: { code: 'KES', symbol: 'KES', name: 'Kenyan Shilling', exchangeRate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 0.0065 }, // ~1 USD = 154 KES
};

export function convertCurrency(amountKES: number, to: CurrencyCode): number {
  return Math.round(amountKES * CURRENCIES[to].exchangeRate * 100) / 100;
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const cfg = CURRENCIES[currency];
  if (currency === 'KES') return `KES ${amount.toLocaleString()}`;
  return `${cfg.symbol}${amount.toFixed(2)}`;
}

// Tax & fee breakdown
export const TAX_RATES = {
  VAT: 0.16,           // 16% VAT
  HOUSING_LEVY: 0.015, // 1.5% Housing Levy (2026)
  SEPT: 0.03,          // 3% Significant Economic Presence Tax
  PLATFORM_COMMISSION: 0.15, // 15% platform commission
};

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  waitingFee: number;
  subtotal: number;
  vat: number;
  housingLevy: number;
  total: number;
  driverEarnings: number;
  platformCommission: number;
  driverHousingLevy: number;
}

export function calculateFareBreakdown(
  baseFare: number,
  perKm: number,
  distanceKm: number,
  waitMinutes: number = 0,
  waitFeePerMin: number = 8,
  isPeak: boolean = false,
  isGoldMember: boolean = false
): FareBreakdown {
  const surgeMultiplier = isPeak && !isGoldMember ? 1.5 : 1;
  const distanceCharge = perKm * distanceKm * surgeMultiplier;
  const waitingFee = waitMinutes * waitFeePerMin;
  const subtotal = (baseFare + distanceCharge) * surgeMultiplier + waitingFee;
  const vat = Math.round(subtotal * TAX_RATES.VAT);
  const housingLevy = Math.round(subtotal * TAX_RATES.HOUSING_LEVY);
  const total = Math.round(subtotal + vat + housingLevy);

  const platformCommission = Math.round(subtotal * TAX_RATES.PLATFORM_COMMISSION);
  const driverHousingLevy = Math.round(subtotal * TAX_RATES.HOUSING_LEVY);
  const driverEarnings = Math.round(subtotal - platformCommission - driverHousingLevy);

  return {
    baseFare: Math.round(baseFare * surgeMultiplier),
    distanceCharge: Math.round(distanceCharge),
    waitingFee,
    subtotal: Math.round(subtotal),
    vat,
    housingLevy,
    total,
    driverEarnings,
    platformCommission,
    driverHousingLevy,
  };
}
