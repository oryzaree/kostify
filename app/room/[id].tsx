import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useKost } from '../../context/KostContext';
import { generateAndShareReceipt } from '../../utils/receiptGenerator';

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, checkInTenant, extendRent, checkOutTenant, transactions } = useKost();

  const room = rooms.find((r) => r.id === id);

  // Form Check-In State
  const [fullName, setFullName] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [checkInDate, setCheckInDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [durationMonths, setDurationMonths] = useState(1);
  const [ktpImageUri, setKtpImageUri] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // KTP Modal Viewer
  const [ktpModalVisible, setKtpModalVisible] = useState(false);

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text style={styles.notFoundText}>Kamar tidak ditemukan</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pilih foto KTP via Kamera atau Galeri
  const handlePickKtp = async (type: 'camera' | 'gallery') => {
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Dibutuhkan', 'Izin kamera diperlukan untuk mengambil foto KTP.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setKtpImageUri(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Dibutuhkan', 'Izin galeri diperlukan untuk memilih foto KTP.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setKtpImageUri(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error saat mengambil foto KTP:', error);
      Alert.alert('Error', 'Gagal memuat foto KTP.');
    }
  };

  // Submit Check-In
  const handleCheckInSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap penghuni wajib diisi!');
      return;
    }
    if (!phoneWhatsapp.trim()) {
      Alert.alert('Perhatian', 'Nomor WhatsApp wajib diisi!');
      return;
    }

    await checkInTenant(room.id, {
      fullName: fullName.trim(),
      phoneWhatsapp: phoneWhatsapp.trim(),
      emergencyContact: emergencyContact.trim(),
      ktpImageUri,
      checkInDate,
      durationMonths,
      rentAmount: room.price,
      notes,
    });

    Alert.alert(
      'Check-In Berhasil!',
      `Kamar ${room.number} kini resmi dihuni oleh ${fullName.trim()}. Transaksi sewa awal telah otomatis dicatat.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  // Submit Perpanjang Sewa
  const handleExtendRent = () => {
    Alert.alert(
      'Konfirmasi Perpanjang Sewa',
      `Perpanjang sewa Kamar ${room.number} (+1 Bulan) sebesar Rp${room.price.toLocaleString('id-ID')}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Perpanjang & Catat Lunas',
          onPress: async () => {
            await extendRent(room.id, 1);
            Alert.alert('Sukses', 'Masa sewa berhasil diperpanjang 1 bulan dan transaksi pembayaran telah dicatat!');
          },
        },
      ]
    );
  };

  // Kirim Pengingat WhatsApp
  const handleWhatsAppReminder = () => {
    if (!room.tenantPhone || !room.tenantName) return;
    const phone = room.tenantPhone.startsWith('0')
      ? `62${room.tenantPhone.slice(1)}`
      : room.tenantPhone;
    const message = `Halo Kak ${room.tenantName}, salam dari Manajemen Kos Griya Makmur 🙏\n\nSekadar menginformasikan bahwa pembayaran sewa Kamar ${room.number} sebesar *Rp${room.price.toLocaleString('id-ID')}* akan jatuh tempo pada tanggal *${room.dueDate}*.\n\nPembayaran dapat ditransfer melalui:\nBCA: 123-456-7890 a.n. Pemilik Kos\n\nMohon kirimkan bukti transfer jika sudah melakukan pembayaran ya Kak. Terima kasih banyak!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  // Kirim Kuitansi PDF
  const handlePrintReceipt = async () => {
    const rentTx = transactions.find(
      (t) => t.roomId === room.id && t.type === 'income'
    );
    if (rentTx) {
      await generateAndShareReceipt(rentTx);
    } else {
      await generateAndShareReceipt({
        id: `INV-${room.id}-${Date.now().toString().slice(-4)}`,
        roomId: room.id,
        roomNumber: room.number,
        tenantName: room.tenantName || 'Penghuni',
        type: 'income',
        category: 'Sewa Kamar',
        amount: room.price,
        date: room.dueDate || new Date().toISOString().split('T')[0],
        notes: `Pembayaran sewa Kamar ${room.number}`,
      });
    }
  };

  // Check-Out Penghuni
  const handleCheckOut = () => {
    Alert.alert(
      'Konfirmasi Check-Out',
      `Apakah Anda yakin penghuni ${room.tenantName} telah keluar dan Kamar ${room.number} akan dikosongkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Check-Out',
          style: 'destructive',
          onPress: async () => {
            await checkOutTenant(room.id);
            Alert.alert('Sukses', `Kamar ${room.number} kini telah kembali berstatus Kosong (Siap Huni).`, [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const isAvailable = room.status === 'available';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Kamar {room.number}</Text>
          <Text style={styles.headerSub}>Lantai {room.floor} - Kos Griya Makmur</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isAvailable
                ? '#DCFCE7'
                : room.status === 'due_soon'
                ? '#FEE2E2'
                : '#E0F2FE',
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color: isAvailable
                  ? '#166534'
                  : room.status === 'due_soon'
                  ? '#991B1B'
                  : '#0284C7',
              },
            ]}
          >
            {isAvailable ? 'Kosong' : room.status === 'due_soon' ? 'Jatuh Tempo' : 'Terisi'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Spesifikasi Kamar */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Spesifikasi Unit</Text>
            <View style={styles.specRow}>
              <View style={styles.specItem}>
                <Ionicons name="pricetag-outline" size={16} color="#64748B" />
                <View>
                  <Text style={styles.specLabel}>Harga Sewa</Text>
                  <Text style={styles.specVal}>
                    Rp{room.price.toLocaleString('id-ID')}/bln
                  </Text>
                </View>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="business-outline" size={16} color="#64748B" />
                <View>
                  <Text style={styles.specLabel}>Lokasi</Text>
                  <Text style={styles.specVal}>Lantai {room.floor}</Text>
                </View>
              </View>
            </View>

            <View style={styles.facilitiesContainer}>
              <Text style={styles.specLabel}>Fasilitas Kamar:</Text>
              <View style={styles.facilityTags}>
                {room.facilities.map((fac, idx) => (
                  <View key={idx} style={styles.facilityTag}>
                    <Ionicons name="checkmark-circle" size={12} color="#64748B" />
                    <Text style={styles.facilityTagText}>{fac}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* KONDISI 1: KAMAR KOSONG -> FORM CHECK-IN */}
          {isAvailable ? (
            <View style={styles.card}>
              <View style={styles.formHeaderRow}>
                <Ionicons name="person-add" size={20} color="#0F172A" />
                <Text style={styles.cardSectionTitle}>Form Check-In Penghuni Baru</Text>
              </View>
              <Text style={styles.formSub}>
                Isi data calon penghuni untuk langsung mendaftarkan kamar dan mencatat sewa.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Nama Lengkap Penghuni *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Muhammad Farhan"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>No. Handphone / WhatsApp *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 081234567890"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phoneWhatsapp}
                  onChangeText={setPhoneWhatsapp}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Kontak Darurat (Keluarga/Kerabat)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 081399887766 (Ibu)"
                  placeholderTextColor="#94A3B8"
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Tanggal Masuk</Text>
                  <TextInput
                    style={styles.textInput}
                    value={checkInDate}
                    onChangeText={setCheckInDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Durasi Sewa Awal</Text>
                <View style={styles.durationRow}>
                  {[1, 3, 6, 12].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.durationBtn,
                        durationMonths === m && styles.durationBtnActive,
                      ]}
                      onPress={() => setDurationMonths(m)}
                    >
                      <Text
                        style={[
                          styles.durationBtnText,
                          durationMonths === m && styles.durationBtnTextActive,
                        ]}
                      >
                        {m} Bulan
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Upload Foto KTP */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Foto KTP Penghuni</Text>
                {ktpImageUri ? (
                  <View style={styles.ktpPreviewBox}>
                    <Image source={{ uri: ktpImageUri }} style={styles.ktpPreviewImage} />
                    <TouchableOpacity
                      style={styles.removeKtpBtn}
                      onPress={() => setKtpImageUri(undefined)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.removeKtpText}>Hapus Foto</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.ktpPickerRow}>
                    <TouchableOpacity
                      style={styles.pickKtpBtn}
                      onPress={() => handlePickKtp('camera')}
                    >
                      <Ionicons name="camera" size={18} color="#64748B" />
                      <Text style={styles.pickKtpText}>Buka Kamera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickKtpBtn}
                      onPress={() => handlePickKtp('gallery')}
                    >
                      <Ionicons name="images" size={18} color="#64748B" />
                      <Text style={styles.pickKtpText}>Pilih Galeri</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Total Ringkasan */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tarif Sewa ({durationMonths} Bulan):</Text>
                  <Text style={styles.summaryValue}>
                    Rp{(room.price * durationMonths).toLocaleString('id-ID')}
                  </Text>
                </View>
                <Text style={styles.summaryHint}>
                  *Otomatis dicatat sebagai pemasukan kas & dijadwalkan notifikasi jatuh tempo.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkInSubmitBtn}
                onPress={handleCheckInSubmit}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                <Text style={styles.checkInSubmitText}>Simpan & Check-In Penghuni</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* KONDISI 2: KAMAR TERISI -> DETAIL PENGHUNI & AKSI */
            <View>
              {/* Profil Penghuni */}
              <View style={styles.card}>
                <View style={styles.formHeaderRow}>
                  <Ionicons name="person" size={20} color="#0284C7" />
                  <Text style={styles.cardSectionTitle}>Data Penghuni Aktif</Text>
                </View>

                <View style={styles.tenantDetailItem}>
                  <Text style={styles.tenantDetailLabel}>Nama Lengkap</Text>
                  <Text style={styles.tenantDetailVal}>{room.tenantName}</Text>
                </View>

                <View style={styles.tenantDetailItem}>
                  <Text style={styles.tenantDetailLabel}>Nomor WhatsApp</Text>
                  <Text style={styles.tenantDetailVal}>{room.tenantPhone || '-'}</Text>
                </View>

                <View style={styles.tenantDetailItem}>
                  <Text style={styles.tenantDetailLabel}>Kontak Darurat</Text>
                  <Text style={styles.tenantDetailVal}>{room.emergencyContact || '-'}</Text>
                </View>

                <View style={styles.tenantDetailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tenantDetailLabel}>Tanggal Masuk</Text>
                    <Text style={styles.tenantDetailVal}>{room.checkInDate || '-'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tenantDetailLabel}>Jatuh Tempo</Text>
                    <Text
                      style={[
                        styles.tenantDetailVal,
                        room.status === 'due_soon' && { color: '#DC2626', fontWeight: '800' },
                      ]}
                    >
                      {room.dueDate || '-'}
                    </Text>
                  </View>
                </View>

                {/* Foto KTP */}
                <View style={styles.ktpStatusSection}>
                  <Text style={styles.tenantDetailLabel}>Dokumen Identitas (KTP)</Text>
                  {room.ktpImageUri ? (
                    <TouchableOpacity
                      style={styles.viewKtpBtn}
                      onPress={() => setKtpModalVisible(true)}
                    >
                      <Ionicons name="id-card-outline" size={16} color="#0284C7" />
                      <Text style={styles.viewKtpText}>Lihat Foto KTP</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noKtpText}>Foto KTP belum diunggah</Text>
                  )}
                </View>
              </View>

              {/* Aksi Operasional Kamar */}
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>Aksi & Manajemen</Text>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#0284C7' }]}
                  onPress={handleExtendRent}
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar" size={18} color="#FFFFFF" />
                  <View style={styles.actionBtnTextWrap}>
                    <Text style={styles.actionBtnTitle}>Perpanjang Sewa (+1 Bulan)</Text>
                    <Text style={styles.actionBtnSub}>
                      Otomatis catat pembayaran & perbarui jatuh tempo
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#16A34A', marginTop: 10 }]}
                  onPress={handleWhatsAppReminder}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <View style={styles.actionBtnTextWrap}>
                    <Text style={styles.actionBtnTitle}>Ingatkan via WhatsApp</Text>
                    <Text style={styles.actionBtnSub}>Kirim pesan tagihan resmi ke penghuni</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#0369A1', marginTop: 10 }]}
                  onPress={handlePrintReceipt}
                  activeOpacity={0.85}
                >
                  <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                  <View style={styles.actionBtnTextWrap}>
                    <Text style={styles.actionBtnTitle}>Kirim Kuitansi Digital (PDF)</Text>
                    <Text style={styles.actionBtnSub}>Generate file PDF resmi berstempel LUNAS</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtnDanger, { marginTop: 12 }]}
                  onPress={handleCheckOut}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.actionBtnDangerText}>Check-Out Penghuni (Kosongkan Kamar)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Foto KTP */}
      <Modal visible={ktpModalVisible} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Foto KTP Penghuni</Text>
              <TouchableOpacity onPress={() => setKtpModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            {room.ktpImageUri ? (
              <Image
                source={{ uri: room.ktpImageUri }}
                style={styles.imageModalPhoto}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              style={styles.imageModalCloseBtn}
              onPress={() => setKtpModalVisible(false)}
            >
              <Text style={styles.imageModalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    marginRight: 4,
  },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  specRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  specLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  specVal: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  facilitiesContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  facilityTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  facilityTagText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  // Form checkin
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  formSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  formGroup: { marginBottom: 12 },
  formRow: { flexDirection: 'row' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 5 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  durationBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  durationBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  ktpPickerRow: { flexDirection: 'row', gap: 10 },
  pickKtpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  pickKtpText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  ktpPreviewBox: { position: 'relative', borderRadius: 10, overflow: 'hidden' },
  ktpPreviewImage: { width: '100%', height: 180, borderRadius: 10 },
  removeKtpBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeKtpText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    marginBottom: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  summaryValue: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  summaryHint: { fontSize: 10, color: '#64748B', marginTop: 4 },
  checkInSubmitBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    elevation: 3,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  checkInSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Detail Penghuni
  tenantDetailItem: { marginBottom: 10 },
  tenantDetailRow: { flexDirection: 'row', marginBottom: 10 },
  tenantDetailLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  tenantDetailVal: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  ktpStatusSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F9FF',
  },
  viewKtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewKtpText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
  noKtpText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },

  // Aksi Buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
  },
  actionBtnTextWrap: { flex: 1 },
  actionBtnTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  actionBtnSub: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 10, marginTop: 1 },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 6,
  },
  actionBtnDangerText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },

  // Image Modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageModalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageModalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  imageModalPhoto: { width: '100%', height: 220, borderRadius: 12 },
  imageModalCloseBtn: {
    marginTop: 14,
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageModalCloseText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notFoundText: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 8 },
  backBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0284C7',
    borderRadius: 10,
  },
  backBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
