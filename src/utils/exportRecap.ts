import type { Pengaturan, Statistics, Kandidat, Kelas, Siswa } from '../types';

export interface ClassTurnout {
  kelasId: string;
  namaKelas: string;
  tingkat: number;
  waliKelas: string;
  totalSiswa: number;
  sudahMemilih: number;
  belumMemilih: number;
  persentase: string;
}

export interface ExportData {
  settings: Pengaturan;
  stats: Statistics;
  kandidatList: (Kandidat & { percentage?: string; isLeader?: boolean })[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  classTurnoutList: ClassTurnout[];
}

/**
 * Menghitung rekapitulasi partisipasi pemilih per kelas
 */
export function calculateClassTurnout(
  kelasList: Kelas[],
  siswaList: Siswa[]
): ClassTurnout[] {
  const studentsByClass = new Map<string, Siswa[]>();
  
  siswaList.forEach(s => {
    const list = studentsByClass.get(s.kelas_id) || [];
    list.push(s);
    studentsByClass.set(s.kelas_id, list);
  });

  return kelasList.map(k => {
    const classStudents = studentsByClass.get(k.id) || [];
    const totalSiswa = classStudents.length;
    const sudahMemilih = classStudents.filter(s => s.sudah_memilih).length;
    const belumMemilih = totalSiswa - sudahMemilih;
    const persentase = totalSiswa > 0 ? ((sudahMemilih / totalSiswa) * 100).toFixed(1) : '0.0';

    return {
      kelasId: k.id,
      namaKelas: k.nama_kelas,
      tingkat: k.tingkat,
      waliKelas: k.wali_kelas || '-',
      totalSiswa,
      sudahMemilih,
      belumMemilih,
      persentase
    };
  }).sort((a, b) => {
    if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
    return a.namaKelas.localeCompare(b.namaKelas, undefined, { numeric: true });
  });
}

/**
 * Format tanggal Indonesia formal
 */
export function formatIndonesianDate(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatIndonesianDateTime(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';
}

/**
 * Ekspor Hasil Rekapitulasi Pemilihan ke format Excel (.xls)
 * Format tabel HTML Spreadsheet resmi dengan styling, border, dan pengesahan
 */
export function exportRekapToExcel(data: ExportData): void {
  const { settings, stats, kandidatList, classTurnoutList } = data;
  const printDateStr = formatIndonesianDateTime();
  const dateOnlyStr = formatIndonesianDate();
  const sanitizeFilename = (settings.nama_sekolah || 'SMPN2')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
  const periodeClean = (settings.periode_pemilihan || '2025-2026').replace(/\//g, '-');
  const filename = `Rekapitulasi_Hasil_Pemilu_OSIS_${sanitizeFilename}_${periodeClean}.xls`;

  // Cari kandidat pemenang
  const sortedCandidates = [...kandidatList].sort((a, b) => (b.total_suara || 0) - (a.total_suara || 0));
  const winner = sortedCandidates.length > 0 && stats.totalSuaraMasuk > 0 ? sortedCandidates[0] : null;

  const excelContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Rekapitulasi Hasil Pemilu OSIS</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; }
    .header-title { font-size: 16pt; font-weight: bold; text-align: center; color: #1e3a8a; }
    .header-sub { font-size: 13pt; font-weight: bold; text-align: center; color: #1e293b; }
    .header-school { font-size: 11pt; text-align: center; color: #475569; }
    .section-title { font-size: 12pt; font-weight: bold; background-color: #e2e8f0; color: #0f172a; border: 1px solid #94a3b8; }
    .th-cell { font-weight: bold; background-color: #1e40af; color: #ffffff; text-align: center; border: 1px solid #1e3a8a; vertical-align: middle; }
    .th-sub { font-weight: bold; background-color: #3b82f6; color: #ffffff; text-align: center; border: 1px solid #2563eb; }
    .td-cell { border: 1px solid #cbd5e1; vertical-align: middle; padding: 4px 8px; }
    .td-center { border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; }
    .td-number { border: 1px solid #cbd5e1; text-align: right; vertical-align: middle; }
    .td-highlight { border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; }
    .winner-badge { font-weight: bold; color: #15803d; background-color: #dcfce7; }
    .total-row { font-weight: bold; background-color: #f1f5f9; border-top: 2px solid #0f172a; }
  </style>
</head>
<body>
  <table border="0" cellpadding="4" cellspacing="0" width="100%">
    <!-- KOP DOKUMEN -->
    <tr>
      <td colspan="7" class="header-title">PANITIA PEMILIHAN KETUA & WAKIL KETUA OSIS</td>
    </tr>
    <tr>
      <td colspan="7" class="header-sub">${escapeXml(settings.nama_sekolah)}</td>
    </tr>
    <tr>
      <td colspan="7" class="header-school">BERITA ACARA & REKAPITULASI RESMI PENGHITUNGAN PEROLEHAN SUARA</td>
    </tr>
    <tr>
      <td colspan="7" style="text-align: center; color: #64748b; font-size: 10pt;">
        Tahun Ajaran / Periode Kepengurusan: ${escapeXml(settings.periode_pemilihan)} | Tanggal Ekspor: ${escapeXml(printDateStr)}
      </td>
    </tr>
    <tr><td colspan="7">&nbsp;</td></tr>

    <!-- RINGKASAN DATA HAK SUARA & PARTISIPASI -->
    <tr>
      <td colspan="7" class="section-title">I. RINGKASAN HAK PILIH DAN TINGKAT PARTISIPASI PEMILIH</td>
    </tr>
    <tr>
      <td colspan="3" class="td-highlight">Total DPT Siswa (Hak Suara Terdaftar)</td>
      <td colspan="4" class="td-number" style="font-size: 11pt; font-weight: bold;">${stats.totalSiswa} Siswa</td>
    </tr>
    <tr>
      <td colspan="3" class="td-highlight">Total Suara Masuk (Suara Sah Digunakan)</td>
      <td colspan="4" class="td-number" style="font-size: 11pt; font-weight: bold; color: #1d4ed8;">${stats.totalSuaraMasuk} Suara</td>
    </tr>
    <tr>
      <td colspan="3" class="td-highlight">Jumlah Siswa Belum Menggunakan Hak Suara</td>
      <td colspan="4" class="td-number" style="font-size: 11pt; font-weight: bold; color: #b91c1c;">${stats.belumMemilih} Siswa</td>
    </tr>
    <tr>
      <td colspan="3" class="td-highlight">Tingkat Partisipasi Pemilih</td>
      <td colspan="4" class="td-number" style="font-size: 11pt; font-weight: bold; color: #15803d;">${stats.persentasePartisipasi}%</td>
    </tr>
    <tr><td colspan="7">&nbsp;</td></tr>

    <!-- HASIL PEROLEHAN SUARA KANDIDAT -->
    <tr>
      <td colspan="7" class="section-title">II. TABEL PEROLEHAN SUARA PASANGAN CALON KETUA & WAKIL KETUA OSIS</td>
    </tr>
    <tr>
      <th class="th-cell" width="70">No. Urut</th>
      <th class="th-cell" colspan="2" width="280">Nama Pasangan Calon</th>
      <th class="th-cell" width="220">Slogan / Tagline</th>
      <th class="th-cell" width="130">Perolehan Suara</th>
      <th class="th-cell" width="100">Persentase</th>
      <th class="th-cell" width="160">Status Penetapan</th>
    </tr>
    ${kandidatList.map(k => {
      const share = stats.totalSuaraMasuk > 0 ? ((k.total_suara / stats.totalSuaraMasuk) * 100).toFixed(1) : '0.0';
      const isWinner = winner && winner.id === k.id;
      const statusText = isWinner ? 'SUARA TERBANYAK (TERPILIH)' : 'Peserta Pemilihan';
      const rowStyle = isWinner ? 'background-color: #f0fdf4;' : '';
      return `
      <tr style="${rowStyle}">
        <td class="td-center" style="font-weight: bold; font-size: 12pt;">${k.nomor_urut}</td>
        <td class="td-cell" colspan="2" style="font-weight: bold;">
          ${escapeXml(k.nama_ketua)}<br/>
          <span style="font-weight: normal; color: #475569;">Wakil: ${escapeXml(k.nama_wakil)}</span>
        </td>
        <td class="td-cell" style="font-style: italic; color: #475569;">"${escapeXml(k.slogan || '-')}"</td>
        <td class="td-number" style="font-weight: bold; font-size: 11pt;">${k.total_suara}</td>
        <td class="td-number" style="font-weight: bold; color: #1e40af;">${share}%</td>
        <td class="td-center ${isWinner ? 'winner-badge' : ''}">${statusText}</td>
      </tr>
      `;
    }).join('')}
    <tr class="total-row">
      <td colspan="4" class="td-cell" style="text-align: right; font-weight: bold;">TOTAL SUARA SAH MASUK:</td>
      <td class="td-number" style="font-weight: bold; font-size: 11pt; color: #1e40af;">${stats.totalSuaraMasuk}</td>
      <td class="td-number" style="font-weight: bold; color: #1e40af;">100.0%</td>
      <td class="td-center" style="font-weight: bold;">FINAL</td>
    </tr>
    <tr><td colspan="7">&nbsp;</td></tr>

    <!-- REKAPITULASI PER KELAS -->
    <tr>
      <td colspan="7" class="section-title">III. REKAPITULASI KEHADIRAN & PARTISIPASI PEMILIH PER KELAS</td>
    </tr>
    <tr>
      <th class="th-sub" width="50">No</th>
      <th class="th-sub" width="100">Nama Kelas</th>
      <th class="th-sub" width="70">Tingkat</th>
      <th class="th-sub" width="220">Wali Kelas</th>
      <th class="th-sub" width="110">Total DPT</th>
      <th class="th-sub" width="110">Sudah Memilih</th>
      <th class="th-sub" width="110">Partisipasi (%)</th>
    </tr>
    ${classTurnoutList.map((c, index) => `
      <tr>
        <td class="td-center">${index + 1}</td>
        <td class="td-center" style="font-weight: bold;">${escapeXml(c.namaKelas)}</td>
        <td class="td-center">Kelas ${c.tingkat}</td>
        <td class="td-cell">${escapeXml(c.waliKelas)}</td>
        <td class="td-number">${c.totalSiswa}</td>
        <td class="td-number" style="font-weight: bold; color: #15803d;">${c.sudahMemilih}</td>
        <td class="td-number" style="font-weight: bold;">${c.persentase}%</td>
      </tr>
    `).join('')}
    <tr class="total-row">
      <td colspan="4" class="td-cell" style="text-align: right; font-weight: bold;">TOTAL KESELURUHAN SISWA:</td>
      <td class="td-number" style="font-weight: bold;">${stats.totalSiswa}</td>
      <td class="td-number" style="font-weight: bold; color: #15803d;">${stats.sudahMemilih}</td>
      <td class="td-number" style="font-weight: bold;">${stats.persentasePartisipasi}%</td>
    </tr>
    <tr><td colspan="7">&nbsp;</td></tr>

    <!-- PENGESAHAN DAN TANDA TANGAN -->
    <tr>
      <td colspan="7" class="section-title">IV. PENGESAHAN BERITA ACARA RESMI</td>
    </tr>
    <tr>
      <td colspan="7" style="font-size: 10pt; color: #334155; padding-top: 8px;">
        Demikian Berita Acara Rekapitulasi Hasil Penghitungan Suara Pemilihan Ketua dan Wakil Ketua OSIS ${escapeXml(settings.nama_sekolah)} ini dibuat dengan sebenarnya dengan disaksikan oleh saksi pasangan calon dan diketahui oleh pihak pimpinan sekolah.
      </td>
    </tr>
    <tr>
      <td colspan="7" style="text-align: right; font-style: italic; padding: 10px 0;">
        Kota Bogor, ${escapeXml(dateOnlyStr)}
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align: center; vertical-align: top;">
        <b>Saksi Paslon No. 1</b><br/><br/><br/><br/>
        ( ......................................... )
      </td>
      <td colspan="2" style="text-align: center; vertical-align: top;">
        <b>Saksi Paslon No. 2</b><br/><br/><br/><br/>
        ( ......................................... )
      </td>
      <td colspan="3" style="text-align: center; vertical-align: top;">
        <b>Saksi Paslon No. 3</b><br/><br/><br/><br/>
        ( ......................................... )
      </td>
    </tr>
    <tr><td colspan="7">&nbsp;</td></tr>
    <tr>
      <td colspan="3" style="text-align: center; vertical-align: top;">
        Ketua Panitia Pemilihan (KPO),<br/><br/><br/><br/>
        <u><b>Dra. Sri Wahyuni, M.Pd</b></u><br/>
        NIP. 19740512 199903 2 004
      </td>
      <td colspan="4" style="text-align: center; vertical-align: top;">
        Mengetahui,<br/>Kepala ${escapeXml(settings.nama_sekolah)},<br/><br/><br/><br/>
        <u><b>Drs. H. Mulyadi, M.M.Pd</b></u><br/>
        NIP. 19681120 199412 1 002
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Ekspor Hasil Rekapitulasi ke format CSV standar dengan UTF-8 BOM
 */
export function exportRekapToCsv(data: ExportData): void {
  const { settings, stats, kandidatList, classTurnoutList } = data;
  const printDateStr = formatIndonesianDateTime();
  const sanitizeFilename = (settings.nama_sekolah || 'SMPN2')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
  const periodeClean = (settings.periode_pemilihan || '2025-2026').replace(/\//g, '-');
  const filename = `Rekapitulasi_Hasil_Pemilu_OSIS_${sanitizeFilename}_${periodeClean}.csv`;

  const rows: string[][] = [
    ['PANITIA PEMILIHAN OSIS (eOSIS)'],
    [settings.nama_sekolah],
    ['BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA'],
    [`Periode: ${settings.periode_pemilihan}`, `Waktu Cetak: ${printDateStr}`],
    [],
    ['=== I. RINGKASAN DATA HAK PILIH & PARTISIPASI ==='],
    ['Kategori', 'Jumlah', 'Satuan'],
    ['Total DPT Terdaftar', String(stats.totalSiswa), 'Siswa'],
    ['Total Suara Masuk (Sah)', String(stats.totalSuaraMasuk), 'Suara'],
    ['Belum Menggunakan Hak Suara', String(stats.belumMemilih), 'Siswa'],
    ['Tingkat Partisipasi', `${stats.persentasePartisipasi}%`, 'Persen'],
    [],
    ['=== II. PEROLEHAN SUARA PASANGAN CALON ==='],
    ['No. Urut', 'Ketua', 'Wakil Ketua', 'Slogan', 'Perolehan Suara', 'Persentase (%)', 'Status'],
    ...kandidatList.map(k => {
      const share = stats.totalSuaraMasuk > 0 ? ((k.total_suara / stats.totalSuaraMasuk) * 100).toFixed(1) : '0.0';
      const isLeader = k.isLeader ? 'SUARA TERTINGGI (TERPILIH)' : 'Peserta';
      return [
        String(k.nomor_urut),
        k.nama_ketua,
        k.nama_wakil,
        k.slogan || '-',
        String(k.total_suara),
        `${share}%`,
        isLeader
      ];
    }),
    ['TOTAL SUARA SAH', '', '', '', String(stats.totalSuaraMasuk), '100.0%', 'FINAL'],
    [],
    ['=== III. REKAPITULASI PARTISIPASI PER KELAS ==='],
    ['No', 'Nama Kelas', 'Tingkat', 'Wali Kelas', 'Total DPT', 'Sudah Memilih', 'Belum Memilih', 'Partisipasi (%)'],
    ...classTurnoutList.map((c, i) => [
      String(i + 1),
      c.namaKelas,
      `Kelas ${c.tingkat}`,
      c.waliKelas,
      String(c.totalSiswa),
      String(c.sudahMemilih),
      String(c.belumMemilih),
      `${c.persentase}%`
    ]),
    ['TOTAL', '', '', '', String(stats.totalSiswa), String(stats.sudahMemilih), String(stats.belumMemilih), `${stats.persentasePartisipasi}%`]
  ];

  const csvString = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Mencetak atau Menyimpan Dokumen Formal Berita Acara ke format PDF
 * Membuka jendela print-friendly berstandar A4 dengan Kop Surat, Segel, dan Kolom Tanda Tangan
 */
export function openBeritaAcaraPrintWindow(data: ExportData): void {
  const { settings, stats, kandidatList, classTurnoutList } = data;
  const printDateStr = formatIndonesianDateTime();
  const dateOnlyStr = formatIndonesianDate();
  const logoUrl = settings.logo_sekolah || '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

  const sortedCandidates = [...kandidatList].sort((a, b) => (b.total_suara || 0) - (a.total_suara || 0));
  const winner = sortedCandidates.length > 0 && stats.totalSuaraMasuk > 0 ? sortedCandidates[0] : null;

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Berita Acara Rekapitulasi Pemilihan OSIS - ${escapeXml(settings.nama_sekolah)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .print-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    /* KOP SURAT RESMI */
    .kop-surat {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
      padding-bottom: 8px;
    }
    .kop-logo {
      position: absolute;
      left: 0;
      top: 2px;
      width: 70px;
      height: 70px;
      object-fit: contain;
    }
    .kop-text {
      width: 100%;
      padding: 0 75px;
    }
    .kop-instansi {
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .kop-dinas {
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .kop-sekolah {
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 2px 0 0 0;
      color: #002b66;
    }
    .kop-panitia {
      font-size: 12pt;
      font-weight: bold;
      margin: 2px 0 0 0;
    }
    .kop-alamat {
      font-size: 9pt;
      margin-top: 4px;
      color: #333;
    }
    .kop-divider {
      border-top: 3px solid #000;
      border-bottom: 1px solid #000;
      height: 2px;
      margin-top: 4px;
      margin-bottom: 16px;
    }
    /* JUDUL DOKUMEN */
    .doc-title {
      text-align: center;
      margin-bottom: 14px;
    }
    .doc-title h2 {
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title p {
      font-size: 10pt;
      margin: 0;
      font-weight: bold;
    }
    /* NARASI */
    .narasi {
      text-align: justify;
      font-size: 10.5pt;
      margin-bottom: 12px;
      text-indent: 30px;
    }
    /* TABEL FORMAL */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #000;
      padding: 5px 8px;
      vertical-align: middle;
    }
    table.data-table th {
      background-color: #f2f2f2;
      text-align: center;
      font-weight: bold;
    }
    table.summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10pt;
    }
    table.summary-table td {
      border: 1px solid #000;
      padding: 4px 8px;
    }
    .winner-highlight {
      background-color: #e6f4ea !important;
      font-weight: bold;
    }
    .section-heading {
      font-size: 10.5pt;
      font-weight: bold;
      margin: 10px 0 4px 0;
      text-transform: uppercase;
    }
    /* KOTAK KEPUTUSAN */
    .decree-box {
      border: 1.5px solid #000;
      padding: 8px 12px;
      margin: 12px 0;
      background-color: #fafafa;
      font-size: 10pt;
    }
    /* LEMBAR TANDA TANGAN */
    .signatures-block {
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .sig-table td {
      padding: 6px 4px;
      text-align: center;
      vertical-align: top;
      border: none;
    }
    .sig-name {
      font-weight: bold;
      text-decoration: underline;
    }
    .action-bar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #1e293b;
      padding: 8px 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      display: flex;
      gap: 8px;
    }
    .action-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .action-btn.close-btn {
      background: #64748b;
    }
    .action-btn:hover {
      opacity: 0.9;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- ACTION BAR FOR BROWSER PREVIEW (Hidden in Print) -->
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">
      🖨️ Cetak / Simpan sebagai PDF
    </button>
    <button class="action-btn close-btn" onclick="window.close()">
      ✕ Tutup
    </button>
  </div>

  <div class="print-container">
    <!-- KOP SURAT RESMI -->
    <div class="kop-surat">
      <img src="${logoUrl}" alt="Logo" class="kop-logo" />
      <div class="kop-text">
        <div class="kop-instansi">PEMERINTAH KOTA BOGOR</div>
        <div class="kop-dinas">DINAS PENDIDIKAN</div>
        <div class="kop-sekolah">${escapeXml(settings.nama_sekolah)}</div>
        <div class="kop-panitia">KOMISI PEMILIHAN OSIS (eOSIS SPENDA)</div>
        <div class="kop-alamat">Jl. Ir. H. Juanda No. 16, Pabaton, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16121 · Telp: (0251) 8321456</div>
      </div>
    </div>
    <div class="kop-divider"></div>

    <!-- JUDUL BERITA ACARA -->
    <div class="doc-title">
      <h2>BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA</h2>
      <p>PEMILIHAN KETUA DAN WAKIL KETUA OSIS MASA BAKTI ${escapeXml(settings.periode_pemilihan)}</p>
      <small style="font-style: italic; color: #444;">Nomor: BA.03/KPO-OSIS-SPENDA/${new Date().getFullYear()}</small>
    </div>

    <!-- NARASI RESMI -->
    <div class="narasi">
      Pada hari ini, <strong>${escapeXml(dateOnlyStr)}</strong>, bertempat di Kampus SMP Negeri 2 Kota Bogor, Panitia Komisi Pemilihan OSIS telah melaksanakan rapat pleno penghitungan dan rekapitulasi akhir perolehan suara dalam Pemilihan Ketua dan Wakil Ketua OSIS Periode ${escapeXml(settings.periode_pemilihan)} yang diselenggarakan secara langsung, umum, bebas, rahasia, jujur, dan adil melalui sistem e-Voting (eOSIS).
    </div>

    <!-- I. REKAPITULASI HAK PILIH & PARTISIPASI -->
    <div class="section-heading">I. DATA HAK SUARA DAN KEHADIRAN PEMILIH</div>
    <table class="summary-table">
      <tr>
        <td style="width: 65%;">A. Jumlah Hak Suara Terdaftar dalam Daftar Pemilih Tetap (DPT)</td>
        <td style="text-align: right; font-weight: bold; width: 35%;">${stats.totalSiswa} Siswa</td>
      </tr>
      <tr>
        <td>B. Jumlah Pemilih yang Menggunakan Hak Suara (Suara Sah Masuk)</td>
        <td style="text-align: right; font-weight: bold; color: #002b66;">${stats.totalSuaraMasuk} Suara</td>
      </tr>
      <tr>
        <td>C. Jumlah Pemilih yang Tidak Menggunakan Hak Suara (Golput/Absen)</td>
        <td style="text-align: right; font-weight: bold; color: #8b0000;">${stats.belumMemilih} Siswa</td>
      </tr>
      <tr style="background-color: #f7f7f7;">
        <td><strong>D. Tingkat Partisipasi Pemilih Keseluruhan</strong></td>
        <td style="text-align: right; font-weight: bold; color: #005a2b; font-size: 11pt;">${stats.persentasePartisipasi}%</td>
      </tr>
    </table>

    <!-- II. HASIL PEROLEHAN SUARA PASANGAN CALON -->
    <div class="section-heading">II. HASIL PEROLEHAN SUARA PASANGAN CALON KETUA & WAKIL KETUA OSIS</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 50px;">No.</th>
          <th>Pasangan Calon (Ketua & Wakil)</th>
          <th style="width: 140px;">Slogan / Tagline</th>
          <th style="width: 100px;">Perolehan Suara</th>
          <th style="width: 90px;">Persentase</th>
          <th style="width: 120px;">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        ${kandidatList.map(k => {
          const share = stats.totalSuaraMasuk > 0 ? ((k.total_suara / stats.totalSuaraMasuk) * 100).toFixed(1) : '0.0';
          const isWinner = winner && winner.id === k.id;
          return `
            <tr class="${isWinner ? 'winner-highlight' : ''}">
              <td style="text-align: center; font-weight: bold; font-size: 12pt;">${k.nomor_urut}</td>
              <td>
                <strong>${escapeXml(k.nama_ketua)}</strong><br/>
                <span style="font-size: 9pt; color: #333;">Wakil: ${escapeXml(k.nama_wakil)}</span>
              </td>
              <td style="font-size: 9pt; font-style: italic;">"${escapeXml(k.slogan || '-')}"</td>
              <td style="text-align: right; font-weight: bold; font-size: 11pt;">${k.total_suara}</td>
              <td style="text-align: right; font-weight: bold;">${share}%</td>
              <td style="text-align: center; font-size: 9pt;">
                ${isWinner ? '<strong>★ TERPILIH</strong>' : 'Peserta'}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td colspan="3" style="text-align: right;">TOTAL SUARA SAH MASUK:</td>
          <td style="text-align: right; font-size: 11pt;">${stats.totalSuaraMasuk}</td>
          <td style="text-align: right;">100.0%</td>
          <td style="text-align: center;">SAH & FINAL</td>
        </tr>
      </tfoot>
    </table>

    ${winner ? `
    <!-- KEPUTUSAN PENETAPAN -->
    <div class="decree-box">
      <strong>PENETAPAN PASANGAN CALON TERPILIH:</strong><br/>
      Berdasarkan hasil penghitungan suara di atas, Panitia Pemilihan OSIS menetapkan Pasangan Calon Nomor Urut <strong>${winner.nomor_urut}</strong> atas nama <strong>${escapeXml(winner.nama_ketua)}</strong> (Ketua) dan <strong>${escapeXml(winner.nama_wakil)}</strong> (Wakil Ketua) sebagai <strong>KETUA DAN WAKIL KETUA OSIS SMP NEGERI 2 KOTA BOGOR TERPILIH MASA BAKTI ${escapeXml(settings.periode_pemilihan)}</strong> dengan perolehan sebanyak <strong>${winner.total_suara} suara (${stats.totalSuaraMasuk > 0 ? ((winner.total_suara / stats.totalSuaraMasuk) * 100).toFixed(1) : 0}%)</strong>.
    </div>
    ` : ''}

    <!-- III. PARTISIPASI PER KELAS RINGKAS -->
    <div class="section-heading">III. REKAPITULASI PARTISIPASI PEMILIH PER KELAS</div>
    <table class="data-table" style="font-size: 9pt;">
      <thead>
        <tr>
          <th style="width: 35px;">No</th>
          <th>Kelas</th>
          <th>Tingkat</th>
          <th>Wali Kelas</th>
          <th style="width: 75px;">DPT</th>
          <th style="width: 85px;">Memilih</th>
          <th style="width: 85px;">Partisipasi</th>
        </tr>
      </thead>
      <tbody>
        ${classTurnoutList.map((c, i) => `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td style="text-align: center; font-weight: bold;">${escapeXml(c.namaKelas)}</td>
            <td style="text-align: center;">Kelas ${c.tingkat}</td>
            <td>${escapeXml(c.waliKelas)}</td>
            <td style="text-align: right;">${c.totalSiswa}</td>
            <td style="text-align: right; font-weight: bold;">${c.sudahMemilih}</td>
            <td style="text-align: right; font-weight: bold;">${c.persentase}%</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td colspan="4" style="text-align: right;">TOTAL:</td>
          <td style="text-align: right;">${stats.totalSiswa}</td>
          <td style="text-align: right;">${stats.sudahMemilih}</td>
          <td style="text-align: right;">${stats.persentasePartisipasi}%</td>
        </tr>
      </tfoot>
    </table>

    <!-- LEMBAR PENGESAHAN & TANDA TANGAN -->
    <div class="signatures-block">
      <div style="text-align: right; font-size: 10pt; margin-bottom: 8px;">
        Ditetapkan di: Kota Bogor<br/>
        Pada tanggal: ${escapeXml(dateOnlyStr)}
      </div>

      <div style="font-weight: bold; text-align: center; margin-bottom: 8px; font-size: 10pt;">
        SAKSI-SAKSI PASANGAN CALON:
      </div>
      <table class="sig-table">
        <tr>
          <td style="width: 33.3%;">
            Saksi Paslon No. 1<br/><br/><br/><br/>
            ( ........................................ )
          </td>
          <td style="width: 33.3%;">
            Saksi Paslon No. 2<br/><br/><br/><br/>
            ( ........................................ )
          </td>
          <td style="width: 33.3%;">
            Saksi Paslon No. 3<br/><br/><br/><br/>
            ( ........................................ )
          </td>
        </tr>
      </table>

      <table class="sig-table" style="margin-top: 15px;">
        <tr>
          <td style="width: 50%;">
            Ketua Panitia Pemilihan (KPO),<br/><br/><br/><br/>
            <span class="sig-name">Dra. Sri Wahyuni, M.Pd</span><br/>
            <small>NIP. 19740512 199903 2 004</small>
          </td>
          <td style="width: 50%;">
            Pembina OSIS SMPN 2,<br/><br/><br/><br/>
            <span class="sig-name">Ahmad Fauzi, S.Pd</span><br/>
            <small>NIP. 19820315 200801 1 009</small>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 25px;">
            Mengetahui dan Mengesahkan,<br/>
            Kepala SMP Negeri 2 Kota Bogor<br/><br/><br/><br/>
            <span class="sig-name">Drs. H. Mulyadi, M.M.Pd</span><br/>
            <small>NIP. 19681120 199412 1 002</small>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <script>
    // Buka dialog print secara otomatis saat dokumen dimuat
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback jika pop-up diblokir: buat iframe cetak tersembunyi
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
