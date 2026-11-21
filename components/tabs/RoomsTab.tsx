import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useKost } from '../../context/KostContext';
import { Room, RoomStatus } from '../../data/mockData';

const COMMON_FACILITIES = [
  'Kasur',
  'Lemari',
  'AC',
  'Kamar Mandi Dalam',
  'Kamar Mandi Luar',
  'WiFi',
  'Meja Kerja',
  'Water Heater',
];

export const RoomsTab = React.memo(function RoomsTab() {
  const router = useRouter();
  const { rooms, addRoom } = useKost();
  const [filter, setFilter] = useState<'all' | RoomStatus>('all');

  // Modal Tambah Kamar State
  const [modalVisible, setModalVisible] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newFloor, setNewFloor] = useState('1');
  const [newPrice, setNewPrice] = useState('850000');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'Kasur',
    'Lemari',
    'WiFi',
  ]);

  const filteredRooms =
    filter === 'all' ? rooms : rooms.filter((r) => r.status === filter);

  const countByStatus = (status: RoomStatus) =>
    rooms.filter((r) => r.status === status).length;

  const sendWhatsAppReminder = (room: Room) => {
    if (!room.tenantPhone || !room.tenantName) return;
    const phone = room.tenantPhone.startsWith('0')
      ? `62${room.tenantPhone.slice(1)}`
      : room.tenantPhone;
    const message = `Halo Kak ${room.tenantName}, sekadar mengingatkan bahwa pembayaran sewa Kamar ${room.number} sebesar Rp${room.price.toLocaleString('id-ID')} akan jatuh tempo pada ${room.dueDate}. Terima kasih! 🙏`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const getStatusConfig = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Kosong',
          bg: '#DCFCE7',
          text: '#166534',
          border: '#86EFAC',
          icon: 'radio-button-off' as const,
        };
      case 'occupied':
        return {
          label: 'Terisi',
          bg: '#E0F2FE',
          text: '#0284C7',
          border: '#BAE6FD',
          icon: 'person' as const,
        };
      case 'due_soon':
      default:
        return {
          label: 'Jatuh Tempo',
          bg: '#FEE2E2',
          text: '#991B1B',
          border: '#FCA5A5',
          icon: 'alert-circle' as const,
        };
    }
  };

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const handleSaveNewRoom = async () => {
    if (!newNumber.trim()) {
      Alert.alert('Perhatian', 'Nomor kamar wajib diisi!');
      return;
    }
    const priceNum = parseInt(newPrice.replace(/[^0-9]/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Perhatian', 'Harga sewa tidak valid!');
      return;
    }

    await addRoom({
      number: newNumber.trim(),
      floor: parseInt(newFloor, 10) || 1,
      price: priceNum,
      status: 'available',
      facilities: selectedFacilities,
    });

    setModalVisible(false);
    setNewNumber('');
    setNewFloor('1');
    setNewPrice('850000');
    Alert.alert('Sukses', `Kamar ${newNumber.trim()} berhasil ditambahkan!`);
  };

  const renderRoomCard = ({ item }: { item: Room }) => {
    const config = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: '/room/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.roomNumber}>{item.number}</Text>
            <Text style={styles.floorBadge}>Lantai {item.floor}</Text>
          </View>
          {/* Bagian Status yang Memiliki Warna */}
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={11} color={config.text} style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: config.text }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <Text style={styles.price}>
          Rp{item.price.toLocaleString('id-ID')}<Text style={styles.priceUnit}>/bln</Text>
        </Text>

        {item.status === 'available' ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyRow}>
              <Ionicons name="sparkles-outline" size={13} color="#64748B" />
              <Text style={styles.emptyText}>Siap Huni</Text>
            </View>
            <Text style={styles.tapPrompt}>Ketuk untuk Check-In</Text>
          </View>
        ) : (
          <View style={styles.tenantInfo}>
            <View style={styles.tenantRow}>
              <Ionicons name="person-circle-outline" size={15} color="#64748B" />
              <Text style={styles.tenantName} numberOfLines={1}>
                {item.tenantName || 'Penghuni'}
              </Text>
            </View>
            <View style={styles.tenantRow}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.dueText}>
                Tempo: {item.dueDate || '-'}
              </Text>
            </View>

            {item.status === 'due_soon' && (
              <TouchableOpacity
                style={styles.waButton}
                onPress={() => sendWhatsAppReminder(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={13} color="#FFFFFF" />
                <Text style={styles.waButtonText}>Ingatkan WA</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Halaman */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandSubtitle}>KOS GRIYA MAKMUR</Text>
          <Text style={styles.title}>Manajemen Kamar</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnHeaderText}>Kamar Baru</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Box Ringkasan Cepat Terpisah */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{rooms.length}</Text>
          <Text style={styles.statLabel}>Total Unit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{countByStatus('occupied')}</Text>
          <Text style={styles.statLabel}>Terisi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{countByStatus('available')}</Text>
          <Text style={styles.statLabel}>Kosong</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.statNumberDanger]}>
            {countByStatus('due_soon')}
          </Text>
          <Text style={styles.statLabel}>Jatuh Tempo</Text>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `Semua (${rooms.length})` },
          { key: 'available', label: `Kosong (${countByStatus('available')})` },
          { key: 'occupied', label: `Terisi (${countByStatus('occupied')})` },
          { key: 'due_soon', label: `Tempo (${countByStatus('due_soon')})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterBtn,
              filter === tab.key && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(tab.key as 'all' | RoomStatus)}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab.key && styles.filterTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid Kamar 2 Kolom */}
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* MODAL TAMBAH KAMAR BARU */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tambah Unit Kamar</Text>
                <Text style={styles.modalSubtitle}>Masukkan rincian unit kos baru</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 2, marginRight: 10 }]}>
                  <Text style={styles.label}>Nomor / Kode Kamar *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 104 / B2"
                    placeholderTextColor="#94A3B8"
                    value={newNumber}
                    onChangeText={setNewNumber}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Lantai *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newFloor}
                    onChangeText={setNewFloor}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Harga Sewa / Bln (Rp) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="900000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newPrice}
                    onChangeText={setNewPrice}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fasilitas Kamar:</Text>
                <View style={styles.facilityPills}>
                  {COMMON_FACILITIES.map((f) => {
                    const active = selectedFacilities.includes(f);
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.facilityPill,
                          active && styles.facilityPillActive,
                        ]}
                        onPress={() => toggleFacility(f)}
                      >
                        <Ionicons
                          name={active ? 'checkmark-circle' : 'ellipse-outline'}
                          size={13}
                          color={active ? '#FFFFFF' : '#94A3B8'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.facilityPillText,
                            active && styles.facilityPillTextActive,
                          ]}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveNewRoom}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.submitBtnText}>Simpan Kamar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  addBtnHeader: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statNumber: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  statNumberDanger: { color: '#DC2626' },
  statLabel: { fontSize: 9.5, color: '#64748B', marginTop: 2, fontWeight: '600', textAlign: 'center' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },
  gridRow: { justifyContent: 'space-between', marginBottom: 14 },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomNumber: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  floorBadge: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 6, marginBottom: 8 },
  priceUnit: { fontSize: 10, fontWeight: '400', color: '#64748B' },
  emptyContainer: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emptyText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  tapPrompt: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  tenantInfo: { gap: 4, marginTop: 2 },
  tenantRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tenantName: { fontSize: 12, fontWeight: '700', color: '#1E293B', flex: 1 },
  dueText: { fontSize: 11, color: '#64748B' },
  dueTextDanger: { color: '#DC2626', fontWeight: '700' },
  waButton: {
    marginTop: 6,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  waButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F9FF',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { padding: 4 },
  formGroup: { marginBottom: 14 },
  formRow: { flexDirection: 'row', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  facilityPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facilityPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  facilityPillText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  facilityPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
