import type { Kelas } from '../types';

/**
 * Validasi apakah sebuah string adalah format UUID yang valid
 */
export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Normalisasi format tanggal lahir ke format standar YYYY-MM-DD
 * Mendukung: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, DD.MM.YYYY, dsb.
 */
export function normalizeDate(dateStr?: string | null): string {
  if (!dateStr) return '2011-01-01';
  let str = String(dateStr).trim();

  // Bersihkan karakter non-ASCII atau kutip
  str = str.replace(/['"]/g, '').trim();

  // Format 1: YYYY-MM-DD atau YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    if (year >= 1990 && year <= 2030 && Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 2: DD/MM/YYYY atau DD-MM-YYYY atau DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const month = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const year = parseInt(dmyMatch[3], 10);
    if (year >= 1990 && year <= 2030 && Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Coba parse dengan objek Date bawaan JavaScript
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      if (year >= 1990 && year <= 2030) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  } catch {
    // Fallback default
  }

  return '2011-01-01';
}

/**
 * Normalisasi penulisan nama kelas agar seragam
 * Contoh: "7A" -> "7-A", "VII A" -> "7-A", "Kelas 8-B" -> "8-B", "9C" -> "9-C"
 */
export function normalizeClassName(className?: string | null): string {
  if (!className) return '7-A';
  let str = String(className).trim().toUpperCase();

  // Hapus kata prefix seperti "KELAS", "ROMBEL", "TINGKAT"
  str = str.replace(/^(KELAS|ROMBEL|TINGKAT)\s+/i, '').trim();

  // Konversi angka romawi
  str = str.replace(/^VII[-\s]?/i, '7-');
  str = str.replace(/^VIII[-\s]?/i, '8-');
  str = str.replace(/^IX[-\s]?/i, '9-');

  // Format seperti "7A" atau "7 A" menjadi "7-A"
  const singleMatch = str.match(/^([789])\s*[-_ ]?\s*([A-Za-z0-9]+)$/);
  if (singleMatch) {
    return `${singleMatch[1]}-${singleMatch[2].toUpperCase()}`;
  }

  return str || '7-A';
}

export interface ParsedStudentRow {
  nisn: string;
  nama: string;
  tanggal_lahir: string;
  nama_kelas: string;
  kelas_id?: string;
}

/**
 * Parser pintar untuk data CSV, TSV, atau copas Excel / Google Sheets
 */
export function parseStudentText(
  rawText: string,
  defaultTargetKelasId?: string,
  kelasList: Kelas[] = []
): { parsed: ParsedStudentRow[]; headersSkipped: boolean; totalRows: number } {
  if (!rawText || !rawText.trim()) {
    return { parsed: [], headersSkipped: false, totalRows: 0 };
  }

  // Hilangkan UTF-8 BOM jika ada
  let cleanText = rawText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r\n|\n|\r/);
  const parsed: ParsedStudentRow[] = [];
  let headersSkipped = false;
  let totalRows = 0;

  // Siapkan map pencarian kelas
  const kelasIdMap = new Map<string, Kelas>();
  const kelasNameMap = new Map<string, Kelas>();

  kelasList.forEach(k => {
    kelasIdMap.set(k.id, k);
    kelasNameMap.set(k.nama_kelas.toUpperCase().trim(), k);
    kelasNameMap.set(normalizeClassName(k.nama_kelas), k);
  });

  const defaultKelasObj = defaultTargetKelasId ? kelasIdMap.get(defaultTargetKelasId) : (kelasList[0] || null);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    totalRows++;

    // Tentukan delimiter: tab, titik koma, pipa, atau koma
    let parts: string[] = [];
    if (rawLine.includes('\t')) {
      parts = rawLine.split('\t');
    } else if (rawLine.includes(';')) {
      parts = rawLine.split(';');
    } else if (rawLine.includes('|')) {
      parts = rawLine.split('|');
    } else {
      // Pemisahan koma dengan menghormati tanda kutip
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = regex.exec(rawLine)) !== null) {
        if (m.index === regex.lastIndex) regex.lastIndex++;
        matches.push(m[1]);
      }
      parts = matches.filter((_, idx) => idx % 2 === 0);
      if (parts.length <= 1) {
        parts = rawLine.split(',');
      }
    }

    // Bersihkan spasi dan tanda kutip
    parts = parts.map(p => (p || '').trim().replace(/^["']|["']$/g, '').trim());

    if (parts.length === 0 || !parts.some(p => p.length > 0)) continue;

    // Cek apakah ini baris header (misal: "NISN", "Nama", "No", "Kelas")
    const firstColLower = (parts[0] || '').toLowerCase();
    const secondColLower = (parts[1] || '').toLowerCase();
    if (
      firstColLower.includes('nisn') ||
      firstColLower.includes('nomor') ||
      firstColLower.includes('no') ||
      secondColLower.includes('nisn') ||
      secondColLower.includes('nama') ||
      firstColLower.includes('nama')
    ) {
      // Jika kolom kedua adalah nama atau kelas, kemungkinan besar baris header
      if (
        firstColLower === 'no' ||
        firstColLower === 'nisn' ||
        secondColLower.includes('nama') ||
        parts.some(p => p.toLowerCase().includes('tanggal') || p.toLowerCase().includes('kelas'))
      ) {
        headersSkipped = true;
        continue;
      }
    }

    // Deteksi jika kolom 0 hanya nomor urut (1, 2, 3...) dan kolom 1 adalah NISN
    if (parts.length >= 3 && /^\d{1,4}$/.test(parts[0]) && /^\d{5,20}$/.test(parts[1])) {
      parts.shift(); // hilangkan nomor urut
    }

    if (parts.length < 2) continue;

    // Bersihkan NISN (hanya ambil angka atau alphanumeric bersih)
    let nisn = parts[0].replace(/[^0-9a-zA-Z]/g, '').trim();
    let nama = parts[1].trim();

    if (!nisn || !nama) continue;

    let dobStr = '2011-01-01';
    let kelasNameStr = defaultKelasObj ? defaultKelasObj.nama_kelas : '7-A';
    let assignedKelasId = defaultKelasObj ? defaultKelasObj.id : undefined;

    // Jika target kelas spesifik dipilih dan bukan 'auto', selalu gunakan kelas tujuan tersebut
    const hasSpecificTarget = defaultTargetKelasId && defaultTargetKelasId !== 'auto' && defaultKelasObj;

    if (parts.length === 2) {
      // Hanya NISN dan Nama
      if (hasSpecificTarget) {
        kelasNameStr = defaultKelasObj.nama_kelas;
        assignedKelasId = defaultKelasObj.id;
      }
    } else if (parts.length === 3) {
      // 3 kolom: Bisa (NISN, Nama, Tanggal Lahir) atau (NISN, Nama, Kelas)
      const col3 = parts[2].trim();
      if (looksLikeDate(col3)) {
        dobStr = normalizeDate(col3);
        if (hasSpecificTarget) {
          kelasNameStr = defaultKelasObj.nama_kelas;
          assignedKelasId = defaultKelasObj.id;
        }
      } else {
        if (!hasSpecificTarget) {
          kelasNameStr = normalizeClassName(col3);
          const matched = kelasNameMap.get(kelasNameStr) || kelasNameMap.get(col3.toUpperCase());
          if (matched) {
            assignedKelasId = matched.id;
            kelasNameStr = matched.nama_kelas;
          }
        }
      }
    } else if (parts.length >= 4) {
      // 4+ kolom: NISN, Nama, Tanggal Lahir, Kelas (atau NISN, Nama, Kelas, Tanggal Lahir)
      const col3 = parts[2].trim();
      const col4 = parts[3].trim();

      if (looksLikeDate(col3)) {
        dobStr = normalizeDate(col3);
        if (!hasSpecificTarget && col4) {
          kelasNameStr = normalizeClassName(col4);
          const matched = kelasNameMap.get(kelasNameStr) || kelasNameMap.get(col4.toUpperCase());
          if (matched) {
            assignedKelasId = matched.id;
            kelasNameStr = matched.nama_kelas;
          }
        }
      } else if (looksLikeDate(col4)) {
        dobStr = normalizeDate(col4);
        if (!hasSpecificTarget && col3) {
          kelasNameStr = normalizeClassName(col3);
          const matched = kelasNameMap.get(kelasNameStr) || kelasNameMap.get(col3.toUpperCase());
          if (matched) {
            assignedKelasId = matched.id;
            kelasNameStr = matched.nama_kelas;
          }
        }
      } else {
        dobStr = normalizeDate(col3);
        if (!hasSpecificTarget && col4) {
          kelasNameStr = normalizeClassName(col4);
        }
      }
    }

    if (hasSpecificTarget) {
      kelasNameStr = defaultKelasObj.nama_kelas;
      assignedKelasId = defaultKelasObj.id;
    }

    parsed.push({
      nisn,
      nama,
      tanggal_lahir: dobStr,
      nama_kelas: kelasNameStr,
      kelas_id: assignedKelasId
    });
  }

  return { parsed, headersSkipped, totalRows };
}

function looksLikeDate(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  // Mengandung tanda pemisah tanggal / atau - atau .
  if (/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s)) return true;
  if (/\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(s)) return true;
  return false;
}
