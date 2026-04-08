export const RIDE_CATEGORIES = [
  {
    id: 'basic',
    name: 'eRide Basic',
    description: 'Affordable everyday rides',
    baseRate: 100,
    perKm: 25,
    icon: '🚗',
    eta: '3-5 min',
    capacity: '4 seats',
  },
  {
    id: 'xtra',
    name: 'eRide Xtra',
    description: 'Premium comfort rides',
    baseRate: 250,
    perKm: 45,
    icon: '🚘',
    eta: '5-8 min',
    capacity: '4 seats',
  },
  {
    id: 'boda',
    name: 'eRide Boda',
    description: 'Quick motorbike rides',
    baseRate: 50,
    perKm: 15,
    icon: '🏍️',
    eta: '1-3 min',
    capacity: '1 seat',
  },
  {
    id: 'electric',
    name: 'eRide Electric',
    description: 'Zero-emission EV rides',
    baseRate: 180,
    perKm: 35,
    icon: '⚡',
    eta: '4-7 min',
    capacity: '4 seats',
  },
] as const;

export type RideCategory = (typeof RIDE_CATEGORIES)[number];

export const WAITING_FEE_PER_MIN = 8; // KES per minute

export function calculateFare(
  category: RideCategory,
  distanceKm: number,
  waitMinutes: number = 0,
  isGoldMember: boolean = false
): number {
  const now = new Date();
  const hour = now.getHours();
  const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const surgeMultiplier = isPeak && !isGoldMember ? 1.5 : 1;
  const baseFare = (category.baseRate + category.perKm * distanceKm) * surgeMultiplier;
  const waitingFee = waitMinutes * WAITING_FEE_PER_MIN;
  return Math.round(baseFare + waitingFee);
}

export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
}

// MOCK_DRIVER removed — all driver data now comes from the database

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
