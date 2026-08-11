export type BookingVehicle = {
  id: string;
  name: string;
  shortName: string;
  priceHint: string;
  summary: string;
};

export const bookingVehicles: BookingVehicle[] = [
  {
    id: 'rsq3',
    name: 'Audi RSQ3',
    shortName: 'RSQ3',
    priceHint: 'Enter agreed rental total',
    summary: 'Performance SUV with compact city-friendly size.',
  },
  {
    id: 'c300-coupe',
    name: 'Mercedes C300 Coupe',
    shortName: 'C300 Coupe',
    priceHint: 'Enter agreed rental total',
    summary: 'Two-door Mercedes option for weekend and event bookings.',
  },
  {
    id: 'c300-saloon',
    name: 'Mercedes C300 Saloon',
    shortName: 'C300 Saloon',
    priceHint: 'Enter agreed rental total',
    summary: 'Comfort-focused saloon for business or personal use.',
  },
  {
    id: 'v-class',
    name: 'Mercedes V Class',
    shortName: 'V Class',
    priceHint: 'Enter agreed rental total',
    summary: 'Multi-passenger option for airport and group travel.',
  },
  {
    id: 's-class',
    name: 'Mercedes S Class',
    shortName: 'S Class',
    priceHint: 'Enter agreed rental total',
    summary: 'Flagship luxury vehicle for premium chauffeur bookings.',
  },
];

export const getBookingVehicle = (vehicleId: string) =>
  bookingVehicles.find((vehicle) => vehicle.id === vehicleId) ?? bookingVehicles[0];
