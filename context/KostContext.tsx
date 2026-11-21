import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Room,
  Transaction,
  INITIAL_ROOMS,
  INITIAL_TRANSACTIONS,
  RoomStatus,
} from '../data/mockData';
import { scheduleDueReminder } from '../utils/notifications';

interface CheckInData {
  fullName: string;
  phoneWhatsapp: string;
  emergencyContact?: string;
  ktpImageUri?: string;
  checkInDate: string;
  durationMonths: number;
  rentAmount: number;
  notes?: string;
}

interface KostContextType {
  rooms: Room[];
  transactions: Transaction[];
  isLoading: boolean;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  checkInTenant: (roomId: string, data: CheckInData) => Promise<void>;
  extendRent: (roomId: string, months?: number) => Promise<void>;
  checkOutTenant: (roomId: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  resetToMockData: () => Promise<void>;
}

const STORAGE_KEY_ROOMS = '@kost_rooms_v2';
const STORAGE_KEY_TRANSACTIONS = '@kost_transactions_v2';

const KostContext = createContext<KostContextType | undefined>(undefined);

/**
 * Menghitung tanggal jatuh tempo baru berdasarkan tanggal mulai dan durasi bulan
 */
export function addMonthsToDateString(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1 + months, day);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const KostProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memuat data dari AsyncStorage saat inisialisasi aplikasi
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedRooms = await AsyncStorage.getItem(STORAGE_KEY_ROOMS);
        const storedTransactions = await AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS);

        if (storedRooms) {
          setRooms(JSON.parse(storedRooms));
        } else {
          await AsyncStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(INITIAL_ROOMS));
        }

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        } else {
          await AsyncStorage.setItem(
            STORAGE_KEY_TRANSACTIONS,
            JSON.stringify(INITIAL_TRANSACTIONS)
          );
        }
      } catch (err) {
        console.error('Gagal memuat data dari AsyncStorage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  // Simpan rooms ke storage setiap kali berubah
  const saveRooms = async (newRooms: Room[]) => {
    setRooms(newRooms);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(newRooms));
    } catch (err) {
      console.error('Gagal menyimpan kamar ke AsyncStorage:', err);
    }
  };

  // Simpan transactions ke storage setiap kali berubah
  const saveTransactions = async (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_TRANSACTIONS,
        JSON.stringify(newTransactions)
      );
    } catch (err) {
      console.error('Gagal menyimpan transaksi ke AsyncStorage:', err);
    }
  };

  /**
   * Menambah unit kamar baru
   */
  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now()}`,
    };
    const updated = [newRoom, ...rooms];
    await saveRooms(updated);
  };

  /**
   * Check-In Penghuni Baru ke Kamar
   */
  const checkInTenant = async (roomId: string, data: CheckInData) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const dueDate = addMonthsToDateString(data.checkInDate, data.durationMonths);
    const tenantId = `tenant-${Date.now()}`;

    // 1. Update data kamar
    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          status: 'occupied' as RoomStatus,
          tenantId,
          tenantName: data.fullName,
          tenantPhone: data.phoneWhatsapp,
          emergencyContact: data.emergencyContact || '',
          ktpImageUri: data.ktpImageUri || '',
          checkInDate: data.checkInDate,
          dueDate,
        };
      }
      return r;
    });

    await saveRooms(updatedRooms);

    // 2. Catat transaksi pemasukan sewa pertama
    const newTransaction: Transaction = {
      id: `tr-${Date.now()}`,
      roomId,
      roomNumber: room.number,
      tenantName: data.fullName,
      type: 'income',
      category: 'Sewa Kamar',
      amount: data.rentAmount * data.durationMonths,
      date: data.checkInDate,
      notes: data.notes || `Pembayaran sewa awal (${data.durationMonths} bulan)`,
    };

    await saveTransactions([newTransaction, ...transactions]);

    // 3. Jadwalkan pengingat jatuh tempo H-3
    scheduleDueReminder(
      room.number,
      data.fullName,
      dueDate,
      room.price
    );
  };

  /**
   * Perpanjang Masa Sewa Kamar (+1 Bulan atau lebih)
   */
  const extendRent = async (roomId: string, months: number = 1) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.tenantName) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const baseDate = room.dueDate || todayStr;
    const newDueDate = addMonthsToDateString(baseDate, months);

    // 1. Update status kamar menjadi 'occupied' & perpanjang dueDate
    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          status: 'occupied' as RoomStatus,
          dueDate: newDueDate,
        };
      }
      return r;
    });

    await saveRooms(updatedRooms);

    // 2. Catat transaksi pemasukan perpanjangan
    const newTransaction: Transaction = {
      id: `tr-${Date.now()}`,
      roomId,
      roomNumber: room.number,
      tenantName: room.tenantName,
      type: 'income',
      category: 'Sewa Kamar',
      amount: room.price * months,
      date: todayStr,
      notes: `Perpanjangan sewa kamar (${months} bulan) s.d. ${newDueDate}`,
    };

    await saveTransactions([newTransaction, ...transactions]);

    // 3. Perbarui jadwal pengingat H-3
    scheduleDueReminder(
      room.number,
      room.tenantName,
      newDueDate,
      room.price
    );
  };

  /**
   * Check-Out Penghuni (Mengosongkan Kamar)
   */
  const checkOutTenant = async (roomId: string) => {
    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          status: 'available' as RoomStatus,
          tenantId: undefined,
          tenantName: undefined,
          tenantPhone: undefined,
          emergencyContact: undefined,
          ktpImageUri: undefined,
          checkInDate: undefined,
          dueDate: undefined,
        };
      }
      return r;
    });

    await saveRooms(updatedRooms);
  };

  /**
   * Menambah Transaksi Arus Kas (Pemasukan / Pengeluaran)
   */
  const addTransaction = async (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tr-${Date.now()}`,
    };
    await saveTransactions([newTx, ...transactions]);
  };

  /**
   * Reset data ke kondisi mock awal (berguna untuk demo/testing)
   */
  const resetToMockData = async () => {
    await saveRooms(INITIAL_ROOMS);
    await saveTransactions(INITIAL_TRANSACTIONS);
  };

  return (
    <KostContext.Provider
      value={{
        rooms,
        transactions,
        isLoading,
        addRoom,
        checkInTenant,
        extendRent,
        checkOutTenant,
        addTransaction,
        resetToMockData,
      }}
    >
      {children}
    </KostContext.Provider>
  );
};

export const useKost = () => {
  const context = useContext(KostContext);
  if (!context) {
    throw new Error('useKost harus digunakan di dalam KostProvider');
  }
  return context;
};
