import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useKost } from '../../context/KostContext';
import { Room } from '../../data/mockData';

export const TenantsTab = React.memo(function TenantsTab() {
  const router = useRouter();
  const { rooms } = useKost();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due_soon' | 'active'>('all');

  // KTP Viewer Modal
  const [selectedKtp, setSelectedKtp] = useState<{ name: string; uri: string } | null>(null);

  // Ambil hanya kamar yang ada penghuninya
  const activeTenants = rooms.filter(
    (r) => r.status !== 'available' && !!r.tenantName
  );

  // Filter berdasarkan search query dan tab filter
  const filteredTenants = activeTenants.filter((r) => {
    const matchesSearch =
      (r.tenantName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (r.number.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'due_soon') {
      return r.status === 'due_soon';
    }
    if (filterType === 'active') {
      return r.status === 'occupied';
    }
    return true;
  });

  const dueSoonCount = activeTenants.filter((r) => r.status === 'due_soon').length;
  const occupiedCount = activeTenants.filter((r) => r.status === 'occupied').length;

  const handleWhatsApp = (room: Room) => {
    if (!room.tenantPhone) return;
    const phone = room.tenantPhone.startsWith('0')
      ? `62${room.tenantPhone.slice(1)}`
      : room.tenantPhone;
    const message = `Halo Kak ${room.tenantName}, salam dari Pengelola Kos Griya Makmur.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const handleCall = (room: Room) => {
    if (!room.tenantPhone) return;
    Linking.openURL(`tel:${room.tenantPhone}`);
  };

  const handleShowKtp = (room: Room) => {
    if (room.ktpImageUri) {
      setSelectedKtp({
        name: room.tenantName || 'Penghuni',
        uri: room.ktpImageUri,
      });
    } else {
      Alert.alert(
        'Foto KTP Belum Diunggah',
        'Penghuni ini belum memiliki foto KTP. Anda dapat mengunggahnya melalui halaman Detail Kamar.'
      );
    }
  };

  const renderTenantItem = ({ item }: { item: Room }) => {
    const isDueSoon = item.status === 'due_soon';

    return (
      <View style={[styles.card, isDueSoon && styles.cardDueSoon]}>
        {/* Header Kartu */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={19} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.tenantName}>{item.tenantName}</Text>
              <Text style={styles.roomBadge}>
                Kamar {item.number} • Lantai {item.floor}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isDueSoon ? '#FEE2E2' : '#DCFCE7' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isDueSoon ? '#991B1B' : '#166534' },
              ]}
            >
              {isDueSoon ? 'Jatuh Tempo' : 'Sewa Lancar'}
            </Text>
          </View>
        </View>

        {/* Informasi Kontak & Jadwal */}
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color="#0284C7" />
            <Text style={styles.infoText}>{item.tenantPhone || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={1}>
              Darurat: {item.emergencyContact || '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="log-in-outline" size={14} color="#64748B" />
            <Text style={styles.infoText}>Masuk: {item.checkInDate || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isDueSoon ? '#DC2626' : '#64748B'}
            />
            <Text
              style={[
                styles.infoText,
                isDueSoon && { color: '#DC2626', fontWeight: '800' },
              ]}
            >
              Tempo: {item.dueDate || '-'}
            </Text>
          </View>
        </View>

        {/* Tombol Aksi Cepat */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btnAction, styles.btnWa]}
            onPress={() => handleWhatsApp(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={13} color="#FFFFFF" />
            <Text style={styles.btnActionText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, styles.btnCall]}
            onPress={() => handleCall(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={13} color="#0284C7" />
            <Text style={[styles.btnActionText, { color: '#0284C7' }]}>Telepon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, styles.btnKtp]}
            onPress={() => handleShowKtp(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="id-card-outline" size={13} color="#0284C7" />
            <Text style={[styles.btnActionText, { color: '#0284C7' }]}>KTP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAction, styles.btnDetail]}
            onPress={() => router.push({ pathname: '/room/[id]', params: { id: item.id } })}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
            <Text style={[styles.btnActionText, { color: '#FFFFFF' }]}>Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandSubtitle}>DATA PENGHUNI AKTIF</Text>
        <Text style={styles.title}>Daftar Penghuni Kos</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#0284C7" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama penghuni atau nomor kamar..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'all' && styles.filterBtnActive]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterText,
              filterType === 'all' && styles.filterTextActive,
            ]}
          >
            Semua ({activeTenants.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'due_soon' && styles.filterBtnActive]}
          onPress={() => setFilterType('due_soon')}
        >
          <Text
            style={[
              styles.filterText,
              filterType === 'due_soon' && styles.filterTextActive,
            ]}
          >
            Jatuh Tempo ({dueSoonCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'active' && styles.filterBtnActive]}
          onPress={() => setFilterType('active')}
        >
          <Text
            style={[
              styles.filterText,
              filterType === 'active' && styles.filterTextActive,
            ]}
          >
            Lancar ({occupiedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tenants List */}
      <FlatList
        data={filteredTenants}
        keyExtractor={(item) => item.id}
        renderItem={renderTenantItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Tidak Ada Data Penghuni</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Tidak ditemukan penghuni dengan kata kunci tersebut.'
                : 'Belum ada penghuni aktif di kos ini.'}
            </Text>
          </View>
        }
      />

      {/* Modal Lihat KTP */}
      <Modal
        visible={!!selectedKtp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedKtp(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>KTP Penghuni</Text>
                <Text style={styles.modalSub}>{selectedKtp?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedKtp(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedKtp?.uri ? (
              <Image
                source={{ uri: selectedKtp.uri }}
                style={styles.ktpImageFull}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  brandSubtitle: { fontSize: 10.5, fontWeight: '800', color: '#0284C7', letterSpacing: 0.8 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 42, fontSize: 13, color: '#0F172A' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
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
  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 6 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  cardDueSoon: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F9FF',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  roomBadge: { fontSize: 11, color: '#0284C7', fontWeight: '700', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  infoGrid: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#475569', flex: 1 },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F9FF',
    paddingTop: 10,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnWa: { backgroundColor: '#16A34A' },
  btnCall: { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' },
  btnKtp: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' },
  btnDetail: { backgroundColor: '#0284C7' },
  btnActionText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B' },
  closeBtn: { padding: 4 },
  ktpImageFull: { width: '100%', height: 260, borderRadius: 12 },

  // Empty state
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});
