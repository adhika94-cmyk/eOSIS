-- Schema Database eOSIS SMP Negeri 2 Kota Bogor
-- Dialek: PostgreSQL (Compatible with Supabase)

-- 1. Tabel Pengaturan Aplikasi
CREATE TABLE IF NOT EXISTS pengaturan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_sekolah TEXT NOT NULL DEFAULT 'SMP NEGERI 2 KOTA BOGOR',
    logo_sekolah TEXT,
    periode_pemilihan TEXT DEFAULT '2025/2026',
    waktu_mulai TIMESTAMPTZ,
    waktu_selesai TIMESTAMPTZ,
    voting_dibuka BOOLEAN DEFAULT false,
    quick_count_publik BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Admin
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    nama_lengkap TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Kelas / Rombel
CREATE TABLE IF NOT EXISTS kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas TEXT UNIQUE NOT NULL,
    tingkat INTEGER NOT NULL, -- 7, 8, 9 atau 0 untuk Guru/Staf
    wali_kelas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Kandidat Paslon
CREATE TABLE IF NOT EXISTS kandidat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_urut INTEGER UNIQUE NOT NULL,
    nama_ketua TEXT NOT NULL,
    nama_wakil TEXT NOT NULL,
    slogan TEXT,
    visi TEXT,
    misi TEXT,
    foto_url TEXT,
    total_suara INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Siswa / Pemilih Tetap (DPT)
CREATE TABLE IF NOT EXISTS siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nisn TEXT UNIQUE NOT NULL, -- NISN untuk siswa atau NIP/ID untuk Guru
    nama TEXT NOT NULL,
    tanggal_lahir DATE NOT NULL,
    kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
    sudah_memilih BOOLEAN DEFAULT false,
    waktu_memilih TIMESTAMPTZ,
    kategori TEXT DEFAULT 'siswa', -- 'siswa' atau 'guru'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Ledger Suara (Anonim)
-- Penting: Tabel ini tidak memiliki relasi ke tabel siswa untuk menjaga kerahasiaan pilihan (LUBER)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kandidat_id UUID REFERENCES kandidat(id) ON DELETE CASCADE,
    waktu_suara TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Settings
INSERT INTO pengaturan (nama_sekolah, periode_pemilihan, voting_dibuka)
VALUES ('SMP NEGERI 2 KOTA BOGOR', '2025/2026', true)
ON CONFLICT DO NOTHING;

-- Seed Default Admin (admin / admin123)
INSERT INTO admin (username, nama_lengkap, password_hash)
VALUES ('admin', 'Pembina OSIS SMPN 2', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;
