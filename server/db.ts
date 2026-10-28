import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  ClassItem,
  Student,
  Candidate,
  ElectionSettings,
  CandidateTally,
  ElectionStats,
  AdminUser,
} from '../src/types/index.ts';

const DATA_FILE = path.resolve(process.cwd(), 'server', 'data.json');

export interface VoterParticipationRecord {
  id: string;
  election_id: string;
  student_id: string;
  cast_at: string;
}

export interface CandidateTallyRecord {
  candidate_id: string;
  vote_count: number;
}

export interface DatabaseSchema {
  classes: ClassItem[];
  students: Student[];
  candidates: Candidate[];
  settings: ElectionSettings;
  tallies: Record<string, number>; // candidate_id -> vote_count
  participation: VoterParticipationRecord[]; // privacy-preserving: no candidate_id!
  admin: {
    id: string;
    username: string;
    display_name: string;
    password_hash: string;
    role: 'admin' | 'super_admin';
  };
  student_sessions: Record<string, { student_id: string; expires_at: number }>;
  admin_sessions: Record<string, { admin_id: string; expires_at: number }>;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getInitialData(): DatabaseSchema {
  const electionId = 'e0515000-0000-0000-0000-000000000001';
  const now = new Date();
  const startsAt = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const classes: ClassItem[] = [
    { id: 'cls-7a', name: 'VII-A', grade: 7, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-7b', name: 'VII-B', grade: 7, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-7c', name: 'VII-C', grade: 7, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-8a', name: 'VIII-A', grade: 8, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-8b', name: 'VIII-B', grade: 8, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-8c', name: 'VIII-C', grade: 8, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-9a', name: 'IX-A', grade: 9, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-9b', name: 'IX-B', grade: 9, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
    { id: 'cls-9c', name: 'IX-C', grade: 9, is_active: true, created_at: now.toISOString(), updated_at: now.toISOString() },
  ];

  const students: Student[] = [
    { id: 'std-001', nisn: '0081234501', full_name: 'Ahmad Faiz Pratama', birth_date: '2011-05-14', class_id: 'cls-7a', is_active: true, created_at: now.toISOString() },
    { id: 'std-002', nisn: '0081234502', full_name: 'Anisa Citra Lestari', birth_date: '2011-08-22', class_id: 'cls-7a', is_active: true, created_at: now.toISOString() },
    { id: 'std-003', nisn: '0081234503', full_name: 'Bayu Arya Mahendra', birth_date: '2011-02-10', class_id: 'cls-7b', is_active: true, created_at: now.toISOString() },
    { id: 'std-004', nisn: '0081234504', full_name: 'Dinda Ayu Maharani', birth_date: '2011-11-03', class_id: 'cls-7b', is_active: true, created_at: now.toISOString() },
    { id: 'std-005', nisn: '0081234505', full_name: 'Eko Wahyudi', birth_date: '2010-06-18', class_id: 'cls-8a', is_active: true, created_at: now.toISOString() },
    { id: 'std-006', nisn: '0081234506', full_name: 'Farhan Rizky Maulana', birth_date: '2010-09-25', class_id: 'cls-8a', is_active: true, created_at: now.toISOString() },
    { id: 'std-007', nisn: '0081234507', full_name: 'Gita Permata Sari', birth_date: '2010-03-30', class_id: 'cls-8b', is_active: true, created_at: now.toISOString() },
    { id: 'std-008', nisn: '0081234508', full_name: 'Hafiz Danendra Putra', birth_date: '2010-12-15', class_id: 'cls-8c', is_active: true, created_at: now.toISOString() },
    { id: 'std-009', nisn: '0081234509', full_name: 'Indah Cahyani', birth_date: '2009-07-08', class_id: 'cls-9a', is_active: true, created_at: now.toISOString() },
    { id: 'std-010', nisn: '0081234510', full_name: 'Jovan Nathaniel', birth_date: '2009-04-12', class_id: 'cls-9a', is_active: true, created_at: now.toISOString() },
    { id: 'std-011', nisn: '0081234511', full_name: 'Kayla Safira Ramadhani', birth_date: '2009-10-01', class_id: 'cls-9b', is_active: true, created_at: now.toISOString() },
    { id: 'std-012', nisn: '0081234512', full_name: 'Luthfi Hakim', birth_date: '2009-01-20', class_id: 'cls-9c', is_active: true, created_at: now.toISOString() },
  ];

  const candidates: Candidate[] = [
    {
      id: 'cnd-01',
      ballot_number: 1,
      chair_name: 'Muhammad Fathir Rahman',
      vice_chair_name: 'Alya Zahra Salsabila',
      photo_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      vision: 'Mewujudkan OSIS SMPN 2 Bogor yang progresif, berakhlak mulia, berprestasi dalam sains & seni, serta responsif terhadap aspirasi seluruh warga sekolah.',
      mission: '1. Menyelenggarakan program penguatan karakter dan literasi digital secara berkala.\n2. Mengoptimalkan ekstrakurikuler sebagai wadah pengembangan talenta berdaya saing nasional.\n3. Menyediakan kanal aspirasi digital "Halo OSIS" yang transparan dan cepat tanggap.\n4. Menginisiasi program Green School & peduli lingkungan hidup.',
      slogan: 'Bersama Berkarya, Nyata Menginspirasi!',
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: 'cnd-02',
      ballot_number: 2,
      chair_name: 'Raditya Arya Pratama',
      vice_chair_name: 'Clara Jessica Nugraha',
      photo_path: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      vision: 'Terwujudnya siswa SMPN 2 Bogor yang kolaboratif, kreatif, melek teknologi, dan berwawasan global dengan tetap menjunjung tinggi budaya santun.',
      mission: '1. Mengembangkan pekan inovasi digital dan kompetisi kreativitas antarkelas (Spenda Festival).\n2. Mempererat toleransi dan persaudaraan antarseluruh angkatan melalui kegiatan keakraban positif.\n3. Revitalisasi mading dan media sosial OSIS sebagai sarana edukasi dan informasi yang menarik.\n4. Kerjasama dengan alumni dan praktisi untuk pelatihan kepemimpinan siswa.',
      slogan: 'Inovasi Tanpa Batas, Dedikasi Tanpa Henti!',
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: 'cnd-03',
      ballot_number: 3,
      chair_name: 'Bagas Aditya Saputra',
      vice_chair_name: 'Nadhira Putri Wardani',
      photo_path: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      vision: 'Membangun sinergi harmonis antara siswa, guru, dan lingkungan sekolah demi terciptanya iklim belajar yang aman, inklusif, ceria, dan berprestasi.',
      mission: '1. Kampanye aktif anti-bullying, ramah anak, dan kesehatan mental remaja di lingkungan sekolah.\n2. Membuka bursa belajar tutor sebaya untuk membantu siswa menghadapi ujian dan olimpiade.\n3. Mengaktifkan forum musyawarah perwakilan kelas secara berkala dan terbuka.\n4. Menyelenggarakan Spenda Cup tahunan di bidang olahraga dan esport positif.',
      slogan: 'Satu Hati, Satu Suara, Majukan Spenda!',
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const settings: ElectionSettings = {
    id: electionId,
    school_name: 'SMP NEGERI 2 BOGOR',
    school_logo_path: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=200&q=80',
    election_name: 'Pemilihan Ketua dan Wakil Ketua OSIS Masa Bakti 2026/2027',
    starts_at: startsAt,
    ends_at: endsAt,
    election_status: 'active',
    publish_results: true,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const tallies: Record<string, number> = {
    'cnd-01': 3,
    'cnd-02': 2,
    'cnd-03': 1,
  };

  // Seed sample anonymous participation records (for the 6 seeded votes, matching students 1-6)
  const participation: VoterParticipationRecord[] = [
    { id: 'part-01', election_id: electionId, student_id: 'std-001', cast_at: new Date(now.getTime() - 3600000 * 5).toISOString() },
    { id: 'part-02', election_id: electionId, student_id: 'std-002', cast_at: new Date(now.getTime() - 3600000 * 4).toISOString() },
    { id: 'part-03', election_id: electionId, student_id: 'std-003', cast_at: new Date(now.getTime() - 3600000 * 3).toISOString() },
    { id: 'part-04', election_id: electionId, student_id: 'std-004', cast_at: new Date(now.getTime() - 3600000 * 2).toISOString() },
    { id: 'part-05', election_id: electionId, student_id: 'std-005', cast_at: new Date(now.getTime() - 3600000 * 1.5).toISOString() },
    { id: 'part-06', election_id: electionId, student_id: 'std-006', cast_at: new Date(now.getTime() - 3600000 * 1).toISOString() },
  ];

  return {
    classes,
    students,
    candidates,
    settings,
    tallies,
    participation,
    admin: {
      id: 'adm-001',
      username: 'admin',
      display_name: 'Administrator eOSIS',
      password_hash: hashPassword('admin123'),
      role: 'admin',
    },
    student_sessions: {},
    admin_sessions: {},
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private isWriting: boolean = false;
  private voteLock: boolean = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read existing data.json, initializing fresh data:', err);
    }
    const initial = getInitialData();
    this.saveDataDirect(initial);
    return initial;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data.json:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  // --- STATS & OVERVIEW ---
  public getStats(): ElectionStats {
    const totalStudents = this.data.students.filter((s) => s.is_active).length;
    const votedCount = this.data.participation.length;
    const notVotedCount = Math.max(0, totalStudents - votedCount);
    const participationRate = totalStudents > 0 ? Number(((votedCount / totalStudents) * 100).toFixed(1)) : 0;

    let totalValidVotes = 0;
    Object.values(this.data.tallies).forEach((c) => {
      totalValidVotes += c;
    });

    const now = new Date();
    const starts = new Date(this.data.settings.starts_at);
    const ends = new Date(this.data.settings.ends_at);
    const isTimingActive = now >= starts && now <= ends && this.data.settings.election_status === 'active';

    const candidatesTally: CandidateTally[] = this.data.candidates
      .filter((c) => c.is_active)
      .sort((a, b) => a.ballot_number - b.ballot_number)
      .map((c) => {
        const count = this.data.tallies[c.id] || 0;
        const pct = totalValidVotes > 0 ? Number(((count / totalValidVotes) * 100).toFixed(1)) : 0;
        return {
          candidate_id: c.id,
          ballot_number: c.ballot_number,
          chair_name: c.chair_name,
          vice_chair_name: c.vice_chair_name,
          photo_path: c.photo_path,
          slogan: c.slogan,
          vote_count: count,
          percentage: pct,
        };
      });

    return {
      total_students: totalStudents,
      total_classes: this.data.classes.filter((c) => c.is_active).length,
      total_candidates: this.data.candidates.filter((c) => c.is_active).length,
      voted_count: votedCount,
      not_voted_count: notVotedCount,
      participation_rate: participationRate,
      total_valid_votes: totalValidVotes,
      election_status: this.data.settings.election_status,
      is_timing_active: isTimingActive,
      publish_results: this.data.settings.publish_results,
      last_updated: new Date().toISOString(),
      candidates_tally: candidatesTally,
      settings: this.data.settings,
    };
  }

  // --- CLASSES ---
  public getClasses(): ClassItem[] {
    return this.data.classes.map((cls) => {
      const studentCount = this.data.students.filter((s) => s.class_id === cls.id && s.is_active).length;
      return {
        ...cls,
        student_count: studentCount,
      };
    });
  }

  public addClass(data: { name: string; grade: number; is_active?: boolean }): ClassItem {
    const existing = this.data.classes.find((c) => c.name.toLowerCase() === data.name.trim().toLowerCase());
    if (existing) {
      throw new Error(`Kelas dengan nama "${data.name}" sudah ada.`);
    }
    const newClass: ClassItem = {
      id: 'cls-' + crypto.randomUUID().slice(0, 8),
      name: data.name.trim(),
      grade: Number(data.grade),
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.classes.push(newClass);
    this.save();
    return newClass;
  }

  public updateClass(id: string, updates: Partial<ClassItem>): ClassItem {
    const idx = this.data.classes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Kelas tidak ditemukan.');
    if (updates.name) {
      const duplicate = this.data.classes.find(
        (c) => c.id !== id && c.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (duplicate) throw new Error(`Nama kelas "${updates.name}" sudah digunakan.`);
    }
    this.data.classes[idx] = {
      ...this.data.classes[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.classes[idx];
  }

  public deleteClass(id: string): boolean {
    const studentCount = this.data.students.filter((s) => s.class_id === id).length;
    if (studentCount > 0) {
      throw new Error(
        `Tidak dapat menghapus kelas karena masih memiliki ${studentCount} siswa terdaftar. Nonaktifkan atau pindahkan siswa terlebih dahulu.`
      );
    }
    this.data.classes = this.data.classes.filter((c) => c.id !== id);
    this.save();
    return true;
  }

  // --- STUDENTS ---
  public getStudents(params?: {
    search?: string;
    class_id?: string;
    voted_status?: 'all' | 'voted' | 'not_voted';
    page?: number;
    limit?: number;
  }): { students: Student[]; total: number; page: number; totalPages: number } {
    let result = [...this.data.students];

    // Map class name and has_voted status
    const votedStudentIds = new Set(this.data.participation.map((p) => p.student_id));
    const classMap = new Map(this.data.classes.map((c) => [c.id, c.name]));

    result = result.map((s) => ({
      ...s,
      class_name: classMap.get(s.class_id) || 'Tidak Diketahui',
      has_voted: votedStudentIds.has(s.id),
    }));

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (s) => s.full_name.toLowerCase().includes(q) || s.nisn.includes(q)
      );
    }

    if (params?.class_id && params.class_id !== 'all') {
      result = result.filter((s) => s.class_id === params.class_id);
    }

    if (params?.voted_status && params.voted_status !== 'all') {
      if (params.voted_status === 'voted') {
        result = result.filter((s) => s.has_voted);
      } else if (params.voted_status === 'not_voted') {
        result = result.filter((s) => !s.has_voted);
      }
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 15);
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      students: paginated,
      total,
      page,
      totalPages,
    };
  }

  public addStudent(studentData: {
    nisn: string;
    full_name: string;
    birth_date: string;
    class_id: string;
    is_active?: boolean;
  }): Student {
    const nisnClean = studentData.nisn.trim();
    if (!/^\d{10}$/.test(nisnClean)) {
      throw new Error('NISN harus berupa 10 digit angka.');
    }
    const duplicate = this.data.students.find((s) => s.nisn === nisnClean);
    if (duplicate) {
      throw new Error(`Siswa dengan NISN ${nisnClean} sudah terdaftar.`);
    }
    const classExists = this.data.classes.find((c) => c.id === studentData.class_id);
    if (!classExists) {
      throw new Error('Kelas yang dipilih tidak valid.');
    }

    const newStudent: Student = {
      id: 'std-' + crypto.randomUUID().slice(0, 8),
      nisn: nisnClean,
      full_name: studentData.full_name.trim(),
      birth_date: studentData.birth_date,
      class_id: studentData.class_id,
      is_active: studentData.is_active !== undefined ? studentData.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.students.push(newStudent);
    this.save();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Data siswa tidak ditemukan.');

    if (updates.nisn) {
      const nisnClean = updates.nisn.trim();
      if (!/^\d{10}$/.test(nisnClean)) {
        throw new Error('NISN harus berupa 10 digit angka.');
      }
      const duplicate = this.data.students.find((s) => s.id !== id && s.nisn === nisnClean);
      if (duplicate) throw new Error(`NISN ${nisnClean} sudah terdaftar untuk siswa lain.`);
      updates.nisn = nisnClean;
    }

    if (updates.class_id) {
      const cls = this.data.classes.find((c) => c.id === updates.class_id);
      if (!cls) throw new Error('Kelas tidak valid.');
    }

    this.data.students[idx] = {
      ...this.data.students[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.students[idx];
  }

  public deleteStudent(id: string): boolean {
    const hasVoted = this.data.participation.some((p) => p.student_id === id);
    if (hasVoted) {
      throw new Error('Siswa ini sudah menggunakan hak suara dan datanya tidak dapat dihapus demi audit voting.');
    }
    this.data.students = this.data.students.filter((s) => s.id !== id);
    this.save();
    return true;
  }

  public importStudentsFromCSV(rows: Array<{ nisn: string; full_name: string; birth_date: string; class_name: string }>): {
    success_count: number;
    errors: string[];
  } {
    let successCount = 0;
    const errors: string[] = [];
    const classMap = new Map(this.data.classes.map((c) => [c.name.toLowerCase().trim(), c.id]));

    rows.forEach((row, i) => {
      const lineNum = i + 1;
      const nisn = (row.nisn || '').trim();
      const name = (row.full_name || '').trim();
      let birthDate = (row.birth_date || '').trim();
      const className = (row.class_name || '').trim().toLowerCase();

      if (!/^\d{10}$/.test(nisn)) {
        errors.push(`Baris ${lineNum}: NISN "${nisn}" tidak valid (harus 10 digit angka).`);
        return;
      }
      if (!name) {
        errors.push(`Baris ${lineNum}: Nama lengkap tidak boleh kosong.`);
        return;
      }

      // Format birthdate standardizer (supports DD/MM/YYYY or YYYY-MM-DD)
      if (birthDate.includes('/')) {
        const parts = birthDate.split('/');
        if (parts.length === 3) {
          birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      const classId = classMap.get(className);
      if (!classId) {
        errors.push(`Baris ${lineNum}: Kelas "${row.class_name}" tidak ditemukan dalam daftar kelas.`);
        return;
      }

      const duplicate = this.data.students.find((s) => s.nisn === nisn);
      if (duplicate) {
        errors.push(`Baris ${lineNum}: NISN ${nisn} sudah terdaftar.`);
        return;
      }

      this.data.students.push({
        id: 'std-' + crypto.randomUUID().slice(0, 8),
        nisn,
        full_name: name,
        birth_date: birthDate,
        class_id: classId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      successCount++;
    });

    if (successCount > 0) {
      this.save();
    }

    return {
      success_count: successCount,
      errors,
    };
  }

  // --- CANDIDATES ---
  public getCandidates(onlyActive: boolean = false): Candidate[] {
    let list = this.data.candidates;
    if (onlyActive) {
      list = list.filter((c) => c.is_active);
    }
    return list.sort((a, b) => a.ballot_number - b.ballot_number).map((c) => ({
      ...c,
      vote_count: this.data.tallies[c.id] || 0,
    }));
  }

  public addCandidate(data: {
    ballot_number: number;
    chair_name: string;
    vice_chair_name: string;
    photo_path?: string;
    vision: string;
    mission: string;
    slogan?: string;
    is_active?: boolean;
  }): Candidate {
    const ballotNum = Number(data.ballot_number);
    const duplicate = this.data.candidates.find((c) => c.ballot_number === ballotNum);
    if (duplicate) {
      throw new Error(`Nomor urut ${ballotNum} sudah digunakan oleh pasangan calon lain.`);
    }

    const newCandidate: Candidate = {
      id: 'cnd-' + crypto.randomUUID().slice(0, 8),
      ballot_number: ballotNum,
      chair_name: data.chair_name.trim(),
      vice_chair_name: data.vice_chair_name.trim(),
      photo_path: data.photo_path || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      vision: data.vision.trim(),
      mission: data.mission.trim(),
      slogan: data.slogan?.trim() || '',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.candidates.push(newCandidate);
    this.data.tallies[newCandidate.id] = 0;
    this.save();
    return newCandidate;
  }

  public updateCandidate(id: string, updates: Partial<Candidate>): Candidate {
    const idx = this.data.candidates.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Kandidat tidak ditemukan.');

    if (updates.ballot_number !== undefined) {
      const ballotNum = Number(updates.ballot_number);
      const duplicate = this.data.candidates.find((c) => c.id !== id && c.ballot_number === ballotNum);
      if (duplicate) throw new Error(`Nomor urut ${ballotNum} sudah digunakan.`);
      updates.ballot_number = ballotNum;
    }

    this.data.candidates[idx] = {
      ...this.data.candidates[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.candidates[idx];
  }

  public deleteCandidate(id: string): boolean {
    const voteCount = this.data.tallies[id] || 0;
    if (voteCount > 0) {
      throw new Error(
        `Kandidat ini sudah menerima ${voteCount} suara sah dan tidak dapat dihapus untuk menjaga keutuhan hasil suara. Anda dapat menonaktifkannya.`
      );
    }
    this.data.candidates = this.data.candidates.filter((c) => c.id !== id);
    delete this.data.tallies[id];
    this.save();
    return true;
  }

  // --- SETTINGS ---
  public getSettings(): ElectionSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<ElectionSettings>): ElectionSettings {
    if (updates.starts_at && updates.ends_at) {
      if (new Date(updates.ends_at) <= new Date(updates.starts_at)) {
        throw new Error('Tanggal berakhir harus lebih besar dari tanggal mulai pemilihan.');
      }
    }
    this.data.settings = {
      ...this.data.settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.settings;
  }

  // --- ADMIN CREDENTIALS ---
  public verifyAdmin(username: string, passwordPlain: string): AdminUser | null {
    if (this.data.admin.username === username.trim() && this.data.admin.password_hash === hashPassword(passwordPlain)) {
      return {
        id: this.data.admin.id,
        username: this.data.admin.username,
        display_name: this.data.admin.display_name,
        role: this.data.admin.role,
      };
    }
    return null;
  }

  public updateAdminCredentials(currentPassword: string, newUsername?: string, newPassword?: string): boolean {
    if (this.data.admin.password_hash !== hashPassword(currentPassword)) {
      throw new Error('Password saat ini salah.');
    }
    if (newUsername && newUsername.trim()) {
      this.data.admin.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 6) {
        throw new Error('Password baru minimal harus 6 karakter.');
      }
      this.data.admin.password_hash = hashPassword(newPassword);
    }
    this.save();
    return true;
  }

  // --- STUDENT AUTHENTICATION ---
  public verifyStudent(nisn: string, birthDate: string): { student: Student; token: string } {
    const cleanNisn = nisn.trim();
    const cleanBirth = birthDate.trim();

    const student = this.data.students.find((s) => s.nisn === cleanNisn && s.is_active);
    if (!student) {
      throw new Error('NISN tidak terdaftar atau akun siswa dinonaktifkan.');
    }

    // Compare date portions (YYYY-MM-DD)
    const stdDate = student.birth_date.split('T')[0];
    const inputDate = cleanBirth.split('T')[0];

    if (stdDate !== inputDate) {
      throw new Error('Tanggal lahir tidak cocok dengan data terdaftar.');
    }

    const hasVoted = this.data.participation.some((p) => p.student_id === student.id);
    const cls = this.data.classes.find((c) => c.id === student.class_id);

    // Create session token (expires in 2 hours)
    const token = 'st_' + crypto.randomBytes(24).toString('hex');
    this.data.student_sessions[token] = {
      student_id: student.id,
      expires_at: Date.now() + 2 * 60 * 60 * 1000,
    };
    this.save();

    return {
      student: {
        ...student,
        class_name: cls?.name || '-',
        has_voted: hasVoted,
      },
      token,
    };
  }

  public getStudentByToken(token: string): { student: Student; has_voted: boolean } | null {
    const session = this.data.student_sessions[token];
    if (!session || session.expires_at < Date.now()) {
      return null;
    }
    const student = this.data.students.find((s) => s.id === session.student_id);
    if (!student || !student.is_active) return null;

    const hasVoted = this.data.participation.some((p) => p.student_id === student.id);
    const cls = this.data.classes.find((c) => c.id === student.class_id);

    return {
      student: {
        ...student,
        class_name: cls?.name || '-',
      },
      has_voted: hasVoted,
    };
  }

  public revokeStudentToken(token: string): void {
    if (this.data.student_sessions[token]) {
      delete this.data.student_sessions[token];
      this.save();
    }
  }

  // --- ATOMIC VOTING TRANSACTION (RPC equivalent) ---
  public async castVote(
    token: string,
    candidateId: string
  ): Promise<{ success: boolean; message: string }> {
    // Concurrency lock to prevent race condition across concurrent requests
    while (this.voteLock) {
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    this.voteLock = true;
    try {
      // 1. Verify student session
      const studentSession = this.getStudentByToken(token);
      if (!studentSession) {
        throw new Error('Sesi pemilih tidak valid atau telah berakhir. Silakan login kembali.');
      }

      const student = studentSession.student;
      if (!student.is_active) {
        throw new Error('Akun siswa tidak aktif.');
      }

      // 2. Verify election status and dates
      const settings = this.data.settings;
      if (settings.election_status !== 'active') {
        throw new Error('Pemilihan sedang tidak aktif.');
      }

      const now = new Date();
      const starts = new Date(settings.starts_at);
      const ends = new Date(settings.ends_at);

      if (now < starts) {
        throw new Error('Pemilihan belum dibuka.');
      }
      if (now > ends) {
        throw new Error('Pemilihan telah berakhir.');
      }

      // 3. Verify student hasn't voted yet
      const alreadyVoted = this.data.participation.some((p) => p.student_id === student.id);
      if (alreadyVoted) {
        throw new Error('Anda sudah menggunakan hak suara Anda.');
      }

      // 4. Verify candidate exists and active
      const candidate = this.data.candidates.find((c) => c.id === candidateId && c.is_active);
      if (!candidate) {
        throw new Error('Kandidat yang dipilih tidak valid atau sudah tidak aktif.');
      }

      // 5. Atomic write: Record voter participation (Zero link to candidate!)
      this.data.participation.push({
        id: 'prt-' + crypto.randomUUID().slice(0, 8),
        election_id: settings.id,
        student_id: student.id,
        cast_at: new Date().toISOString(),
      });

      // 6. Atomically increment anonymous candidate tally
      this.data.tallies[candidateId] = (this.data.tallies[candidateId] || 0) + 1;

      // 7. Expire student session immediately upon voting completion
      delete this.data.student_sessions[token];

      this.save();

      return {
        success: true,
        message: 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi',
      };
    } finally {
      this.voteLock = false;
    }
  }
}

export const db = new DatabaseManager();
