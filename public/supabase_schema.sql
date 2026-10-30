-- =====================================================================
-- SCHEMA & DATABASE eOSIS SMP NEGERI 2 KOTA BOGOR
-- Sistem Pemilihan OSIS Demokratis, Rahasia, dan Anti-Kecurangan
-- Script ini aman dijalankan berulang kali (Idempotent Migration)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL PENGATURAN APLIKASI
-- Jika tabel pengaturan pernah terbuat dengan id bertipe UUID via Supabase GUI, hapus dan buat ulang
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pengaturan' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        DROP TABLE pengaturan CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS pengaturan (
    id INT PRIMARY KEY DEFAULT 1,
    nama_sekolah VARCHAR(255) NOT NULL DEFAULT 'SMP NEGERI 2 KOTA BOGOR',
    logo_sekolah TEXT DEFAULT '/src/assets/images/osis_spenda_logo_1793253206503.jpg',
    periode_pemilihan VARCHAR(100) NOT NULL DEFAULT '2025/2026',
    waktu_mulai TIMESTAMPTZ DEFAULT NOW(),
    waktu_selesai TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    voting_dibuka BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT satu_pengaturan CHECK (id = 1)
);

-- Pastikan kolom selalu ada jika tabel 'pengaturan' sudah dibuat sebelumnya
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS nama_sekolah VARCHAR(255) NOT NULL DEFAULT 'SMP NEGERI 2 KOTA BOGOR';
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS logo_sekolah TEXT DEFAULT '/src/assets/images/osis_spenda_logo_1793253206503.jpg';
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS periode_pemilihan VARCHAR(100) NOT NULL DEFAULT '2025/2026';
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS waktu_mulai TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS waktu_selesai TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS voting_dibuka BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Inisialisasi baris pengaturan default
INSERT INTO pengaturan (id, nama_sekolah, logo_sekolah, periode_pemilihan, voting_dibuka)
VALUES (1, 'SMP NEGERI 2 KOTA BOGOR', '/src/assets/images/osis_spenda_logo_1793253206503.jpg', '2025/2026', true)
ON CONFLICT (id) DO UPDATE SET
    logo_sekolah = COALESCE(pengaturan.logo_sekolah, EXCLUDED.logo_sekolah),
    nama_sekolah = COALESCE(pengaturan.nama_sekolah, EXCLUDED.nama_sekolah);

-- 3. TABEL ADMIN
CREATE TABLE IF NOT EXISTS admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- SHA-256
    nama_lengkap VARCHAR(255) NOT NULL DEFAULT 'Administrator eOSIS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE admin ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE admin ADD COLUMN IF NOT EXISTS nama_lengkap VARCHAR(255) DEFAULT 'Administrator eOSIS';

-- Default admin: admin / admin123 (hash SHA-256 yang valid)
INSERT INTO admin (username, password_hash, nama_lengkap)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Pembina OSIS SMPN 2')
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash;

-- 4. TABEL KELAS
CREATE TABLE IF NOT EXISTS kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas VARCHAR(50) UNIQUE NOT NULL,
    tingkat INT NOT NULL CHECK (tingkat IN (7, 8, 9)),
    wali_kelas VARCHAR(255) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kelas ADD COLUMN IF NOT EXISTS nama_kelas VARCHAR(50);
ALTER TABLE kelas ADD COLUMN IF NOT EXISTS tingkat INT;
ALTER TABLE kelas ADD COLUMN IF NOT EXISTS wali_kelas VARCHAR(255) DEFAULT '';

-- 5. TABEL SISWA (PEMILIH DPT)
CREATE TABLE IF NOT EXISTS siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nisn VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
    sudah_memilih BOOLEAN NOT NULL DEFAULT false,
    waktu_memilih TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE siswa ADD COLUMN IF NOT EXISTS nisn VARCHAR(20);
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS nama VARCHAR(255);
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS kelas_id UUID;
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS sudah_memilih BOOLEAN DEFAULT false;
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS waktu_memilih TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_siswa_sudah_memilih ON siswa(sudah_memilih);

