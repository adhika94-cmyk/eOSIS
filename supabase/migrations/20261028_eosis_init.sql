-- ==============================================================================
-- eOSIS: SISTEM PEMILIHAN KETUA DAN WAKIL KETUA OSIS
-- SMP NEGERI 2 BOGOR
-- Database Schema, Constraints, Security Policies & Atomic Voting RPC
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE election_state_enum AS ENUM ('draft', 'active', 'paused', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    grade SMALLINT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_classes_grade ON public.classes(grade);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON public.classes(is_active);

-- 4. TABLE: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nisn VARCHAR(10) NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_nisn_format CHECK (nisn ~ '^[0-9]{10}$')
);

CREATE INDEX IF NOT EXISTS idx_students_nisn ON public.students(nisn);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON public.students(is_active);

-- 5. TABLE: admin_profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLE: candidates (Pasangan Calon Ketua & Wakil Ketua)
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ballot_number INTEGER NOT NULL UNIQUE CHECK (ballot_number > 0),
    chair_name TEXT NOT NULL,
    vice_chair_name TEXT NOT NULL,
    photo_path TEXT,
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    slogan TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_candidates_ballot_number ON public.candidates(ballot_number);
CREATE INDEX IF NOT EXISTS idx_candidates_is_active ON public.candidates(is_active);

-- 7. TABLE: election_settings
CREATE TABLE IF NOT EXISTS public.election_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL DEFAULT 'SMP NEGERI 2 BOGOR',
    school_logo_path TEXT,
    election_name TEXT NOT NULL DEFAULT 'Pemilihan Ketua & Wakil Ketua OSIS Periode 2026/2027',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    election_status election_state_enum NOT NULL DEFAULT 'active',
    publish_results BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_election_dates CHECK (ends_at > starts_at)
);

-- 8. TABLE: voter_participation (Privacy Preserving: NO Candidate reference!)
CREATE TABLE IF NOT EXISTS public.voter_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID NOT NULL REFERENCES public.election_settings(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    cast_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_voter_per_election UNIQUE (election_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_voter_part_student ON public.voter_participation(student_id);
CREATE INDEX IF NOT EXISTS idx_voter_part_election ON public.voter_participation(election_id);

-- 9. TABLE: election_tallies (Aggregated anonymous tallies)
CREATE TABLE IF NOT EXISTS public.election_tallies (
    election_id UUID NOT NULL REFERENCES public.election_settings(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    vote_count BIGINT NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (election_id, candidate_id)
);

-- 10. TABLE: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'student', 'system')),
    actor_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ATOMIC VOTING FUNCTION (POSTGRESQL RPC)
-- Guarantees 1-Student 1-Vote, Strict Secrecy, Concurrency Lock & Rollback
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_election_id UUID,
    p_student_id UUID,
    p_candidate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_election RECORD;
    v_student RECORD;
    v_candidate RECORD;
    v_already_voted BOOLEAN;
BEGIN
    -- 1. Lock and verify election settings
    SELECT * INTO v_election
    FROM public.election_settings
    WHERE id = p_election_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode pemilihan tidak ditemukan.' USING ERRCODE = 'P0001';
    END IF;

    -- Verify election timing & status
    IF v_election.election_status != 'active' THEN
        RAISE EXCEPTION 'Pemilihan sedang tidak aktif atau telah ditutup.' USING ERRCODE = 'P0002';
    END IF;

    IF now() < v_election.starts_at THEN
        RAISE EXCEPTION 'Pemilihan belum dibuka.' USING ERRCODE = 'P0003';
    END IF;

    IF now() > v_election.ends_at THEN
        RAISE EXCEPTION 'Pemilihan telah berakhir.' USING ERRCODE = 'P0004';
    END IF;

    -- 2. Lock and verify student eligibility
    SELECT * INTO v_student
    FROM public.students
    WHERE id = p_student_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data siswa tidak ditemukan.' USING ERRCODE = 'P0005';
    END IF;

    IF NOT v_student.is_active THEN
        RAISE EXCEPTION 'Akun siswa tidak aktif atau tidak memiliki hak pilih.' USING ERRCODE = 'P0006';
    END IF;

    -- 3. Check duplicate participation (Concurrency protection)
    SELECT EXISTS (
        SELECT 1 FROM public.voter_participation
        WHERE election_id = p_election_id AND student_id = p_student_id
    ) INTO v_already_voted;

    IF v_already_voted THEN
        RAISE EXCEPTION 'Anda sudah menggunakan hak suara Anda.' USING ERRCODE = 'P0007';
    END IF;

    -- 4. Verify candidate validity
    SELECT * INTO v_candidate
    FROM public.candidates
    WHERE id = p_candidate_id AND is_active = TRUE
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kandidat tidak valid atau sudah tidak aktif.' USING ERRCODE = 'P0008';
    END IF;

    -- 5. Record voter participation (Zero link to candidate!)
    INSERT INTO public.voter_participation (election_id, student_id, cast_at)
    VALUES (p_election_id, p_student_id, now());

    -- 6. Atomically update anonymous tally
    INSERT INTO public.election_tallies (election_id, candidate_id, vote_count, updated_at)
    VALUES (p_election_id, p_candidate_id, 1, now())
    ON CONFLICT (election_id, candidate_id)
    DO UPDATE SET
        vote_count = public.election_tallies.vote_count + 1,
        updated_at = now();

    -- Return safe sanitized response
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi',
        'timestamp', now()
    );
END;
$$;

-- Revoke public execution, allow authenticated and service role
REVOKE EXECUTE ON FUNCTION public.cast_vote(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cast_vote(UUID, UUID, UUID) TO authenticated, service_role;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_tallies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$;

-- Classes Policies
CREATE POLICY "Admins can manage classes"
    ON public.classes FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Public can view active classes"
    ON public.classes FOR SELECT
    TO authenticated, anon
    USING (is_active = TRUE);

-- Candidates Policies
CREATE POLICY "Admins can manage candidates"
    ON public.candidates FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Voters can view active candidates"
    ON public.candidates FOR SELECT
    TO authenticated, anon
    USING (is_active = TRUE);

-- Election Settings Policies
CREATE POLICY "Admins can manage settings"
    ON public.election_settings FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Public can view election settings"
    ON public.election_settings FOR SELECT
    TO authenticated, anon
    USING (TRUE);

-- Students Policies (Protected: NO public access!)
CREATE POLICY "Admins can manage students"
    ON public.students FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Voter Participation Policies (Admin can only see participation status, NOT candidate)
CREATE POLICY "Admins can view voter participation"
    ON public.voter_participation FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Election Tallies Policies
CREATE POLICY "Admins can view tallies"
    ON public.election_tallies FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Public can view tallies if published"
    ON public.election_tallies FOR SELECT
    TO authenticated, anon
    USING (
        EXISTS (
            SELECT 1 FROM public.election_settings
            WHERE id = election_tallies.election_id AND publish_results = TRUE
        )
    );
