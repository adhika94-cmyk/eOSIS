import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Kelas, Siswa, Kandidat, Pengaturan, AdminUser, VoteResult, Statistics } from '../types';
import { hashPassword } from '../utils/crypto';
import { getIdbItem, setIdbItem, removeIdbItem } from '../utils/idb';
import { isValidUUID, normalizeDate, normalizeClassName } from '../utils/studentParser';

// Kumpulan nama Indonesia untuk Generator DPT Massal tak terbatas
const FIRST_NAMES = [
  'Aditya', 'Ahmad', 'Aisyah', 'Alif', 'Amanda', 'Ananda', 'Andi', 'Annisa', 'Arif', 'Arya',
  'Azizah', 'Bagus', 'Bagas', 'Bayu', 'Bella', 'Bima', 'Budi', 'Chairul', 'Citra', 'Danang',
  'Daffa', 'Dela', 'Dewi', 'Dimas', 'Dina', 'Dwi', 'Eka', 'Erina', 'Fadhil', 'Fajar',
  'Farhan', 'Fathir', 'Fitri', 'Galang', 'Gilang', 'Gita', 'Hafiz', 'Haikal', 'Haris', 'Hendra',
  'Husna', 'Ilham', 'Indah', 'Intan', 'Irfan', 'Jonathan', 'Karin', 'Kayla', 'Kevin', 'Laras',
  'Luthfi', 'Mahendra', 'Malik', 'Maulana', 'Maya', 'Mega', 'Melati', 'Muhammad', 'Mutiara', 'Nabila',
  'Nadhira', 'Naufal', 'Nisa', 'Nova', 'Nur', 'Panji', 'Putra', 'Putri', 'Rafi', 'Rahma',
  'Raihan', 'Raka', 'Rama', 'Rasyid', 'Reza', 'Rian', 'Rifqi', 'Rina', 'Rio', 'Rizky',
  'Salma', 'Sarah', 'Satria', 'Septian', 'Shafa', 'Siti', 'Syifa', 'Taufik', 'Tiara', 'Tri',
  'Vina', 'Wahyu', 'Wulan', 'Yogi', 'Yudha', 'Yuni', 'Zahra', 'Zidan', 'Zulfa', 'Rezky'
];

const LAST_NAMES = [
  'Pratama', 'Saputra', 'Putra', 'Kusuma', 'Nugraha', 'Hidayat', 'Wibowo', 'Santoso', 'Gunawan',
  'Wijaya', 'Siregar', 'Lestari', 'Handayani', 'Permatasari', 'Anggraini', 'Safitri', 'Zahrani',
  'Ramadhani', 'Maharani', 'Setiawan', 'Pranata', 'Maulana', 'Sudirman', 'Kurniawan', 'Purnama',
  'Fauzi', 'Hakim', 'Nasution', 'Batubara', 'Wicaksono', 'Pangestu', 'Suharto', 'Purnomo',
  'Firmansyah', 'Adriansyah', 'Suryono', 'Utomo', 'Subagyo', 'Hasan', 'Alamsyah', 'Wahyudi'
];

// Kunci penyimpanan LocalStorage
const STORAGE_KEYS = {
  KELAS: 'eosis_kelas',
  SISWA: 'eosis_siswa',
  KANDIDAT: 'eosis_kandidat',
  PENGATURAN: 'eosis_pengaturan',
  ADMIN: 'eosis_admin',
  SUARA_LEDGER: 'eosis_suara_ledger',
  SUPABASE_CONFIG: 'eosis_supabase_custom_config'
};

// Seed Data Awal SMP Negeri 2 Kota Bogor
const INITIAL_CLASSES: Kelas[] = [
  { id: 'k-7a', nama_kelas: '7-A', tingkat: 7, wali_kelas: 'Dra. Sri Wahyuni, M.Pd' },
  { id: 'k-7b', nama_kelas: '7-B', tingkat: 7, wali_kelas: 'Ahmad Fauzi, S.Pd' },
  { id: 'k-7c', nama_kelas: '7-C', tingkat: 7, wali_kelas: 'Dewi Lestari, S.Pd' },
  { id: 'k-8a', nama_kelas: '8-A', tingkat: 8, wali_kelas: 'Bambang Sudirman, M.Si' },
  { id: 'k-8b', nama_kelas: '8-B', tingkat: 8, wali_kelas: 'Rina Kusuma, S.Pd' },
  { id: 'k-8c', nama_kelas: '8-C', tingkat: 8, wali_kelas: 'Hendra Gunawan, S.Kom' },
  { id: 'k-9a', nama_kelas: '9-A', tingkat: 9, wali_kelas: 'Drs. H. Mulyadi' },
  { id: 'k-9b', nama_kelas: '9-B', tingkat: 9, wali_kelas: 'Siti Nurhaliza, M.Pd' },
  { id: 'k-9c', nama_kelas: '9-C', tingkat: 9, wali_kelas: 'Eko Prasetyo, S.Pd' },
  { id: 'k-guru', nama_kelas: 'DEWAN GURU & STAF', tingkat: 0, wali_kelas: 'Kepala Sekolah' }
];

const INITIAL_CANDIDATES: Kandidat[] = [
  {
    id: 'cand-1',
    nomor_urut: 1,
    nama_ketua: 'Muhammad Reza Pratama',
    nama_wakil: 'Amanda Putri Maharani',
    slogan: 'Inovatif, Berkarakter, dan Menginspirasi Prestasi',
    visi: 'Mewujudkan OSIS SMP Negeri 2 Kota Bogor sebagai wadah aspirasi siswa yang unggul, religius, berwawasan global, dan berakar pada nilai integritas kebangsaan.',
    misi: '1. Mengoptimalkan program ekstrakurikuler seni, riset ilmiah, dan olahraga.\n2. Mengembangkan literasi digital cerdas serta kampanye anti-perundungan (zero bullying).\n3. Menampung dan merealisasikan aspirasi siswa melalui kotak saran digital e-Spenda.\n4. Mengadakan festival bakat dan kepemimpinan siswa secara berkala.',
    foto_url: '/src/assets/images/kandidat_paslon_1_1793253208173.jpg',
    total_suara: 142
  },
  {
    id: 'cand-2',
    nomor_urut: 2,
    nama_ketua: 'Aisha Humaira Zahra',
    nama_wakil: 'Budi Kurnia Pratama',
    slogan: 'Solidaritas Bersama, Spenda Berwibawa & Peduli Lingkungan',
    visi: 'Membangun karakter siswa SPENDA yang peduli lingkungan (Green School), kreatif, berdisiplin tinggi, dan saling merangkul dalam kebersamaan.',
    misi: '1. Menggalakkan program eco-school peduli daur ulang dan hemat energi di sekolah.\n2. Menjalin keakraban antartingkat kelas melalui kompetisi classmeeting kreatif.\n3. Memberdayakan unit kegiatan keagamaan dan toleransi antarwarga sekolah.\n4. Memperkuat kolaborasi OSIS bersama dewan guru dan alumni berprestasi.',
    foto_url: '/src/assets/images/kandidat_paslon_2_1793253209127.jpg',
    total_suara: 168
  },
  {
    id: 'cand-3',
    nomor_urut: 3,
    nama_ketua: 'Annisa Rahmawati',
    nama_wakil: 'Rifqi Permana Putra',
    slogan: 'Aspiratif, Berprestasi, dan Berteknologi Menuju Masa Depan',
    visi: 'Mewujudkan lingkungan SMPN 2 Kota Bogor yang ramah anak, adaptif terhadap kemajuan teknologi, dan berdaya saing tinggi di tingkat regional maupun nasional.',
    misi: '1. Menginisiasi klub coding, multimedia, dan podcast edukasi siswa SPENDA.\n2. Meningkatkan bimbingan sebaya untuk persiapan olimpiade sains dan seni.\n3. Menyelenggarakan aksi bakti sosial dan kepedulian masyarakat Kota Bogor.\n4. Memperjuangkan transparansi kegiatan dan anggaran OSIS kepada perwakilan kelas.',
    foto_url: '/src/assets/images/kandidat_paslon_3_1793253209679.jpg',
    total_suara: 115
  }
];

