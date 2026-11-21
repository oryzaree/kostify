import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Transaction } from '../data/mockData';

/**
 * Menghasilkan dan membagikan kuitansi pembayaran sewa digital berstempel LUNAS dalam format PDF
 */
export async function generateAndShareReceipt(
  transaction: Transaction,
  kosName: string = 'KOS GRIYA MAKMUR',
  kosAddress: string = 'Jl. Sukajadi No. 45, Bandung | Telp/WA: 0812-3456-7890'
): Promise<boolean> {
  try {
    const formattedAmount = `Rp${transaction.amount.toLocaleString('id-ID')}`;
    const invoiceNumber = `INV-${transaction.id.toUpperCase()}-${transaction.date.replace(/-/g, '')}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Kuitansi Pembayaran Sewa</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      padding: 30px;
      background-color: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .receipt-container {
      max-width: 650px;
      margin: 0 auto;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      position: relative;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-tag {
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
    }
    .invoice-num {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      padding: 10px 14px;
      text-align: left;
    }
    th:last-child { text-align: right; }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    td:last-child {
      text-align: right;
      font-weight: 700;
    }
    .total-row {
      background: #f8fafc;
      font-size: 14px;
      font-weight: 800;
    }
    .total-row td {
      border-bottom: 2px solid #0f172a;
      color: #0f172a;
      padding: 14px;
    }
    .stamp-container {
      position: absolute;
      right: 50px;
      bottom: 90px;
      transform: rotate(-12deg);
      border: 3px dashed #16a34a;
      border-radius: 8px;
      padding: 6px 16px;
      color: #16a34a;
      text-align: center;
      background: rgba(220, 252, 231, 0.4);
    }
    .stamp-text {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 3px;
    }
    .stamp-date {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
    }
    .notes-section {
      max-width: 60%;
      font-size: 11px;
      color: #64748b;
    }
    .signature-section {
      text-align: center;
      min-width: 140px;
    }
    .sig-line {
      margin-top: 45px;
      border-bottom: 1px solid #475569;
      padding-bottom: 2px;
      font-weight: 700;
      color: #0f172a;
      font-size: 11px;
    }
    .sig-title {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div>
        <div class="brand-title">${kosName}</div>
        <div class="brand-sub">${kosAddress}</div>
      </div>
      <div class="invoice-tag">
        <div class="invoice-title">Kuitansi Pembayaran</div>
        <div class="invoice-num">${invoiceNumber}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">Diterima Dari</div>
        <div class="info-val">${transaction.tenantName || 'Penghuni Kos'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Unit Kamar</div>
        <div class="info-val">Kamar ${transaction.roomNumber || '-'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Tanggal Pembayaran</div>
        <div class="info-val">${transaction.date}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Metode Pembayaran</div>
        <div class="info-val">Transfer Bank / Tunai</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Keterangan / Deskripsi Transaksi</th>
          <th>Kategori</th>
          <th>Jumlah</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${transaction.notes || 'Pembayaran Sewa Kamar'}</strong>
            <br>
            <span style="color: #64748b; font-size: 11px;">Unit Kamar: ${transaction.roomNumber || '-'} | Penerima: ${transaction.tenantName || '-'}</span>
          </td>
          <td>${transaction.category}</td>
          <td>${formattedAmount}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" style="text-align: right;">TOTAL DIBAYAR:</td>
          <td>${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="stamp-container">
      <div class="stamp-text">LUNAS</div>
      <div class="stamp-date">TGL: ${transaction.date}</div>
    </div>

    <div class="footer">
      <div class="notes-section">
        <strong>Ketentuan:</strong>
        <p>1. Kuitansi ini merupakan bukti pembayaran sewa yang sah.</p>
        <p>2. Uang yang telah dibayarkan tidak dapat ditarik kembali.</p>
        <p>3. Jagalah kebersihan, ketertiban, dan keamanan lingkungan kos bersama.</p>
      </div>
      <div class="signature-section">
        <div>Pengelola Kos,</div>
        <div class="sig-line">Manajemen Kos</div>
        <div class="sig-title">Griya Makmur</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Generate file PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Bagikan PDF via expo-sharing
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Kuitansi Sewa Kamar ${transaction.roomNumber || ''} - ${transaction.tenantName || ''}`,
      });
      return true;
    } else {
      Alert.alert('Info', 'Fitur berbagi file tidak didukung di perangkat ini.');
      return false;
    }
  } catch (error) {
    console.error('Gagal mencetak kuitansi PDF:', error);
    Alert.alert('Error', 'Gagal membuat file kuitansi PDF.');
    return false;
  }
}
