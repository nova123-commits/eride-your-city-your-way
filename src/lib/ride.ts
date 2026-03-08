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
] as const;

export type RideCategory = (typeof RIDE_CATEGORIES)[number];

export function calculateFare(category: RideCategory, distanceKm: number): number {
  const now = new Date();
  const hour = now.getHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const surgeMultiplier = isPeakHour ? 1.5 : 1;
  const fare = (category.baseRate + category.perKm * distanceKm) * surgeMultiplier;
  return Math.round(fare);
}

export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
}

export const MOCK_DRIVER = {
  name: 'James Mwangi',
  rating: 4.8,
  trips: 1243,
  plate: 'KDA 421X',
  vehicle: 'Toyota Vitz',
  photo: '',
  phone: '+254 712 345 678',
};

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