const INITIAL_STUDENTS: Siswa[] = [
  // Contoh siswa kelas 7-A
  { id: 's-1', nisn: '0081234501', nama: 'Aditya Dimas Nugraha', tanggal_lahir: '2011-04-12', kelas_id: 'k-7a', sudah_memilih: true, waktu_memilih: '2026-10-28T08:15:20Z' },
  { id: 's-2', nisn: '0081234502', nama: 'Bella Safitri Handayani', tanggal_lahir: '2011-06-25', kelas_id: 'k-7a', sudah_memilih: true, waktu_memilih: '2026-10-28T08:22:11Z' },
  { id: 's-3', nisn: '0081234503', nama: 'Citra Kirana Dewi', tanggal_lahir: '2011-09-18', kelas_id: 'k-7a', sudah_memilih: false, waktu_memilih: null },
  { id: 's-4', nisn: '0081234504', nama: 'Danang Tri Wicaksono', tanggal_lahir: '2011-11-03', kelas_id: 'k-7a', sudah_memilih: false, waktu_memilih: null },
  { id: 's-5', nisn: '0081234505', nama: 'Erina Zahrani', tanggal_lahir: '2011-02-14', kelas_id: 'k-7a', sudah_memilih: true, waktu_memilih: '2026-10-28T08:35:40Z' },

  // Siswa kelas 8-A
  { id: 's-6', nisn: '0071234506', nama: 'Fajar Maulana Malik', tanggal_lahir: '2010-05-19', kelas_id: 'k-8a', sudah_memilih: true, waktu_memilih: '2026-10-28T09:05:00Z' },
  { id: 's-7', nisn: '0071234507', nama: 'Gita Rahmadani', tanggal_lahir: '2010-08-30', kelas_id: 'k-8a', sudah_memilih: false, waktu_memilih: null },
  { id: 's-8', nisn: '0071234508', nama: 'Haris Setiawan', tanggal_lahir: '2010-01-10', kelas_id: 'k-8a', sudah_memilih: true, waktu_memilih: '2026-10-28T09:20:15Z' },
  { id: 's-9', nisn: '0071234509', nama: 'Indah Permatasari', tanggal_lahir: '2010-12-04', kelas_id: 'k-8a', sudah_memilih: false, waktu_memilih: null },
  
  // Siswa kelas 9-A
  { id: 's-10', nisn: '0061234510', nama: 'Jonathan Edward Siregar', tanggal_lahir: '2009-03-21', kelas_id: 'k-9a', sudah_memilih: true, waktu_memilih: '2026-10-28T10:02:44Z' },
  { id: 's-11', nisn: '0061234511', nama: 'Kayla Az-Zahra', tanggal_lahir: '2009-07-15', kelas_id: 'k-9a', sudah_memilih: true, waktu_memilih: '2026-10-28T10:14:02Z' },
  { id: 's-12', nisn: '0061234512', nama: 'Luthfi Hakim', tanggal_lahir: '2009-10-09', kelas_id: 'k-9a', sudah_memilih: false, waktu_memilih: null },

  // Siswa untuk demo login siap pakai
  { id: 's-demo', nisn: '0089998881', nama: 'Raden Arya Wibisono', tanggal_lahir: '2011-08-17', kelas_id: 'k-7b', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  { id: 's-demo2', nisn: '0078887772', nama: 'Siti Sarah Nurhaliza', tanggal_lahir: '2010-03-20', kelas_id: 'k-8b', sudah_memilih: true, waktu_memilih: '2026-10-28T08:50:11Z', kategori: 'siswa' },
  
  // Contoh data Guru
  { id: 'g-1', nisn: '197501012005011001', nama: 'Drs. H. Mulyadi, M.Pd', tanggal_lahir: '1975-01-01', kelas_id: 'k-guru', sudah_memilih: false, waktu_memilih: null, kategori: 'guru' },
  { id: 'g-2', nisn: '198205122010012005', nama: 'Sri Wahyuni, S.Pd', tanggal_lahir: '1982-05-12', kelas_id: 'k-guru', sudah_memilih: false, waktu_memilih: null, kategori: 'guru' }
];

const INITIAL_SETTINGS: Pengaturan = {
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: '/src/assets/images/osis_spenda_logo_1793253206503.jpg',
  periode_pemilihan: '2025/2026',
  waktu_mulai: '2026-10-28T07:00:00Z',
  waktu_selesai: '2026-11-05T15:00:00Z',
  voting_dibuka: true
};

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private isSupabaseEnabled: boolean = false;

  constructor() {
    this.initDatabase();
  }

  public initDatabase() {
    // 1. Cek LocalStorage untuk seed data
    if (!localStorage.getItem(STORAGE_KEYS.KELAS)) {
      localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(INITIAL_CLASSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.KANDIDAT)) {
      localStorage.setItem(STORAGE_KEYS.KANDIDAT, JSON.stringify(INITIAL_CANDIDATES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SISWA)) {
      localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(INITIAL_STUDENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PENGATURAN)) {
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
      // Default admin: admin / admin123 (SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
      const defaultAdmin: AdminUser = {
        id: 'adm-1',
        username: 'admin',
        nama_lengkap: 'Pembina OSIS SMPN 2',
        password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(defaultAdmin));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUARA_LEDGER)) {
      // Secret ballot: Suara anonim tanpa identitas siswa
      const sampleVotes = [
        ...Array(142).fill({ kandidat_id: 'cand-1', waktu: '2026-10-28T08:00:00Z' }),
        ...Array(168).fill({ kandidat_id: 'cand-2', waktu: '2026-10-28T08:30:00Z' }),
        ...Array(115).fill({ kandidat_id: 'cand-3', waktu: '2026-10-28T09:00:00Z' })
      ];
      localStorage.setItem(STORAGE_KEYS.SUARA_LEDGER, JSON.stringify(sampleVotes));
    }

    // 2. Cek koneksi Supabase
    this.setupSupabaseClient();
  }

  public setupSupabaseClient(): boolean {
    const customConfigStr = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (customConfigStr) {
      try {
        const config = JSON.parse(customConfigStr);
        if (config.url && config.key) {
          supabaseUrl = config.url;
          supabaseKey = config.key;
        }
      } catch (e) {
        console.error('Failed to parse custom supabase config', e);
      }
    }

    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseEnabled = true;
        return true;
      } catch (err) {
        console.warn('Supabase client init failed, fallback to local DB', err);
        this.supabase = null;
        this.isSupabaseEnabled = false;
        return false;
      }
    } else {
      this.supabase = null;
      this.isSupabaseEnabled = false;
      return false;
    }
  }

  public isUsingSupabase(): boolean {
    return this.isSupabaseEnabled && this.supabase !== null;
  }

  public setCustomSupabaseConfig(url: string, key: string): boolean {
    if (!url || !key) {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG);
      this.supabase = null;
      this.isSupabaseEnabled = false;
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({ url, key }));
    return this.setupSupabaseClient();
  }

  public getSupabaseConfig(): { url: string; key: string } {
    const customConfigStr = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (customConfigStr) {
      try {
        return JSON.parse(customConfigStr);
      } catch {
        // ignore
      }
    }
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    };
  }

  // ====================== PENGATURAN ======================
  public async getPengaturan(): Promise<Pengaturan> {
    if (this.isUsingSupabase()) {
      try {
        const { data, error } = await this.supabase!.from('pengaturan').select('*').limit(1).maybeSingle();
        if (data && !error) return data as Pengaturan;
      } catch (e) {
        console.warn('Supabase getPengaturan fallback to local', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
    return raw ? JSON.parse(raw) : INITIAL_SETTINGS;
  }

  public async updatePengaturan(payload: Partial<Pengaturan>): Promise<Pengaturan> {
    const current = await this.getPengaturan();
    const updated: Pengaturan = { ...current, ...payload, updated_at: new Date().toISOString() };

    localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(updated));

    if (this.isUsingSupabase()) {
      try {
        if (current.id !== undefined && current.id !== null) {
          await this.supabase!.from('pengaturan').update(payload).eq('id', current.id);
        } else {
          await this.supabase!.from('pengaturan').update(payload).neq('nama_sekolah', '');
        }
      } catch (e) {
        console.warn('Supabase updatePengaturan sync failed', e);
      }
    }

    return updated;
  }

  // ====================== ADMIN AUTH ======================
  public async getAdmin(): Promise<AdminUser> {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN);
    let admin: AdminUser = raw ? JSON.parse(raw) : {
      id: 'adm-1',
      username: 'admin',
      nama_lengkap: 'Pembina OSIS SMPN 2',
      password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
    };

    // Auto-heal: jika hash lama yang keliru masih tersimpan di browser user, pulihkan ke hash admin123 yang benar
    if (admin.password_hash === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa82280f1a7cae33d') {
      admin.password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));
    }

    return admin;
  }

  public async updateAdminCredentials(username: string, newPassword?: string, namaLengkap?: string): Promise<boolean> {
    const admin = await this.getAdmin();
    admin.username = username;
    if (namaLengkap) admin.nama_lengkap = namaLengkap;
    if (newPassword && newPassword.trim() !== '') {
      admin.password_hash = await hashPassword(newPassword.trim());
    }
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));

    if (this.isUsingSupabase()) {
      try {
        const updateData: any = { username };
        if (namaLengkap) updateData.nama_lengkap = namaLengkap;
        if (newPassword && newPassword.trim() !== '') {
          updateData.password_hash = admin.password_hash;
        }
        await this.supabase!.from('admin').update(updateData).eq('id', admin.id);
      } catch (e) {
        console.warn('Supabase admin update sync failed', e);
      }
    }
    return true;
  }

  // ====================== KELAS CRUD ======================
  public async getKelasList(): Promise<Kelas[]> {
    if (this.isUsingSupabase()) {
      try {
        const { data, error } = await this.supabase!
          .from('kelas')
          .select('*')
          .order('tingkat', { ascending: true })
          .order('nama_kelas', { ascending: true });

        if (data && !error && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(data));
          return data as Kelas[];
        }

        // Jika tabel kelas di Supabase masih kosong, seed otomatis kelas default (7-A s.d 9-C)
        if (data && !error && data.length === 0) {
          console.info('[eOSIS] Tabel kelas di Supabase masih kosong, otomatis mengisi data kelas default...');
          const seedPayload = INITIAL_CLASSES.map(k => ({
            nama_kelas: k.nama_kelas,
            tingkat: k.tingkat,
            wali_kelas: k.wali_kelas
          }));
          const { data: seeded, error: seedErr } = await this.supabase!
            .from('kelas')
            .insert(seedPayload)
            .select('*');

          if (seeded && !seedErr && seeded.length > 0) {
            localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(seeded));
            return seeded as Kelas[];
          }
        }
      } catch (e) {
        console.warn('Supabase getKelasList fallback', e);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEYS.KELAS);
    let list: Kelas[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
    if (!list || list.length === 0) {
      list = [...INITIAL_CLASSES];
    }

    // Ensure Guru unit exists
    const hasGuru = list.some(k => k.id === 'k-guru' || k.nama_kelas === 'DEWAN GURU & STAF');
    if (!hasGuru) {
      list.push({ id: 'k-guru', nama_kelas: 'DEWAN GURU & STAF', tingkat: 0, wali_kelas: 'Kepala Sekolah' });
    }

    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list));
    return list.sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));
  }

  public async saveKelas(kelas: Omit<Kelas, 'id'> & { id?: string }): Promise<Kelas> {
    const list = await this.getKelasList();
    let saved: Kelas;

    if (this.isUsingSupabase()) {
      try {
        if (kelas.id && isValidUUID(kelas.id)) {
          // Update pada baris Supabase yang sudah memiliki UUID
          const { data, error } = await this.supabase!
            .from('kelas')
            .update({
              nama_kelas: kelas.nama_kelas.toUpperCase().trim(),
              tingkat: Number(kelas.tingkat),
              wali_kelas: kelas.wali_kelas || ''
            })
            .eq('id', kelas.id)
            .select('*')
            .single();

          if (data && !error) {
            saved = data as Kelas;
            const index = list.findIndex(k => k.id === kelas.id);
            if (index >= 0) list[index] = saved; else list.push(saved);
            localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list));
            return saved;
          }
        } else {
          // Insert baris kelas baru ke Supabase (biarkan database generate gen_random_uuid())
          const { data, error } = await this.supabase!
            .from('kelas')
            .insert({
              nama_kelas: kelas.nama_kelas.toUpperCase().trim(),
              tingkat: Number(kelas.tingkat),
              wali_kelas: kelas.wali_kelas || ''
            })
            .select('*')
            .single();

          if (data && !error) {
            saved = data as Kelas;
            list.push(saved);
            localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list));
            return saved;
          }
        }
      } catch (e) {
        console.warn('Supabase saveKelas sync error', e);
      }
    }

    if (kelas.id) {
      // Update lokal
      const index = list.findIndex(k => k.id === kelas.id);
      saved = { ...list[index], ...kelas, id: kelas.id };
      if (index >= 0) list[index] = saved;
    } else {
      // Create lokal
      saved = {
        id: 'k-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        nama_kelas: kelas.nama_kelas.toUpperCase().trim(),
        tingkat: Number(kelas.tingkat),
        wali_kelas: kelas.wali_kelas || '',
        created_at: new Date().toISOString()
      };
      list.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list));
    return saved;
  }

  public async deleteKelas(id: string): Promise<boolean> {
    let list = await this.getKelasList();
    list = list.filter(k => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list));

    if (this.isUsingSupabase()) {
      try {
        if (isValidUUID(id)) {
          await this.supabase!.from('kelas').delete().eq('id', id);
        } else {
          // Cari jika ada kelas bernama sama di Supabase
          await this.supabase!.from('kelas').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('Supabase deleteKelas sync error', e);
      }
    }
    return true;
  }

  // ====================== SISWA CRUD (KAPASITAS TAK TERBATAS - INDEXEDDB & LOCAL ENGINE) ======================
  private siswaMemoryCache: Siswa[] | null = null;

  /**
   * Mengambil seluruh data mentah siswa dari cache, IndexedDB, atau LocalStorage.
   * Tetap menghormati kondisi array kosong [] (ketika admin sengaja mengosongkan siswa).
   */
  private async getRawSiswaList(): Promise<Siswa[]> {
    if (this.siswaMemoryCache !== null && Array.isArray(this.siswaMemoryCache)) {
      return [...this.siswaMemoryCache];
    }

    // 1. Coba baca dari IndexedDB (kapasitas tak terbatas)
    try {
      const fromIdb = await getIdbItem<Siswa[]>(STORAGE_KEYS.SISWA);
      if (fromIdb !== null && fromIdb !== undefined && Array.isArray(fromIdb)) {
        this.siswaMemoryCache = fromIdb;
        return [...fromIdb];
      }
    } catch (e) {
      console.warn('Gagal membaca data siswa dari IndexedDB', e);
    }

    // 2. Fallback baca dari LocalStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SISWA);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.siswaMemoryCache = parsed;
          await setIdbItem(STORAGE_KEYS.SISWA, parsed);
          return [...parsed];
        }
      }
    } catch (e) {
      console.warn('Gagal membaca data siswa dari LocalStorage', e);
    }

    // 3. Fallback hanya jika belum pernah diinisialisasi sama sekali
    this.siswaMemoryCache = [...INITIAL_STUDENTS];
    await this.persistSiswaList(INITIAL_STUDENTS);
    return [...INITIAL_STUDENTS];
  }

  /**
   * Menyimpan data siswa ke IndexedDB (unlimited) dan LocalStorage (dengan perlindungan quota)
   */
  private async persistSiswaList(list: Siswa[]): Promise<void> {
    this.siswaMemoryCache = [...list];

    // Simpan ke IndexedDB (kapasitas tak terbatas)
    await setIdbItem(STORAGE_KEYS.SISWA, list);

    // Simpan ke LocalStorage jika masih dalam kuota (tanpa melempar fatal error)
    try {
      localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(list));
    } catch (quotaErr) {
      console.info('[eOSIS] Ukuran DPT siswa melampaui kuota LocalStorage 5MB. Data tersimpan aman di IndexedDB (Unlimited Capacity).', quotaErr);
    }
  }

  public async getSiswaList(kelasFilter?: string, search?: string, kategoriFilter?: string): Promise<Siswa[]> {
    let list: Siswa[] = [];
    let fetchedFromRemote = false;

    // Ambil daftar kelas untuk pencocokan nama rombel
    const kelasList = await this.getKelasList();
    const kelasMap = new Map<string, string>();
    kelasList.forEach(k => {
      kelasMap.set(k.id, k.nama_kelas);
      kelasMap.set(k.nama_kelas, k.nama_kelas);
    });

    // Jika Supabase aktif, coba ambil dari remote database
    if (this.isUsingSupabase()) {
      try {
        let query = this.supabase!.from('siswa').select('*, kelas(nama_kelas)').order('nama', { ascending: true });
        if (kelasFilter && kelasFilter !== 'all') {
          query = query.eq('kelas_id', kelasFilter);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const localRaw = await this.getRawSiswaList();
          // Jika Supabase kosong (0 siswa) tetapi lokal sudah ada siswa (misal baru import atau cache lokal),
          // jangan hapus data lokal! Sinkronkan data lokal ke Supabase.
          if (data.length === 0 && localRaw.length > 0) {
            console.info('[eOSIS] Supabase siswa kosong sementara data lokal terisi. Menggunakan data lokal dan sinkronisasi ke Supabase...');
            list = localRaw.map(s => ({
              ...s,
              kelas_nama: kelasMap.get(s.kelas_id) || s.kelas_nama || 'Umum'
            }));
            this.syncLocalSiswaToSupabase(localRaw).catch(e => console.warn('Sync local to supabase background err', e));
          } else {
            list = data.map((item: any) => ({
              ...item,
              kelas_nama: item.kelas?.nama_kelas || kelasMap.get(item.kelas_id) || item.kelas_nama || '-'
            }));
            this.siswaMemoryCache = [...list];
            await setIdbItem(STORAGE_KEYS.SISWA, list);
          }
          fetchedFromRemote = true;
        }
      } catch (e) {
        console.warn('Supabase getSiswaList fallback to local engine', e);
      }
    }

    if (!fetchedFromRemote) {
      list = await this.getRawSiswaList();
      list = list.map(s => ({
        ...s,
        kelas_nama: kelasMap.get(s.kelas_id) || s.kelas_nama || 'Umum'
      }));

      if (kelasFilter && kelasFilter !== 'all') {
        list = list.filter(s => s.id === kelasFilter || s.kelas_id === kelasFilter);
      }
    }

    if (kategoriFilter && kategoriFilter !== 'all') {
      list = list.filter(s => s.kategori === kategoriFilter);
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(q));
    }

    return list;
  }

  public async findSiswaByNisnAndDob(nisn: string, dob: string): Promise<Siswa | null> {
    const cleanNisn = nisn.trim();
    // Jika input 4 digit, anggap itu tahun lahir
    const isYearOnly = dob.trim().length === 4 && !isNaN(parseInt(dob.trim()));
    const cleanDob = isYearOnly ? dob.trim() : normalizeDate(dob);

    if (this.isUsingSupabase()) {
      try {
        let query = this.supabase!
          .from('siswa')
          .select('*, kelas(nama_kelas)')
          .eq('nisn', cleanNisn);
        
        if (isYearOnly) {
          // PostgreSQL pattern match for YYYY-%
          query = query.like('tanggal_lahir', `${cleanDob}-%`);
        } else {
          query = query.eq('tanggal_lahir', cleanDob);
        }

        const { data, error } = await query.maybeSingle();
        if (data && !error) {
          return {
            ...data,
            kelas_nama: data.kelas?.nama_kelas || '-'
          };
        }
      } catch (e) {
        console.warn('Supabase findSiswaByNisnAndDob fallback', e);
      }
    }

    const students = await this.getRawSiswaList();
    const found = students.find(s => {
      const matchNisn = s.nisn === cleanNisn;
      if (!matchNisn) return false;

      if (isYearOnly) {
        // Cocokkan tahun saja (4 digit pertama dari YYYY-MM-DD)
        return s.tanggal_lahir.startsWith(cleanDob);
      } else {
        return normalizeDate(s.tanggal_lahir) === cleanDob;
      }
    });

    if (!found) return null;

    const kelasList = await this.getKelasList();
    const targetKelas = kelasList.find(k => k.id === found.kelas_id);

    return {
      ...found,
      kelas_nama: targetKelas?.nama_kelas || found.kelas_nama || 'Umum'
    };
  }

  public async saveSiswa(siswa: Omit<Siswa, 'id'> & { id?: string }): Promise<Siswa> {
    const list = await this.getRawSiswaList();
    let saved: Siswa;

    const cleanNisn = siswa.nisn.trim();
    const cleanNama = siswa.nama.trim();
    const cleanDob = normalizeDate(siswa.tanggal_lahir);

    // Cek duplikasi NISN
    const duplicate = list.find(s => s.nisn === cleanNisn && s.id !== siswa.id);
    if (duplicate) {
      throw new Error(`NISN ${siswa.nisn} sudah terdaftar atas nama ${duplicate.nama}.`);
    }

    // Pastikan kelas_id terisi
    const kelasList = await this.getKelasList();
    let resolvedKelasId = siswa.kelas_id;
    if (!resolvedKelasId && kelasList.length > 0) {
      resolvedKelasId = kelasList[0].id;
    }

    if (siswa.id) {
      saved = {
        ...list[index],
        ...siswa,
        nisn: cleanNisn,
        nama: cleanNama,
        tanggal_lahir: cleanDob,
        kelas_id: resolvedKelasId,
        id: siswa.id,
        kategori: (siswa as any).kategori || list[index]?.kategori || 'siswa'
      };
      if (index >= 0) list[index] = saved;
    } else {
      saved = {
        id: 's-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        nisn: cleanNisn,
        nama: cleanNama,
        tanggal_lahir: cleanDob,
        kelas_id: resolvedKelasId,
        sudah_memilih: false,
        waktu_memilih: null,
        kategori: (siswa as any).kategori || (resolvedKelasId === 'k-guru' ? 'guru' : 'siswa'),
        created_at: new Date().toISOString()
      };
      list.push(saved);
    }

    await this.persistSiswaList(list);

    if (this.isUsingSupabase()) {
      try {
        // Tentukan UUID kelas yang valid untuk Supabase
        let supaKelasId: string | null = null;
        if (isValidUUID(saved.kelas_id)) {
          supaKelasId = saved.kelas_id;
        } else {
          const matchK = kelasList.find(k => k.id === saved.kelas_id || k.nama_kelas === (siswa as any).kelas_nama);
          if (matchK && isValidUUID(matchK.id)) {
            supaKelasId = matchK.id;
          }
        }

        const payloadToDb: any = {
          nisn: saved.nisn,
          nama: saved.nama,
          tanggal_lahir: saved.tanggal_lahir,
          sudah_memilih: saved.sudah_memilih,
          kategori: saved.kategori || 'siswa',
          ...(supaKelasId ? { kelas_id: supaKelasId } : {})
        };

        if (siswa.id && isValidUUID(siswa.id)) {
          await this.supabase!.from('siswa').update(payloadToDb).eq('id', siswa.id);
        } else {
          const { data: supaSiswa, error: supaErr } = await this.supabase!
            .from('siswa')
            .upsert(payloadToDb, { onConflict: 'nisn' })
            .select('*')
            .single();

          if (supaSiswa && !supaErr) {
            saved.id = supaSiswa.id;
            const idx = list.findIndex(s => s.nisn === saved.nisn);
            if (idx >= 0) list[idx].id = supaSiswa.id;
            await this.persistSiswaList(list);
          }
        }
      } catch (e) {
        console.warn('Supabase saveSiswa sync error', e);
      }
    }

    return saved;
  }

  public async deleteSiswa(id: string): Promise<boolean> {
    let list = await this.getRawSiswaList();
    const target = list.find(s => s.id === id);
    list = list.filter(s => s.id !== id);
    await this.persistSiswaList(list);

    if (this.isUsingSupabase()) {
      try {
        if (target && target.nisn) {
          await this.supabase!.from('siswa').delete().eq('nisn', target.nisn);
        } else {
          await this.supabase!.from('siswa').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('Supabase deleteSiswa sync error', e);
      }
    }
    return true;
  }

  public async deleteMultipleSiswa(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    let list = await this.getRawSiswaList();
    const targets = list.filter(s => idSet.has(s.id));
    const targetNisns = targets.map(s => s.nisn).filter(Boolean);
    const initialCount = list.length;
    list = list.filter(s => !idSet.has(s.id));
    const deletedCount = initialCount - list.length;
    await this.persistSiswaList(list);

    if (this.isUsingSupabase()) {
      try {
        if (targetNisns.length > 0) {
          await this.supabase!.from('siswa').delete().in('nisn', targetNisns);
        } else {
          await this.supabase!.from('siswa').delete().in('id', ids);
        }
      } catch (e) {
        console.warn('Supabase deleteMultipleSiswa error', e);
      }
    }
    return deletedCount;
  }

  public async resetHakSuaraSiswa(id: string): Promise<boolean> {
    const list = await this.getRawSiswaList();
    const target = list.find(s => s.id === id);
    if (target) {
      target.sudah_memilih = false;
      target.waktu_memilih = null;
      await this.persistSiswaList(list);

      if (this.isUsingSupabase()) {
        try {
          if (target.nisn) {
            await this.supabase!.from('siswa').update({ sudah_memilih: false, waktu_memilih: null }).eq('nisn', target.nisn);
          } else {
            await this.supabase!.from('siswa').update({ sudah_memilih: false, waktu_memilih: null }).eq('id', id);
          }
        } catch (e) {
          console.warn('Supabase resetHakSuaraSiswa error', e);
        }
      }
      return true;
    }
    return false;
  }

  public async resetHakSuaraMultipleSiswa(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    const idSet = new Set(ids);
    const list = await this.getRawSiswaList();
    let count = 0;
    const targetNisns: string[] = [];

    list.forEach(s => {
      if (idSet.has(s.id) && s.sudah_memilih) {
        s.sudah_memilih = false;
        s.waktu_memilih = null;
        if (s.nisn) targetNisns.push(s.nisn);
        count++;
      }
    });

    if (count > 0) {
      await this.persistSiswaList(list);

      if (this.isUsingSupabase()) {
        try {
          if (targetNisns.length > 0) {
            await this.supabase!.from('siswa').update({ sudah_memilih: false, waktu_memilih: null }).in('nisn', targetNisns);
          } else {
            await this.supabase!.from('siswa').update({ sudah_memilih: false, waktu_memilih: null }).in('id', ids);
          }
        } catch (e) {
          console.warn('Supabase resetHakSuaraMultipleSiswa error', e);
        }
      }
    }

    return count;
  }

  /**
   * Import data siswa secara batch (Mendukung ribuan data tanpa batas)
   * Mendukung penentuan target kelas tujuan, penanganan duplikat NISN, dan sinkronisasi aman ke Supabase
   */
  public async importSiswaBatch(
    siswaList: Array<{ nisn: string; nama: string; tanggal_lahir: string; nama_kelas?: string; kelas_id?: string }>,
    updateIfExists: boolean = false,
    defaultTargetKelasId?: string
  ): Promise<{ imported: number; updated: number; skipped: number; total: number }> {
    const currentList = await this.getRawSiswaList();
    let kelasList = await this.getKelasList();

    // Map kelas berdasarkan nama dan ID untuk resolusi cepat
    const kelasMap = new Map<string, Kelas>();
    kelasList.forEach(k => {
      kelasMap.set(k.id, k);
      kelasMap.set(k.nama_kelas.toUpperCase().trim(), k);
      kelasMap.set(normalizeClassName(k.nama_kelas), k);
    });

    // Cek target kelas jika ditentukan admin
    let selectedTargetKelas: Kelas | null = null;
    if (defaultTargetKelasId && defaultTargetKelasId !== 'auto') {
      selectedTargetKelas = kelasList.find(k => k.id === defaultTargetKelasId) || null;
    }

    const nisnMap = new Map<string, number>(currentList.map((s, idx) => [s.nisn, idx]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const modifiedRecords: Siswa[] = [];

    for (const item of siswaList) {
      const cleanNisn = item.nisn ? String(item.nisn).trim().replace(/[^0-9a-zA-Z]/g, '') : '';
      const cleanNama = item.nama ? String(item.nama).trim() : '';
      const cleanDob = normalizeDate(item.tanggal_lahir);
      let targetKelasObj: Kelas | null = selectedTargetKelas;

      if (!cleanNisn || !cleanNama) {
        skipped++;
        continue;
      }

      // Jika belum ditentukan target kelas spesifik, cari berdasarkan kolom nama_kelas di baris data
      if (!targetKelasObj) {
        const rawKelasStr = item.nama_kelas ? item.nama_kelas.trim() : '';
        const normalizedK = normalizeClassName(rawKelasStr);

        if (item.kelas_id && kelasMap.has(item.kelas_id)) {
          targetKelasObj = kelasMap.get(item.kelas_id)!;
        } else if (kelasMap.has(normalizedK)) {
          targetKelasObj = kelasMap.get(normalizedK)!;
        } else if (rawKelasStr && kelasMap.has(rawKelasStr.toUpperCase())) {
          targetKelasObj = kelasMap.get(rawKelasStr.toUpperCase())!;
        } else if (rawKelasStr) {
          // Buat kelas baru jika belum terdaftar
          const newK = await this.saveKelas({
            nama_kelas: normalizedK,
            tingkat: parseInt(normalizedK) || 7,
            wali_kelas: 'Wali Kelas ' + normalizedK
          });
          targetKelasObj = newK;
          kelasMap.set(newK.id, newK);
          kelasMap.set(normalizedK, newK);
          // Perbarui kelasList
          kelasList = await this.getKelasList();
        } else {
          // Default ke kelas pertama
          targetKelasObj = kelasList[0] || INITIAL_CLASSES[0];
        }
      }

      const assignedKelasId = targetKelasObj ? targetKelasObj.id : (kelasList[0]?.id || 'k-7a');

      if (nisnMap.has(cleanNisn)) {
        if (updateIfExists) {
          const idx = nisnMap.get(cleanNisn)!;
          currentList[idx].nama = cleanNama;
          currentList[idx].tanggal_lahir = cleanDob;
          currentList[idx].kelas_id = assignedKelasId;
          modifiedRecords.push(currentList[idx]);
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newStudent: Siswa = {
          id: 's-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          nisn: cleanNisn,
          nama: cleanNama,
          tanggal_lahir: cleanDob,
          kelas_id: assignedKelasId,
          sudah_memilih: false,
          waktu_memilih: null,
          kategori: (item as any).kategori || (assignedKelasId === 'k-guru' ? 'guru' : 'siswa'),
          created_at: new Date().toISOString()
        };
        currentList.push(newStudent);
        nisnMap.set(cleanNisn, currentList.length - 1);
        modifiedRecords.push(newStudent);
        imported++;
      }
    }

    await this.persistSiswaList(currentList);

    // Sinkronkan ke Supabase jika aktif (dalam potongan 100 baris agar aman dari limit payload)
    if (this.isUsingSupabase() && modifiedRecords.length > 0) {
      try {
        await this.syncLocalSiswaToSupabase(modifiedRecords);
      } catch (e) {
        console.warn('[eOSIS] Gagal menyinkronkan beberapa baris ke Supabase', e);
      }
    }

    return { imported, updated, skipped, total: currentList.length };
  }

  /**
   * Sinkronisasi data siswa lokal ke tabel Supabase dengan fail-safe
   */
  public async syncLocalSiswaToSupabase(students: Siswa[]): Promise<void> {
    if (!this.isUsingSupabase() || students.length === 0) return;
    const kelasList = await this.getKelasList();

    const payload = students.map(s => {
      let supaKelasId: string | null = null;
      if (isValidUUID(s.kelas_id)) {
        supaKelasId = s.kelas_id;
      } else {
        const kMatch = kelasList.find(k => k.id === s.kelas_id || k.nama_kelas === s.kelas_nama);
        if (kMatch && isValidUUID(kMatch.id)) {
          supaKelasId = kMatch.id;
        }
      }
      return {
        nisn: s.nisn,
        nama: s.nama,
        tanggal_lahir: normalizeDate(s.tanggal_lahir),
        sudah_memilih: s.sudah_memilih,
        kategori: s.kategori || 'siswa',
        ...(supaKelasId ? { kelas_id: supaKelasId } : {})
      };
    });

    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      try {
        const { error } = await this.supabase!.from('siswa').upsert(chunk, { onConflict: 'nisn' });
        if (error) {
          console.warn('[eOSIS] Supabase chunk upsert error, retrying without kelas_id constraint:', error.message);
          // Jika gagal karena foreign key kelas_id, retry tanpa foreign key agar data siswa tetap tersimpan
          const safeChunk = chunk.map(({ kelas_id, ...rest }) => rest);
          await this.supabase!.from('siswa').upsert(safeChunk, { onConflict: 'nisn' });
        }
      } catch (err) {
        console.warn('Sync chunk error', err);
      }
    }
  }

  /**
   * Generator Siswa / DPT Massal Tak Terbatas
   * Menghasilkan N siswa baru dengan NISN valid 10-digit unik, nama khas pelajar Indonesia,
   * dan mendistribusikannya secara merata ke kelas-kelas.
   */
  public async generateBulkSiswa(count: number, targetKelasId?: string, kategori: 'siswa' | 'guru' = 'siswa'): Promise<{ generated: number; totalNow: number }> {
    if (count <= 0) return { generated: 0, totalNow: 0 };

    const currentList = await this.getRawSiswaList();
    const kelasList = await this.getKelasList();
    if (kelasList.length === 0) {
      throw new Error('Belum ada data kelas. Tambahkan kelas terlebih dahulu.');
    }

    // Set untuk mencegah tabrakan NISN/NIP
    const existingNisns = new Set(currentList.map(s => s.nisn));

    // Target kelas
    let availableClasses = kelasList;
    if (kategori === 'guru') {
      const guruKelas = kelasList.find(k => k.id === 'k-guru' || k.nama_kelas.includes('GURU'));
      availableClasses = guruKelas ? [guruKelas] : [kelasList[0]];
    } else {
      const targetClasses = targetKelasId && targetKelasId !== 'all'
        ? kelasList.filter(k => k.id === targetKelasId)
        : kelasList.filter(k => k.id !== 'k-guru');
      availableClasses = targetClasses.length > 0 ? targetClasses : kelasList;
    }

    const generatedList: Siswa[] = [];

    // Prefix tahun NISN berdasarkan tingkat (7: 008, 8: 007, 9: 006)
    const prefixes = ['008', '007', '006', '009', '010'];
    const guruPrefixes = ['197', '198', '199', '196'];

    let attempts = 0;
    while (generatedList.length < count && attempts < count * 5) {
      attempts++;
      const assignedKelas = availableClasses[generatedList.length % availableClasses.length];
      
      let candidateNisn = '';
      let birthYear = 2011;

      if (kategori === 'guru') {
        const prefix = guruPrefixes[Math.floor(Math.random() * guruPrefixes.length)];
        const randomSuffix = String(Math.floor(100000000000000 + Math.random() * 900000000000000));
        candidateNisn = prefix + randomSuffix;
        birthYear = parseInt(prefix) + 10; // Simple approximation
      } else {
        // Tentukan prefix tahun lahir
        let prefix = '008';
        if (assignedKelas.tingkat === 8) {
          prefix = '007';
          birthYear = 2010;
        } else if (assignedKelas.tingkat === 9) {
          prefix = '006';
          birthYear = 2009;
        } else {
          prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          birthYear = 2011;
        }
        const randomSuffix = String(Math.floor(1000000 + Math.random() * 9000000));
        candidateNisn = prefix + randomSuffix;
      }

      if (existingNisns.has(candidateNisn)) {
        continue;
      }
      existingNisns.add(candidateNisn);

      // Buat nama Indonesia acak
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      let fullName = `${firstName} ${lastName}`;
      if (Math.random() > 0.7) {
        const middleName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        fullName = `${firstName} ${middleName} ${lastName}`;
      }

      if (kategori === 'guru') {
        const titles = ['S.Pd', 'M.Pd', 'S.Kom', 'M.Si', 'Dra.', 'Drs.'];
        const title = titles[Math.floor(Math.random() * titles.length)];
        if (title.endsWith('.')) {
          fullName = `${title} ${fullName}`;
        } else {
          fullName = `${fullName}, ${title}`;
        }
      }

      // Buat tanggal lahir
      const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
      const day = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
      const birthDate = `${birthYear}-${month}-${day}`;

      const newSiswa: Siswa = {
        id: (kategori === 'guru' ? 'g-bulk-' : 's-bulk-') + Date.now().toString(36) + '-' + generatedList.length + '-' + Math.random().toString(36).substring(2, 5),
        nisn: candidateNisn,
        nama: fullName,
        tanggal_lahir: birthDate,
        kelas_id: assignedKelas.id,
        sudah_memilih: false,
        waktu_memilih: null,
        kategori: kategori,
        created_at: new Date().toISOString()
      };

      generatedList.push(newSiswa);
    }

    const updatedList = [...currentList, ...generatedList];
    await this.persistSiswaList(updatedList);

    return {
      generated: generatedList.length,
      totalNow: updatedList.length
    };
  }


  // ====================== KANDIDAT CRUD ======================
  public async getKandidatList(): Promise<Kandidat[]> {
    if (this.isUsingSupabase()) {
      try {
        const { data, error } = await this.supabase!.from('kandidat').select('*').order('nomor_urut', { ascending: true });
        if (data && !error && data.length > 0) return data as Kandidat[];
      } catch (e) {
        console.warn('Supabase getKandidatList fallback', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.KANDIDAT);
    const list: Kandidat[] = raw ? JSON.parse(raw) : INITIAL_CANDIDATES;
    return list.sort((a, b) => a.nomor_urut - b.nomor_urut);
  }

  public async saveKandidat(kandidat: Omit<Kandidat, 'id' | 'total_suara'> & { id?: string; total_suara?: number }): Promise<Kandidat> {
    const list = await this.getKandidatList();
    let saved: Kandidat;

    // Cek duplikasi nomor urut
    const duplicateNo = list.find(k => k.nomor_urut === Number(kandidat.nomor_urut) && k.id !== kandidat.id);
    if (duplicateNo) {
      throw new Error(`Nomor urut ${kandidat.nomor_urut} sudah dipakai oleh Paslon ${duplicateNo.nama_ketua} & ${duplicateNo.nama_wakil}`);
    }

    if (kandidat.id) {
      const index = list.findIndex(k => k.id === kandidat.id);
      saved = {
        ...list[index],
        ...kandidat,
        nomor_urut: Number(kandidat.nomor_urut),
        total_suara: list[index]?.total_suara ?? 0
      };
      if (index >= 0) list[index] = saved;
    } else {
      saved = {
        id: 'cand-' + Date.now().toString(36),
        nomor_urut: Number(kandidat.nomor_urut),
        nama_ketua: kandidat.nama_ketua.trim(),
        nama_wakil: kandidat.nama_wakil.trim(),
        slogan: kandidat.slogan?.trim() || '',
        visi: kandidat.visi.trim(),
        misi: kandidat.misi.trim(),
        foto_url: kandidat.foto_url || '/src/assets/images/kandidat_paslon_1_1793253208173.jpg',
        total_suara: 0,
        created_at: new Date().toISOString()
      };
      list.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.KANDIDAT, JSON.stringify(list));

    if (this.isUsingSupabase()) {
      try {
        if (kandidat.id) {
          await this.supabase!.from('kandidat').update(saved).eq('id', kandidat.id);
        } else {
          await this.supabase!.from('kandidat').insert(saved);
        }
      } catch (e) {
        console.warn('Supabase saveKandidat error', e);
      }
    }

    return saved;
  }

  public async deleteKandidat(id: string): Promise<boolean> {
    let list = await this.getKandidatList();
    list = list.filter(k => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KANDIDAT, JSON.stringify(list));

    if (this.isUsingSupabase()) {
      try {
        await this.supabase!.from('kandidat').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteKandidat error', e);
      }
    }
    return true;
  }

  // ====================== VOTING RPC (SATU SUARA ATOMIK & ANTI DOUBLE-VOTE) ======================
  /**
   * Menjalankan proses pemberian suara secara atomik.
   * Memvalidasi status voting, mengecek apakah siswa sudah pernah memilih,
   * menandai siswa sudah_memilih = true, dan menambah perolehan suara kandidat.
   * Kriteria Secret Ballot: TIDAK PERNAH menyimpan relasi antara siswa dengan kandidat yang dipilih!
   */
  public async castVote(nisn: string, dob: string, kandidatId: string): Promise<VoteResult> {
    const settings = await this.getPengaturan();
    if (!settings.voting_dibuka) {
      return { success: false, message: 'Pemilihan suara saat ini sedang ditutup oleh panitia.' };
    }

    // 1. Jika terhubung ke Supabase, panggil RPC stored procedure di server
    if (this.isUsingSupabase()) {
      try {
        const { data, error } = await this.supabase!.rpc('berikan_suara_rpc', {
          p_nisn: nisn.trim(),
          p_tanggal_lahir: dob.trim(),
          p_kandidat_id: kandidatId
        });

        if (error) {
          return { success: false, message: error.message || 'Gagal menyimpan suara di server.' };
        }

        if (data) {
          return {
            success: data.success,
            message: data.message,
            nama_siswa: data.nama_siswa
          };
        }
      } catch (e: any) {
        console.warn('Supabase RPC call failed, falling back to atomic local engine', e);
      }
    }

    // 2. Local Atomic Transaction Engine
    // Lock and verify
    const students = await this.getRawSiswaList();
    const student = students.find(s => s.nisn === nisn.trim() && s.tanggal_lahir === dob.trim());

    if (!student) {
      return { success: false, message: 'Data siswa dengan NISN dan tanggal lahir tersebut tidak ditemukan.' };
    }

    if (student.sudah_memilih) {
      return { success: false, message: 'Anda sudah menggunakan hak suara Anda sebelumnya. Setiap siswa hanya dapat memilih 1 kali.' };
    }

    const candidatesRaw = localStorage.getItem(STORAGE_KEYS.KANDIDAT);
    const candidates: Kandidat[] = candidatesRaw ? JSON.parse(candidatesRaw) : [];
    const targetCandidate = candidates.find(k => k.id === kandidatId);

    if (!targetCandidate) {
      return { success: false, message: 'Calon kandidat yang dipilih tidak ditemukan.' };
    }

    // Tandai siswa sudah memilih
    student.sudah_memilih = true;
    student.waktu_memilih = new Date().toISOString();
    await this.persistSiswaList(students);

    // Tambah suara kandidat
    targetCandidate.total_suara = (targetCandidate.total_suara || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.KANDIDAT, JSON.stringify(candidates));

    // Catat suara anonim di ledger suara (hanya kandidat_id dan timestamp, TANPA nama atau NISN siswa)
    const ledgerRaw = localStorage.getItem(STORAGE_KEYS.SUARA_LEDGER);
    const ledger = ledgerRaw ? JSON.parse(ledgerRaw) : [];
    ledger.push({
      kandidat_id: kandidatId,
      waktu: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.SUARA_LEDGER, JSON.stringify(ledger));

    return {
      success: true,
      message: 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi',
      nama_siswa: student.nama
    };
  }

  // ====================== STATISTIK BERANDA & REKAPITULASI ======================
  public async getStatistics(): Promise<Statistics> {
    const students = await this.getSiswaList();
    const classes = await this.getKelasList();
    const candidates = await this.getKandidatList();

    const totalSiswa = students.length;
    const sudahMemilih = students.filter(s => s.sudah_memilih).length;
    const belumMemilih = totalSiswa - sudahMemilih;
    const persentasePartisipasi = totalSiswa > 0 ? Number(((sudahMemilih / totalSiswa) * 100).toFixed(1)) : 0;
    const totalSuaraMasuk = candidates.reduce((acc, curr) => acc + (curr.total_suara || 0), 0);

    const totalSiswaOnly = students.filter(s => s.kategori === 'siswa' || !s.kategori).length;
    const totalGuru = students.filter(s => s.kategori === 'guru').length;
    const siswaSudahMemilih = students.filter(s => (s.kategori === 'siswa' || !s.kategori) && s.sudah_memilih).length;
    const guruSudahMemilih = students.filter(s => s.kategori === 'guru' && s.sudah_memilih).length;

    return {
      totalSiswa,
      totalKelas: classes.length,
      totalKandidat: candidates.length,
      sudahMemilih,
      belumMemilih,
      persentasePartisipasi,
      totalSuaraMasuk,
      totalSiswaOnly,
      totalGuru,
      siswaSudahMemilih,
      guruSudahMemilih
    };
  }

  /**
   * Menghapus seluruh rekaman suara / voting dari Supabase secara menyeluruh.
   * Mendukung penuh tabel 'votes' dan tabel 'suara' serta stored procedure RPC jika ada.
   */
  public async clearSupabaseVoteRecords(): Promise<{ suaraDeleted: boolean; votesDeleted: boolean; rpcCalled: boolean }> {
    if (!this.isUsingSupabase()) {
      return { suaraDeleted: false, votesDeleted: false, rpcCalled: false };
    }

    let rpcCalled = false;
    let suaraDeleted = false;
    let votesDeleted = false;

    // 1. Coba panggil RPC reset_pemilih_rpc jika sudah tersedia di Supabase
    try {
      const { error: rpcErr } = await this.supabase!.rpc('reset_pemilih_rpc');
      if (!rpcErr) {
        rpcCalled = true;
      }
    } catch {
      // RPC mungkin belum di-run, lanjutkan operasi tabel langsung
    }

    // 2. Hapus data dari tabel 'votes' (Sesuai kebutuhan pengguna)
    try {
      // Filter aman tanpa type mismatch: id IS NOT NULL
      const res = await this.supabase!.from('votes').delete().not('id', 'is', null);
      if (!res.error) {
        votesDeleted = true;
      } else {
        // Fallback filter berbasis waktu created_at
        const res2 = await this.supabase!.from('votes').delete().gte('created_at', '1970-01-01');
        if (!res2.error) votesDeleted = true;
      }
    } catch (e) {
      console.warn('Supabase delete from votes warning:', e);
    }

    // 3. Hapus data dari tabel 'suara'
    try {
      const res = await this.supabase!.from('suara').delete().not('id', 'is', null);
      if (!res.error) {
        suaraDeleted = true;
      } else {
        const res2 = await this.supabase!.from('suara').delete().gte('waktu_suara', '1970-01-01');
        if (!res2.error) suaraDeleted = true;
      }
    } catch (e) {
      console.warn('Supabase delete from suara warning:', e);
    }

    return { suaraDeleted, votesDeleted, rpcCalled };
  }

  public async resetAllVotes(): Promise<boolean> {
    // 1. Reset local state
    const students = await this.getRawSiswaList();
    students.forEach(s => {
      s.sudah_memilih = false;
      s.waktu_memilih = null;
    });
    await this.persistSiswaList(students);

    const candidates = await this.getKandidatList();
    candidates.forEach(k => {
      k.total_suara = 0;
    });
    localStorage.setItem(STORAGE_KEYS.KANDIDAT, JSON.stringify(candidates));
    localStorage.setItem(STORAGE_KEYS.SUARA_LEDGER, JSON.stringify([]));

    // 2. Reset Supabase
    if (this.isUsingSupabase()) {
      // Hapus data pada tabel suara dan votes
      await this.clearSupabaseVoteRecords();

      // Reset status siswa di Supabase menggunakan filter nisn IS NOT NULL (aman dari cast UUID)
      try {
        const { error: sErr } = await this.supabase!
          .from('siswa')
          .update({ sudah_memilih: false, waktu_memilih: null })
          .not('nisn', 'is', null);

        if (sErr) {
          await this.supabase!
            .from('siswa')
            .update({ sudah_memilih: false, waktu_memilih: null })
            .neq('nisn', '____none____');
        }
      } catch (e) {
        console.warn('Supabase reset status siswa error:', e);
      }

      // Reset total perolehan suara kandidat di Supabase
      try {
        await this.supabase!
          .from('kandidat')
          .update({ total_suara: 0 })
          .gte('nomor_urut', 0);
      } catch (e) {
        console.warn('Supabase reset kandidat suara error:', e);
      }
    }
    return true;
  }

  /**
   * Reset Pemilih: Mengembalikan status hak suara siswa menjadi belum memilih.
   * Jika kelasId diberikan, hanya siswa di kelas tersebut yang di-reset.
   * Jika tidak ada kelasId (reset semua), maka total suara kandidat dan ledger suara juga di-reset.
   */
  public async resetPemilihStatus(kelasId?: string): Promise<{ success: boolean; count: number; error?: string }> {
    const students = await this.getRawSiswaList();
    let count = 0;

    students.forEach(s => {
      if (!kelasId || s.kelas_id === kelasId) {
        if (s.sudah_memilih) {
          s.sudah_memilih = false;
          s.waktu_memilih = null;
          count++;
        }
      }
    });

    await this.persistSiswaList(students);

    // Jika reset seluruh siswa, kosongkan perolehan suara kandidat
    if (!kelasId) {
      const candidates = await this.getKandidatList();
      candidates.forEach(k => {
        k.total_suara = 0;
      });
      localStorage.setItem(STORAGE_KEYS.KANDIDAT, JSON.stringify(candidates));
      localStorage.setItem(STORAGE_KEYS.SUARA_LEDGER, JSON.stringify([]));
    }

    if (this.isUsingSupabase()) {
      try {
        if (kelasId) {
          // Hanya kelas tertentu
          await this.supabase!
            .from('siswa')
            .update({ sudah_memilih: false, waktu_memilih: null })
            .eq('kelas_id', kelasId);
        } else {
          // Reset seluruh pemilih dan hapus record dari suara & votes
          await this.resetAllVotes();
        }
      } catch (e: any) {
        console.warn('Supabase resetPemilihStatus error', e);
        return { success: false, count, error: e.message || 'Gagal reset di database Supabase' };
      }
    }

    return { success: true, count };
  }

  /**
   * Reset Data Siswa ke Bawaan (Default Seed Data SMPN 2)
   */
  public async resetSiswaToDefault(): Promise<{ success: boolean; count: number; error?: string }> {
    await this.persistSiswaList([...INITIAL_STUDENTS]);
    await this.resetAllVotes();

    if (this.isUsingSupabase()) {
      try {
        // Hapus data lama di Supabase menggunakan filter aman
        await this.supabase!.from('siswa').delete().not('nisn', 'is', null);
      } catch (e) {
        try {
          await this.supabase!.from('siswa').delete().neq('nisn', '____none____');
        } catch {}
      }

      await this.clearSupabaseVoteRecords();

      try {
        // Dapatkan pemetaan ID kelas dari remote database
        const { data: remoteKelas } = await this.supabase!.from('kelas').select('id, nama_kelas');
        const kelasMap = new Map((remoteKelas || []).map((k: any) => [k.nama_kelas, k.id]));

        const rows = INITIAL_STUDENTS.map(s => {
          const defaultK = INITIAL_CLASSES.find(k => k.id === s.kelas_id);
          const matchedRemoteKelasId = defaultK ? kelasMap.get(defaultK.nama_kelas) : null;
          return {
            nisn: s.nisn,
            nama: s.nama,
            tanggal_lahir: s.tanggal_lahir,
            kelas_id: matchedRemoteKelasId || null,
            sudah_memilih: false,
            waktu_memilih: null
          };
        });

        await this.supabase!.from('siswa').insert(rows);
      } catch (e: any) {
        console.warn('Supabase resetSiswaToDefault error', e);
        return { success: true, count: INITIAL_STUDENTS.length, error: 'Data lokal dipulihkan, sinkronisasi Supabase: ' + (e.message || '') };
      }
    }

    return { success: true, count: INITIAL_STUDENTS.length };
  }

  /**
   * Kosongkan Seluruh Data Siswa (DPT) untuk persiapan input/import data baru
   */
  public async clearAllSiswa(): Promise<{ success: boolean; count: number; error?: string }> {
    const students = await this.getRawSiswaList();
    const count = students.length;

    // Simpan list kosong secara permanen di storage lokal
    await this.persistSiswaList([]);
    await this.resetAllVotes();

    if (this.isUsingSupabase()) {
      try {
        await this.supabase!.rpc('clear_siswa_rpc');
      } catch {}

      try {
        // Hapus seluruh baris siswa di Supabase
        const { error: delErr } = await this.supabase!.from('siswa').delete().not('nisn', 'is', null);
        if (delErr) {
          await this.supabase!.from('siswa').delete().neq('nisn', '____none____');
        }
      } catch (e: any) {
        console.warn('Supabase clearAllSiswa error', e);
        return { success: false, count, error: e.message || 'Gagal menghapus siswa di Supabase' };
      }

      // Pastikan tabel votes dan suara juga bersih
      await this.clearSupabaseVoteRecords();

      try {
        await this.supabase!.from('kandidat').update({ total_suara: 0 }).gte('nomor_urut', 0);
      } catch {}
    }

    return { success: true, count };
  }

  /**
   * Diagnostik status tabel Supabase secara langsung untuk memverifikasi data
   */
  public async getSupabaseDiagnostics(): Promise<{
    connected: boolean;
    siswaCount: number | null;
    kandidatCount: number | null;
    suaraCount: number | null;
    votesCount: number | null;
    votesTableExists: boolean;
    error?: string;
  }> {
    if (!this.isUsingSupabase()) {
      return {
        connected: false,
        siswaCount: null,
        kandidatCount: null,
        suaraCount: null,
        votesCount: null,
        votesTableExists: false
      };
    }

    try {
      let siswaCount: number | null = null;
      let kandidatCount: number | null = null;
      let suaraCount: number | null = null;
      let votesCount: number | null = null;
      let votesTableExists = false;

      const { count: sCount, error: sErr } = await this.supabase!
        .from('siswa')
        .select('*', { count: 'exact', head: true });
      if (!sErr && sCount !== null) siswaCount = sCount;

      const { count: kCount, error: kErr } = await this.supabase!
        .from('kandidat')
        .select('*', { count: 'exact', head: true });
      if (!kErr && kCount !== null) kandidatCount = kCount;

      const { count: suCount, error: suErr } = await this.supabase!
        .from('suara')
        .select('*', { count: 'exact', head: true });
      if (!suErr && suCount !== null) suaraCount = suCount;

      const { count: vCount, error: vErr } = await this.supabase!
        .from('votes')
        .select('*', { count: 'exact', head: true });
      if (!vErr) {
        votesTableExists = true;
        if (vCount !== null) votesCount = vCount;
      }

      return {
        connected: true,
        siswaCount,
        kandidatCount,
        suaraCount,
        votesCount: votesTableExists ? votesCount : null,
        votesTableExists
      };
    } catch (e: any) {
      return {
        connected: false,
        siswaCount: null,
        kandidatCount: null,
        suaraCount: null,
        votesCount: null,
        votesTableExists: false,
        error: e.message
      };
    }
  }
}

export const dbService = new DatabaseService();