-- 6. TABEL CALON KANDIDAT OSIS
CREATE TABLE IF NOT EXISTS kandidat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_urut INT UNIQUE NOT NULL,
    nama_ketua VARCHAR(255) NOT NULL,
    nama_wakil VARCHAR(255) NOT NULL,
    slogan TEXT DEFAULT '',
    visi TEXT NOT NULL,
    misi TEXT NOT NULL,
    foto_url TEXT NOT NULL,
    total_suara INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS nomor_urut INT;
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS nama_ketua VARCHAR(255);
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS nama_wakil VARCHAR(255);
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS slogan TEXT DEFAULT '';
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS visi TEXT;
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS misi TEXT;
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE kandidat ADD COLUMN IF NOT EXISTS total_suara INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_kandidat_nomor ON kandidat(nomor_urut);

-- 7. TABEL SUARA (ANONIM - SECRET BALLOT)
CREATE TABLE IF NOT EXISTS suara (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kandidat_id UUID NOT NULL REFERENCES kandidat(id) ON DELETE CASCADE,
    waktu_suara TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FUNGSI STORED PROCEDURE / RPC UNTUK ATOMIC VOTING (ANTI REFRESH / ANTI DOUBLE VOTE)
CREATE OR REPLACE FUNCTION berikan_suara_rpc(
    p_nisn VARCHAR,
    p_tanggal_lahir DATE,
    p_kandidat_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_siswa RECORD;
    v_voting_buka BOOLEAN;
    v_kandidat_exists BOOLEAN;
BEGIN
    -- 1. Cek apakah voting sedang dibuka
    SELECT voting_dibuka INTO v_voting_buka FROM pengaturan LIMIT 1;
    IF v_voting_buka IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pemilihan saat ini sedang ditutup oleh panitia.');
    END IF;

    -- 2. Cek eksistensi kandidat
    SELECT EXISTS(SELECT 1 FROM kandidat WHERE id = p_kandidat_id) INTO v_kandidat_exists;
    IF NOT v_kandidat_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kandidat yang dipilih tidak valid.');
    END IF;

    -- 3. Cari data siswa dan KUNCI baris untuk mencegah race condition (multi tab / concurrent request)
    SELECT * INTO v_siswa
    FROM siswa
    WHERE nisn = p_nisn AND tanggal_lahir = p_tanggal_lahir
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Data siswa dengan NISN dan Tanggal Lahir tersebut tidak ditemukan.');
    END IF;

    -- 4. Validasi satu suara: Jika sudah memilih, tolak seketika
    IF v_siswa.sudah_memilih = TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Hak suara Anda sudah pernah digunakan. Anda tidak dapat memilih kembali.');
    END IF;

    -- 5. Catat suara anonim ke tabel suara (Asas LUBER JURDIL)
    INSERT INTO suara (kandidat_id, waktu_suara)
    VALUES (p_kandidat_id, NOW());

    -- 6. Tambah perolehan suara kandidat
    UPDATE kandidat
    SET total_suara = total_suara + 1
    WHERE id = p_kandidat_id;

    -- 7. Tandai status siswa sudah memilih
    UPDATE siswa
    SET sudah_memilih = TRUE,
        waktu_memilih = NOW()
    WHERE id = v_siswa.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi.',
        'nama_siswa', v_siswa.nama
    );
END;
$$;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent)
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kandidat ENABLE ROW LEVEL SECURITY;
ALTER TABLE suara ENABLE ROW LEVEL SECURITY;

-- Pengaturan
DROP POLICY IF EXISTS "Publik dapat membaca pengaturan" ON pengaturan;
CREATE POLICY "Publik dapat membaca pengaturan" ON pengaturan FOR SELECT USING (true);

DROP POLICY IF EXISTS "Publik dapat memperbarui pengaturan" ON pengaturan;
CREATE POLICY "Publik dapat memperbarui pengaturan" ON pengaturan FOR UPDATE USING (true);

