import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Konfigurasi agar notifikasi tampil saat aplikasi aktif di latar depan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Meminta izin notifikasi ke sistem operasi perangkat
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Izin notifikasi tidak diberikan oleh pengguna');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('kost-reminders', {
        name: 'Pengingat Jatuh Tempo Kos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    return true;
  } catch (error) {
    console.error('Error saat meminta izin notifikasi:', error);
    return false;
  }
}

/**
 * Menjadwalkan pengingat jatuh tempo lokal pada H-3 pukul 09:00 pagi
 */
export async function scheduleDueReminder(
  roomNumber: string,
  tenantName: string,
  dueDateStr: string,
  rentAmount: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Parse dueDate (format YYYY-MM-DD)
    const [year, month, day] = dueDateStr.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day, 9, 0, 0);

    // Hitung H-3 pukul 09.00
    const reminderDate = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    reminderDate.setHours(9, 0, 0, 0);

    const now = new Date();
    // Jika tanggal H-3 sudah lewat, jadwalkan 10 detik dari sekarang sebagai demonstrasi
    const triggerDate = reminderDate > now ? reminderDate : new Date(now.getTime() + 10 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Tagihan Sewa Kamar ${roomNumber} Segera Jatuh Tempo`,
        body: `Pembayaran sewa atas nama ${tenantName} sebesar Rp${rentAmount.toLocaleString('id-ID')} akan jatuh tempo pada ${dueDateStr}. Segera kirimkan pengingat WhatsApp.`,
        sound: true,
        data: { roomNumber, tenantName, dueDate: dueDateStr },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === 'android' ? 'kost-reminders' : undefined,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Gagal menjadwalkan notifikasi pengingat:', error);
    return null;
  }
}
