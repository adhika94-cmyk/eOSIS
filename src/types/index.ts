export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number; // 7, 8, or 9
  wali_kelas: string;
  created_at?: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  tanggal_lahir: string; // YYYY-MM-DD
  kelas_id: string;
  kelas_nama?: string;
  sudah_memilih: boolean;
  waktu_memilih?: string | null;
  created_at?: string;
  kategori?: 'siswa' | 'guru';
}

export interface Kandidat {
  id: string;
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string;
  slogan: string;
  visi: string;
  misi: string; // newline separated or markdown list
  foto_url: string;
  total_suara: number;
  created_at?: string;
}

export interface Pengaturan {
  id: number | string;
  nama_sekolah: string;
  logo_sekolah: string;
  periode_pemilihan: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  voting_dibuka: boolean;
  quick_count_publik?: boolean;
  updated_at?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  nama_lengkap: string;
  password_hash: string;
}

export interface VoteResult {
  success: boolean;
  message: string;
  nama_siswa?: string;
}

export interface Statistics {
  totalSiswa: number;
  totalKelas: number;
  totalKandidat: number;
  sudahMemilih: number;
  belumMemilih: number;
  persentasePartisipasi: number;
  totalSuaraMasuk: number;
  totalSiswaOnly?: number;
  totalGuru?: number;
  siswaSudahMemilih?: number;
  guruSudahMemilih?: number;
}