-- Kandidat
DROP POLICY IF EXISTS "Publik dapat membaca kandidat" ON kandidat;
CREATE POLICY "Publik dapat membaca kandidat" ON kandidat FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin dapat mengelola kandidat" ON kandidat;
CREATE POLICY "Admin dapat mengelola kandidat" ON kandidat FOR ALL USING (true);

-- Kelas
DROP POLICY IF EXISTS "Publik dapat membaca kelas" ON kelas;
CREATE POLICY "Publik dapat membaca kelas" ON kelas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin dapat mengelola kelas" ON kelas;
CREATE POLICY "Admin dapat mengelola kelas" ON kelas FOR ALL USING (true);

-- Siswa
DROP POLICY IF EXISTS "Publik dapat membaca siswa" ON siswa;
CREATE POLICY "Publik dapat membaca siswa" ON siswa FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin dapat mengelola siswa" ON siswa;
CREATE POLICY "Admin dapat mengelola siswa" ON siswa FOR ALL USING (true);

-- Suara
DROP POLICY IF EXISTS "Admin dapat melihat total suara" ON suara;
CREATE POLICY "Admin dapat melihat total suara" ON suara FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sistem dapat mencatat suara" ON suara;
CREATE POLICY "Sistem dapat mencatat suara" ON suara FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin dapat menghapus suara" ON suara;
CREATE POLICY "Admin dapat menghapus suara" ON suara FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admin dapat mengelola suara" ON suara;
CREATE POLICY "Admin dapat mengelola suara" ON suara FOR ALL USING (true);

-- 9b. TABEL VOTES & POLICIES (Mendukung integrasi penamaan alternatif votes di Supabase)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kandidat_id UUID REFERENCES kandidat(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik dapat membaca votes" ON votes;
CREATE POLICY "Publik dapat membaca votes" ON votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Publik dapat mencatat votes" ON votes;
CREATE POLICY "Publik dapat mencatat votes" ON votes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin dapat menghapus votes" ON votes;
CREATE POLICY "Admin dapat menghapus votes" ON votes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admin dapat mengelola votes" ON votes;
CREATE POLICY "Admin dapat mengelola votes" ON votes FOR ALL USING (true);

-- 9c. STORED PROCEDURE RPC: RESET PEMILIH & HAPUS SUARA/VOTES SECARA ATOMIK
CREATE OR REPLACE FUNCTION reset_pemilih_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Reset status pemilih pada tabel siswa
    UPDATE siswa SET sudah_memilih = false, waktu_memilih = NULL;

    -- 2. Reset perolehan suara seluruh kandidat
    UPDATE kandidat SET total_suara = 0;

    -- 3. Hapus seluruh rekaman pada tabel suara (jika ada)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suara') THEN
        DELETE FROM suara;
    END IF;

    -- 4. Hapus seluruh rekaman pada tabel votes (jika ada)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN
        DELETE FROM votes;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Status pemilih dan seluruh data suara/votes di Supabase berhasil direset bersih.'
    );
END;
$$;

-- 9d. STORED PROCEDURE RPC: KOSONGKAN SELURUH SISWA (DPT) & SUARA
CREATE OR REPLACE FUNCTION clear_siswa_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Bersihkan suara dan votes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suara') THEN
        DELETE FROM suara;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN
        DELETE FROM votes;
    END IF;

    -- 2. Reset kandidat
    UPDATE kandidat SET total_suara = 0;

    -- 3. Hapus seluruh siswa
    DELETE FROM siswa;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Seluruh data siswa DPT dan suara di Supabase berhasil dikosongkan.'
    );
END;
$$;

-- 10. STORAGE BUCKET UNTUK FOTO & LOGO
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('osis-assets', 'osis-assets', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- Lewati jika storage schema belum aktif di project Supabase
    NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access Storage" ON storage.objects;
    CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id = 'osis-assets');

    DROP POLICY IF EXISTS "Public Upload Storage" ON storage.objects;
    CREATE POLICY "Public Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'osis-assets');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

