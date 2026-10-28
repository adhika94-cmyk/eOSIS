-- ==============================================================================
-- eOSIS: SEED DATA FOR SMP NEGERI 2 BOGOR
-- ==============================================================================

-- 1. Insert Initial Election Settings
INSERT INTO public.election_settings (
    id, school_name, school_logo_path, election_name, starts_at, ends_at, election_status, publish_results
) VALUES (
    'e0515000-0000-0000-0000-000000000001',
    'SMP NEGERI 2 BOGOR',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80',
    'Pemilihan Ketua dan Wakil Ketua OSIS Masa Bakti 2026/2027',
    now() - INTERVAL '1 day',
    now() + INTERVAL '7 days',
    'active',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Classes
INSERT INTO public.classes (id, name, grade, is_active) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'VII-A', 7, TRUE),
    ('c0000001-0000-0000-0000-000000000002', 'VII-B', 7, TRUE),
    ('c0000001-0000-0000-0000-000000000003', 'VII-C', 7, TRUE),
    ('c0000001-0000-0000-0000-000000000004', 'VIII-A', 8, TRUE),
    ('c0000001-0000-0000-0000-000000000005', 'VIII-B', 8, TRUE),
    ('c0000001-0000-0000-0000-000000000006', 'VIII-C', 8, TRUE),
    ('c0000001-0000-0000-0000-000000000007', 'IX-A', 9, TRUE),
    ('c0000001-0000-0000-0000-000000000008', 'IX-B', 9, TRUE),
    ('c0000001-0000-0000-0000-000000000009', 'IX-C', 9, TRUE)
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Candidates
INSERT INTO public.candidates (
    id, ballot_number, chair_name, vice_chair_name, photo_path, vision, mission, slogan, is_active
) VALUES
(
    'a0000001-0000-0000-0000-000000000001',
    1,
    'Muhammad Fathir Rahman',
    'Alya Zahra Salsabila',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'Mewujudkan OSIS SMPN 2 Bogor yang progresif, berakhlak mulia, berprestasi dalam sains & seni, serta responsif terhadap aspirasi seluruh warga sekolah.',
    '1. Menyelenggarakan program penguatan karakter dan literasi digital secara berkala.\n2. Mengoptimalkan ekstrakurikuler sebagai wadah pengembangan talenta berdaya saing nasional.\n3. Menyediakan kanal aspirasi digital "Halo OSIS" yang transparan dan cepat tanggap.\n4. Menginisiasi program Green School & peduli lingkungan hidup.',
    'Bersama Berkarya, Nyata Menginspirasi!',
    TRUE
),
(
    'a0000001-0000-0000-0000-000000000002',
    2,
    'Raditya Arya Pratama',
    'Clara Jessica Nugraha',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'Terwujudnya siswa SMPN 2 Bogor yang kolaboratif, kreatif, melek teknologi, dan berwawasan global dengan tetap menjunjung tinggi budaya santun.',
    '1. Mengembangkan pekan inovasi digital dan kompetisi kreativitas antarkelas (Spenda Festival).\n2. Mempererat toleransi dan persaudaraan antarseluruh angkatan melalui kegiatan keakraban positif.\n3. Revitalisasi mading dan media sosial OSIS sebagai sarana edukasi dan informasi yang menarik.\n4. Kerjasama dengan alumni dan praktisi untuk pelatihan kepemimpinan siswa.',
    'Inovasi Tanpa Batas, Dedikasi Tanpa Henti!',
    TRUE
),
(
    'a0000001-0000-0000-0000-000000000003',
    3,
    'Bagas Aditya Saputra',
    'Nadhira Putri Wardani',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    'Membangun sinergi harmonis antara siswa, guru, dan lingkungan sekolah demi terciptanya iklim belajar yang aman, inklusif, ceria, dan berprestasi.',
    '1. Kampanye aktif anti-bullying, ramah anak, dan kesehatan mental remaja di lingkungan sekolah.\n2. Membuka bursa belajar tutor sebaya untuk membantu siswa menghadapi ujian dan olimpiade.\n3. Mengaktifkan forum musyawarah perwakilan kelas secara berkala dan terbuka.\n4. Menyelenggarakan Spenda Cup tahunan di bidang olahraga dan esport positif.',
    'Satu Hati, Satu Suara, Majukan Spenda!',
    TRUE
)
ON CONFLICT (ballot_number) DO NOTHING;

-- 4. Initialize Election Tallies
INSERT INTO public.election_tallies (election_id, candidate_id, vote_count)
VALUES
    ('e0515000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 0),
    ('e0515000-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 0),
    ('e0515000-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 0)
ON CONFLICT (election_id, candidate_id) DO NOTHING;
