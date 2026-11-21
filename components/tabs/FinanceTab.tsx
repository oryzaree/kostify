import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKost } from '../../context/KostContext';
import { Transaction, TransactionType, TransactionCategory } from '../../data/mockData';
import { generateAndShareReceipt } from '../../utils/receiptGenerator';

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Perbaikan',
  'Listrik & Air',
  'Kebersihan',
  'Lainnya',
];

const INCOME_CATEGORIES: TransactionCategory[] = [
  'Sewa Kamar',
  'Deposit',
  'Lainnya',
];

export const FinanceTab = React.memo(function FinanceTab() {
  const { transactions, rooms, addTransaction } = useKost();

  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Modal Tambah Transaksi
  const [modalVisible, setModalVisible] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Perbaikan');
  const [amount, setAmount] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [tenantNameInput, setTenantNameInput] = useState('');
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notesInput, setNotesInput] = useState('');

  // Hitung Total Pemasukan, Pengeluaran & Laba Bersih
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Rasio Pemasukan vs Pengeluaran untuk progress bar
  const totalFlow = totalIncome + totalExpense;
  const incomeRatio = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 50;

  // Filter transaksi
  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'income') return t.type === 'income';
    if (activeFilter === 'expense') return t.type === 'expense';
    return true;
  });

  const getCategoryIcon = (cat: TransactionCategory, type: TransactionType) => {
    switch (cat) {
      case 'Sewa Kamar':
        return 'home';
      case 'Deposit':
        return 'shield-checkmark';
      case 'Perbaikan':
        return 'construct';
      case 'Listrik & Air':
        return 'flash';
      case 'Kebersihan':
        return 'sparkles';
      default:
        return type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle';
    }
  };

  const handleSaveTransaction = async () => {
    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Perhatian', 'Jumlah nominal uang wajib diisi dengan benar!');
      return;
    }

    await addTransaction({
      type: txType,
      category,
      amount: parsedAmount,
      date: dateInput,
      roomNumber: selectedRoomNumber || undefined,
      tenantName: tenantNameInput.trim() || undefined,
      notes: notesInput.trim() || undefined,
    });

    setModalVisible(false);
    setAmount('');
    setSelectedRoomNumber('');
    setTenantNameInput('');
    setNotesInput('');
    Alert.alert(
      'Sukses',
      `Transaksi ${txType === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp${parsedAmount.toLocaleString('id-ID')} berhasil dicatat.`
    );
  };

  const handleGenerateReceipt = async (item: Transaction) => {
    try {
      await generateAndShareReceipt(item);
    } catch {
      Alert.alert('Gagal', 'Terjadi kesalahan saat membuat kuitansi digital.');
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const iconName = getCategoryIcon(item.category, item.type);

    return (
      <View style={styles.txCard}>
        <View style={styles.txCardLeft}>
          <View
            style={[
              styles.txIconBox,
              { backgroundColor: isIncome ? '#DCFCE7' : '#FEE2E2' },
            ]}
          >
            <Ionicons
              name={iconName}
              size={18}
              color={isIncome ? '#16A34A' : '#DC2626'}
            />
          </View>
          <View style={styles.txDetails}>
            <View style={styles.txHeaderRow}>
              <Text style={styles.txCategory}>{item.category}</Text>
              {item.roomNumber && (
                <View style={styles.txRoomBadge}>
                  <Text style={styles.txRoomBadgeText}>Kamar {item.roomNumber}</Text>
                </View>
              )}
            </View>
            {item.tenantName && (
              <Text style={styles.txNotes}>Dari: {item.tenantName}</Text>
            )}
            {item.notes && !item.tenantName && (
              <Text style={styles.txNotes}>{item.notes}</Text>
            )}
            <Text style={styles.txDate}>{item.date}</Text>
          </View>
        </View>

        <View style={styles.txCardRight}>
          <Text
            style={[
              styles.txAmount,
              { color: isIncome ? '#16A34A' : '#DC2626' },
            ]}
          >
            {isIncome ? '+' : '-'}Rp{item.amount.toLocaleString('id-ID')}
          </Text>

          {isIncome && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => handleGenerateReceipt(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={12} color="#0284C7" />
              <Text style={styles.pdfBtnText}>Kuitansi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandSubtitle}>ARUS KAS & KEUANGAN</Text>
          <Text style={styles.title}>Laporan Keuangan</Text>
        </View>
        <TouchableOpacity
          style={styles.addTxBtn}
          onPress={() => {
            setTxType('expense');
            setCategory('Perbaikan');
            setModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.addTxBtnText}>Catat Transaksi</Text>
        </TouchableOpacity>
      </View>

      {/* Card Ringkasan Finansial */}
      <View style={styles.summaryCard}>
        <View style={styles.netProfitSection}>
          <Text style={styles.netProfitLabel}>Laba Bersih Kos</Text>
          <Text style={styles.netProfitValue}>
            Rp{netProfit.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.incomeExpenseRow}>
          <View style={styles.flowItem}>
            <View style={styles.flowLabelBox}>
              <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.flowLabel}>Total Pemasukan</Text>
            </View>
            <Text style={[styles.flowValue, { color: '#16A34A' }]}>
              +Rp{totalIncome.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={[styles.flowItem, { alignItems: 'flex-end' }]}>
            <View style={styles.flowLabelBox}>
              <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.flowLabel}>Total Pengeluaran</Text>
            </View>
            <Text style={[styles.flowValue, { color: '#DC2626' }]}>
              -Rp{totalExpense.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Visual Bar Ratio */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressIncome, { width: `${Math.min(100, Math.max(0, incomeRatio))}%` }]} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            Semua ({transactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilter === 'income' && styles.filterBtnActive]}
          onPress={() => setActiveFilter('income')}
        >
          <Text style={[styles.filterText, activeFilter === 'income' && styles.filterTextActive]}>
            Pemasukan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilter === 'expense' && styles.filterBtnActive]}
          onPress={() => setActiveFilter('expense')}
        >
          <Text style={[styles.filterText, activeFilter === 'expense' && styles.filterTextActive]}>
            Pengeluaran
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="wallet-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
            <Text style={styles.emptySub}>
              Tekan tombol "+ Catat Transaksi" untuk memasukkan arus kas pertama.
            </Text>
          </View>
        }
      />

      {/* MODAL CATAT TRANSAKSI */}
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
                <Text style={styles.modalTitle}>Catat Arus Kas</Text>
                <Text style={styles.modalSub}>Pemasukan sewa atau biaya operasional kos</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Switch Tipe: Pemasukan / Pengeluaran */}
              <View style={styles.typeSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.typeSwitchBtn,
                    txType === 'expense' && styles.typeSwitchBtnActiveExpense,
                  ]}
                  onPress={() => {
                    setTxType('expense');
                    setCategory('Perbaikan');
                  }}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={16}
                    color={txType === 'expense' ? '#DC2626' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeSwitchText,
                      txType === 'expense' && styles.typeSwitchTextActiveExpense,
                    ]}
                  >
                    Pengeluaran
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSwitchBtn,
                    txType === 'income' && styles.typeSwitchBtnActiveIncome,
                  ]}
                  onPress={() => {
                    setTxType('income');
                    setCategory('Sewa Kamar');
                  }}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={16}
                    color={txType === 'income' ? '#16A34A' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeSwitchText,
                      txType === 'income' && styles.typeSwitchTextActiveIncome,
                    ]}
                  >
                    Pemasukan
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Kategori */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori Transaksi</Text>
                <View style={styles.catPills}>
                  {(txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catPill,
                          category === cat && styles.catPillActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            category === cat && styles.catPillTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              {/* Jumlah Uang */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nominal Uang (Rp) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 150000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Kamar Terkait (Opsional) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Unit Kamar Terkait (Opsional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.roomSelectRow}>
                    <TouchableOpacity
                      style={[
                        styles.roomSelectPill,
                        selectedRoomNumber === '' && styles.roomSelectPillActive,
                      ]}
                      onPress={() => setSelectedRoomNumber('')}
                    >
                      <Text
                        style={[
                          styles.roomSelectText,
                          selectedRoomNumber === '' && styles.roomSelectTextActive,
                        ]}
                      >
                        Umum
                      </Text>
                    </TouchableOpacity>
                    {rooms.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.roomSelectPill,
                          selectedRoomNumber === r.number && styles.roomSelectPillActive,
                        ]}
                        onPress={() => {
                          setSelectedRoomNumber(r.number);
                          if (r.tenantName) {
                            setTenantNameInput(r.tenantName);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.roomSelectText,
                            selectedRoomNumber === r.number && styles.roomSelectTextActive,
                          ]}
                        >
                          Kamar {r.number}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Nama Penghuni (Opsional) */}
              {txType === 'income' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Nama Pembayar (Untuk Kuitansi)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Contoh: Budi Santoso"
                    placeholderTextColor="#94A3B8"
                    value={tenantNameInput}
                    onChangeText={setTenantNameInput}
                  />
                </View>
              )}

              {/* Tanggal */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tanggal Transaksi (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-11-21"
                  placeholderTextColor="#94A3B8"
                  value={dateInput}
                  onChangeText={setDateInput}
                />
              </View>

              {/* Catatan Tambahan */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan Tambahan (Opsional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Beli lampu & servis keran air"
                  placeholderTextColor="#94A3B8"
                  value={notesInput}
                  onChangeText={setNotesInput}
                />
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
                  onPress={handleSaveTransaction}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.submitBtnText}>Simpan Transaksi</Text>
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
  addTxBtn: {
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
  addTxBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  netProfitSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  netProfitLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  netProfitValue: { fontSize: 24, fontWeight: '900', marginTop: 2, color: '#0F172A' },
  incomeExpenseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  flowItem: { flex: 1 },
  flowLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  flowLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  flowValue: { fontSize: 15, fontWeight: '800' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressIncome: { height: '100%', backgroundColor: '#16A34A', borderRadius: 4 },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 9,
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

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  txCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDetails: { flex: 1 },
  txHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txCategory: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  txRoomBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txRoomBadgeText: { fontSize: 10, fontWeight: '700', color: '#0284C7' },
  txNotes: { fontSize: 11, color: '#64748B', marginTop: 1 },
  txDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  txCardRight: { alignItems: 'flex-end', marginLeft: 8 },
  txAmount: { fontSize: 13, fontWeight: '800' },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  pdfBtnText: { fontSize: 10, fontWeight: '700', color: '#0284C7' },

  // Modal
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
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { padding: 4 },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  typeSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  typeSwitchBtnActiveExpense: {
    backgroundColor: '#FEE2E2',
  },
  typeSwitchBtnActiveIncome: {
    backgroundColor: '#DCFCE7',
  },
  typeSwitchText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  typeSwitchTextActiveExpense: { color: '#991B1B' },
  typeSwitchTextActiveIncome: { color: '#166534' },
  formGroup: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  catPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  catPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  catPillText: { fontSize: 11, fontWeight: '600', color: '#0284C7' },
  catPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
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
  roomSelectRow: { flexDirection: 'row', gap: 6 },
  roomSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  roomSelectPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  roomSelectText: { fontSize: 11, fontWeight: '600', color: '#0284C7' },
  roomSelectTextActive: { color: '#FFFFFF', fontWeight: '700' },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
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

  // Empty state
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});
