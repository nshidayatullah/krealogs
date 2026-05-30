export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  type: 'event' | 'wedding' | 'both';
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface BookingDay {
  date: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  addons: string[];
  addonDetails: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  eventType: 'event' | 'wedding';
  weddingType?: string;
  eventDate: string;
  venueLocation: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  addons: string[]; // array of ID
  addonDetails: {
    id: string;
    name: string;
    price: number;
  }[];
  days?: BookingDay[];
  paymentMethod: 'full' | 'dp_50' | 'dp_custom';
  totalPrice: number;
  amountPaid: number;
  remainingPayment: number;
  status: 'pending' | 'approved' | 'dp_paid' | 'paid' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface SpreadsheetConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
}

export interface DBStructure {
  packages: Package[];
  addons: Addon[];
  bookings: Booking[];
  spreadsheetConfig: SpreadsheetConfig;
}
