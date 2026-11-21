export type RoomStatus = 'available' | 'occupied' | 'due_soon';
export type TransactionType = 'income' | 'expense';
export type TransactionCategory =
  | 'Sewa Kamar'
  | 'Deposit'
  | 'Perbaikan'
  | 'Listrik & Air'
  | 'Kebersihan'
  | 'Lainnya';

export interface Room {
  id: string;
  number: string;
  floor: number;
  price: number;
  status: RoomStatus;
  facilities: string[];
  tenantId?: string;
  tenantName?: string;
  tenantPhone?: string;
  emergencyContact?: string;
  ktpImageUri?: string;
  checkInDate?: string;
  dueDate?: string;
}

export interface Transaction {
  id: string;
  roomId?: string;
  roomNumber?: string;
  tenantName?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export const INITIAL_ROOMS: Room[] = [
  {
    id: '1',
    number: 'A-01',
    floor: 1,
    price: 850000,
    status: 'occupied',
    facilities: ['Kasur', 'Lemari', 'Kamar Mandi Dalam', 'WiFi'],
    tenantId: 't-1',
    tenantName: 'Budi Santoso',
    tenantPhone: '081234567890',
    emergencyContact: '081211112222 (Orang Tua)',
    checkInDate: '2026-10-05',
    dueDate: '2026-12-05',
  },
  {
    id: '2',
    number: 'A-02',
    floor: 1,
    price: 850000,
    status: 'due_soon',
    facilities: ['Kasur', 'Lemari', 'Kamar Mandi Dalam', 'WiFi'],
    tenantId: 't-2',
    tenantName: 'Rina Wijaya',
    tenantPhone: '081298765432',
    emergencyContact: '081399887766 (Kakak)',
    checkInDate: '2026-10-23',
    dueDate: '2026-11-23',
  },
  {
    id: '3',
    number: 'A-03',
    floor: 1,
    price: 900000,
    status: 'available',
    facilities: ['Kasur', 'Lemari', 'AC', 'Kamar Mandi Luar', 'WiFi'],
  },
  {
    id: '4',
    number: 'B-01',
    floor: 2,
    price: 950000,
    status: 'occupied',
    facilities: ['Kasur', 'Lemari', 'AC', 'Kamar Mandi Dalam', 'WiFi'],
    tenantId: 't-4',
    tenantName: 'Dimas Pratama',
    tenantPhone: '085611223344',
    emergencyContact: '085722334455 (Ibu)',
    checkInDate: '2026-10-12',
    dueDate: '2026-12-12',
  },
  {
    id: '5',
    number: 'B-02',
    floor: 2,
    price: 950000,
    status: 'available',
    facilities: ['Kasur', 'Lemari', 'AC', 'Kamar Mandi Dalam', 'WiFi'],
  },
  {
    id: '6',
    number: 'B-03',
    floor: 2,
    price: 950000,
    status: 'due_soon',
    facilities: ['Kasur', 'Lemari', 'AC', 'Kamar Mandi Dalam', 'WiFi'],
    tenantId: 't-6',
    tenantName: 'Siti Aminah',
    tenantPhone: '087755667788',
    emergencyContact: '087812344321 (Ayah)',
    checkInDate: '2026-10-24',
    dueDate: '2026-11-24',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tr-1',
    roomId: '1',
    roomNumber: 'A-01',
    tenantName: 'Budi Santoso',
    type: 'income',
    category: 'Sewa Kamar',
    amount: 850000,
    date: '2026-11-05',
    notes: 'Pembayaran sewa bulan November 2026',
  },
  {
    id: 'tr-2',
    roomId: '4',
    roomNumber: 'B-01',
    tenantName: 'Dimas Pratama',
    type: 'income',
    category: 'Sewa Kamar',
    amount: 950000,
    date: '2026-11-12',
    notes: 'Pembayaran sewa bulan November 2026',
  },
  {
    id: 'tr-3',
    roomId: '2',
    roomNumber: 'A-02',
    tenantName: 'Rina Wijaya',
    type: 'income',
    category: 'Sewa Kamar',
    amount: 850000,
    date: '2026-10-23',
    notes: 'Pembayaran sewa bulan Oktober 2026',
  },
  {
    id: 'tr-4',
    type: 'expense',
    category: 'Listrik & Air',
    amount: 320000,
    date: '2026-11-10',
    notes: 'Tagihan Token Listrik Utama & Air PDAM',
  },
  {
    id: 'tr-5',
    roomId: '4',
    roomNumber: 'B-01',
    type: 'expense',
    category: 'Perbaikan',
    amount: 150000,
    date: '2026-11-15',
    notes: 'Servis dan cuci AC Kamar B-01',
  },
  {
    id: 'tr-6',
    type: 'expense',
    category: 'Kebersihan',
    amount: 100000,
    date: '2026-11-18',
    notes: 'Iuran Sampah & Kebersihan Lingkungan',
  },
];
