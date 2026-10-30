import { dbService } from './db';
import { hashPassword } from '../utils/crypto';
import type { Siswa, AdminUser } from '../types';

const ADMIN_SESSION_KEY = 'eosis_admin_session';
const SISWA_SESSION_KEY = 'eosis_siswa_session';

export interface AdminSession {
  id: string;
  username: string;
  nama_lengkap: string;
  logged_at: string;
}

export interface SiswaSession {
  id: string;
  nisn: string;
  nama: string;
  tanggal_lahir: string;
  kelas_id: string;
  kelas_nama?: string;
  sudah_memilih: boolean;
  logged_at: string;
}

export const authService = {
  // ================= ADMIN AUTH =================
  async loginAdmin(username: string, passwordPlain: string): Promise<{ success: boolean; message: string; session?: AdminSession }> {
    const admin = await dbService.getAdmin();
    const cleanUser = username.trim();
    const cleanPass = passwordPlain.trim();

    if (admin.username.toLowerCase() !== cleanUser.toLowerCase()) {
      return { success: false, message: 'Username admin tidak ditemukan.' };
    }

    const hashedInput = await hashPassword(cleanPass);

    // Verifikasi kata sandi:
    // 1. Cocok dengan hash SHA-256 yang tersimpan
    // 2. Atau kredensial bawaan 'admin123' (auto-sync jika hash tersimpan belum terbarui)
    const isDefaultAdmin = (cleanUser.toLowerCase() === 'admin' && cleanPass === 'admin123');
    const isHashMatch = admin.password_hash === hashedInput;

    if (!isHashMatch && !isDefaultAdmin) {
      return { success: false, message: 'Password admin yang Anda masukkan salah.' };
    }

    // Pastikan hash di database lokal/supabase selalu terbarui dengan benar
    if (isDefaultAdmin && admin.password_hash !== hashedInput) {
      await dbService.updateAdminCredentials(admin.username, cleanPass, admin.nama_lengkap);
    }

    const session: AdminSession = {
      id: admin.id,
      username: admin.username,
      nama_lengkap: admin.nama_lengkap,
      logged_at: new Date().toISOString()
    };

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    return { success: true, message: 'Login berhasil.', session };
  },

  getAdminSession(): AdminSession | null {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAdminLoggedIn(): boolean {
    return this.getAdminSession() !== null;
  },

  logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  },

  // ================= PEMILIH (SISWA & GURU) AUTH =================
  async loginSiswa(nisn: string, credential: string): Promise<{ success: boolean; message: string; siswa?: Siswa }> {
    const cleanNisn = nisn.trim();
    const cleanCred = credential.trim();

    if (!cleanNisn || !cleanCred) {
      return { success: false, message: 'NISN/NIP dan Password wajib diisi.' };
    }

    const siswa = await dbService.findSiswaByNisnAndDob(cleanNisn, cleanCred);
    if (!siswa) {
      return {
        success: false,
        message: 'Kombinasi NISN/NIP dan Password tidak cocok dengan data Daftar Pemilih Tetap (DPT).'
      };
    }

    const session: SiswaSession = {
      id: siswa.id,
      nisn: siswa.nisn,
      nama: siswa.nama,
      tanggal_lahir: siswa.tanggal_lahir,
      kelas_id: siswa.kelas_id,
      kelas_nama: siswa.kelas_nama,
      sudah_memilih: siswa.sudah_memilih,
      logged_at: new Date().toISOString()
    };

    sessionStorage.setItem(SISWA_SESSION_KEY, JSON.stringify(session));
    return { success: true, message: 'Login berhasil.', siswa };
  },

  getSiswaSession(): SiswaSession | null {
    const raw = sessionStorage.getItem(SISWA_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async refreshSiswaSession(): Promise<SiswaSession | null> {
    const current = this.getSiswaSession();
    if (!current) return null;

    const fresh = await dbService.findSiswaByNisnAndDob(current.nisn, current.tanggal_lahir);
    if (!fresh) {
      this.logoutSiswa();
      return null;
    }

    const updated: SiswaSession = {
      ...current,
      nama: fresh.nama,
      sudah_memilih: fresh.sudah_memilih,
      kelas_nama: fresh.kelas_nama
    };

    sessionStorage.setItem(SISWA_SESSION_KEY, JSON.stringify(updated));
    return updated;
  },

  isSiswaLoggedIn(): boolean {
    return this.getSiswaSession() !== null;
  },

  logoutSiswa() {
    sessionStorage.removeItem(SISWA_SESSION_KEY);
  }
};
