import type { AdminBooking } from '../services/bookingService';

const todayAt = (offsetDays: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const mockBookings: AdminBooking[] = [
  {
    id: 'mock-1',
    clientName: 'Alice Carter',
    vehicleId: 'rsq3',
    vehicleName: 'Audi RSQ3',
    startAt: todayAt(1, 10),
    endAt: todayAt(1, 18),
    price: 320,
    status: 'confirmed',
    createdAt: todayAt(-2, 14),
  },
  {
    id: 'mock-4',
    clientName: 'Daniel Kim',
    vehicleId: 'v-class',
    vehicleName: 'Mercedes V Class',
    startAt: todayAt(7, 7),
    endAt: todayAt(7, 23),
    price: 540,
    status: 'pending',
    createdAt: todayAt(0, 8),
  },
  {
    id: 'mock-5',
    clientName: 'Emma Patel',
    vehicleId: 's-class',
    vehicleName: 'Mercedes S Class',
    startAt: todayAt(10, 14),
    endAt: todayAt(12, 10),
    price: 1280,
    status: 'confirmed',
    createdAt: todayAt(-5, 16),
  },
  {
    id: 'mock-6',
    clientName: 'Faisal Ahmed',
    vehicleId: 'c300-coupe',
    vehicleName: 'Mercedes C300 Coupe',
    startAt: todayAt(2, 18),
    endAt: todayAt(3, 2),
    price: 260,
    status: 'cancelled',
    createdAt: todayAt(-4, 19),
  },
];
