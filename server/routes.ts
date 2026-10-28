import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const apiRouter = Router();

// Middleware: Student authentication
function authenticateStudent(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Sesi siswa tidak ditemukan atau belum login.' });
  }
  const token = authHeader.split(' ')[1];
  const session = db.getStudentByToken(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' });
  }
  (req as any).student = session.student;
  (req as any).studentToken = token;
  (req as any).hasVoted = session.has_voted;
  next();
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
apiRouter.post('/auth/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi.' });
    }
    const admin = db.verifyAdmin(username, password);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Username atau password admin salah.' });
    }
    // Simple admin token
    const token = 'adm_token_' + Buffer.from(admin.id + ':' + Date.now()).toString('base64');
    return res.json({
      success: true,
      data: {
        user: admin,
        token,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/auth/student/login', (req: Request, res: Response) => {
  try {
    const { nisn, birth_date } = req.body;
    if (!nisn || !birth_date) {
      return res.status(400).json({ success: false, error: 'NISN dan tanggal lahir wajib diisi.' });
    }
    const result = db.verifyStudent(nisn, birth_date);
    
    // Mask NISN for privacy (e.g. 0081****01)
    const rawNisn = result.student.nisn;
    const maskedNisn = rawNisn.length >= 6 
      ? rawNisn.slice(0, 4) + '****' + rawNisn.slice(-2)
      : '******';

    return res.json({
      success: true,
      data: {
        token: result.token,
        student: {
          id: result.student.id,
          nisn_masked: maskedNisn,
          full_name: result.student.full_name,
          birth_date: result.student.birth_date,
          class_id: result.student.class_id,
          class_name: result.student.class_name,
          has_voted: result.student.has_voted,
          is_active: result.student.is_active,
        },
      },
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/auth/student/me', authenticateStudent, (req: Request, res: Response) => {
  const student = (req as any).student;
  const rawNisn = student.nisn;
  const maskedNisn = rawNisn.length >= 6 
    ? rawNisn.slice(0, 4) + '****' + rawNisn.slice(-2)
    : '******';

  return res.json({
    success: true,
    data: {
      student: {
        id: student.id,
        nisn_masked: maskedNisn,
        full_name: student.full_name,
        birth_date: student.birth_date,
        class_id: student.class_id,
        class_name: student.class_name,
        has_voted: (req as any).hasVoted,
        is_active: student.is_active,
      },
    },
  });
});

apiRouter.post('/auth/student/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    db.revokeStudentToken(token);
  }
  return res.json({ success: true, message: 'Berhasil keluar.' });
});

// -------------------------------------------------------------
// STATS & RESULTS
// -------------------------------------------------------------
apiRouter.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    return res.json({ success: true, data: stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/results', (req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    // Public/student visibility check
    return res.json({
      success: true,
      data: {
        total_valid_votes: stats.total_valid_votes,
        voted_count: stats.voted_count,
        total_students: stats.total_students,
        participation_rate: stats.participation_rate,
        election_status: stats.election_status,
        publish_results: stats.publish_results,
        candidates_tally: stats.candidates_tally,
        last_updated: stats.last_updated,
        school_name: stats.settings.school_name,
        election_name: stats.settings.election_name,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ATOMIC VOTING (RPC)
// -------------------------------------------------------------
apiRouter.post('/vote/cast', authenticateStudent, async (req: Request, res: Response) => {
  try {
    const token = (req as any).studentToken;
    const { candidate_id } = req.body;

    if (!candidate_id) {
      return res.status(400).json({ success: false, error: 'Silakan pilih salah satu pasangan calon.' });
    }

    const result = await db.castVote(token, candidate_id);
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Gagal merekam suara. Silakan coba kembali.',
    });
  }
});

// -------------------------------------------------------------
// CLASSES CRUD
// -------------------------------------------------------------
apiRouter.get('/classes', (req: Request, res: Response) => {
  try {
    const classes = db.getClasses();
    return res.json({ success: true, data: classes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/classes', (req: Request, res: Response) => {
  try {
    const { name, grade, is_active } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ success: false, error: 'Nama kelas dan tingkat wajib diisi.' });
    }
    const newClass = db.addClass({ name, grade: Number(grade), is_active });
    return res.json({ success: true, data: newClass });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.put('/classes/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateClass(req.params.id, req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/classes/:id', (req: Request, res: Response) => {
  try {
    db.deleteClass(req.params.id);
    return res.json({ success: true, message: 'Kelas berhasil dihapus.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// STUDENTS CRUD
// -------------------------------------------------------------
apiRouter.get('/students', (req: Request, res: Response) => {
  try {
    const { search, class_id, voted_status, page, limit } = req.query;
    const result = db.getStudents({
      search: search as string,
      class_id: class_id as string,
      voted_status: voted_status as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/students', (req: Request, res: Response) => {
  try {
    const { nisn, full_name, birth_date, class_id, is_active } = req.body;
    if (!nisn || !full_name || !birth_date || !class_id) {
      return res.status(400).json({ success: false, error: 'Semua bidang wajib diisi.' });
    }
    const student = db.addStudent({ nisn, full_name, birth_date, class_id, is_active });
    return res.json({ success: true, data: student });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.put('/students/:id', (req: Request, res: Response) => {
  try {
    const student = db.updateStudent(req.params.id, req.body);
    return res.json({ success: true, data: student });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/students/:id', (req: Request, res: Response) => {
  try {
    db.deleteStudent(req.params.id);
    return res.json({ success: true, message: 'Data siswa berhasil dihapus.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/students/import-csv', (req: Request, res: Response) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Data CSV tidak ditemukan atau kosong.' });
    }
    const result = db.importStudentsFromCSV(rows);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// CANDIDATES CRUD
// -------------------------------------------------------------
apiRouter.get('/candidates', (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.active === 'true';
    const list = db.getCandidates(onlyActive);
    return res.json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/candidates', (req: Request, res: Response) => {
  try {
    const { ballot_number, chair_name, vice_chair_name, photo_path, vision, mission, slogan, is_active } = req.body;
    if (!ballot_number || !chair_name || !vice_chair_name || !vision || !mission) {
      return res.status(400).json({ success: false, error: 'Nomor urut, nama ketua, nama wakil, visi, dan misi wajib diisi.' });
    }
    const candidate = db.addCandidate({
      ballot_number: Number(ballot_number),
      chair_name,
      vice_chair_name,
      photo_path,
      vision,
      mission,
      slogan,
      is_active,
    });
    return res.json({ success: true, data: candidate });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.put('/candidates/:id', (req: Request, res: Response) => {
  try {
    const candidate = db.updateCandidate(req.params.id, req.body);
    return res.json({ success: true, data: candidate });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/candidates/:id', (req: Request, res: Response) => {
  try {
    db.deleteCandidate(req.params.id);
    return res.json({ success: true, message: 'Kandidat berhasil dihapus.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SETTINGS & PROFILE
// -------------------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    return res.json({ success: true, data: settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.updateSettings(req.body);
    return res.json({ success: true, data: settings });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.put('/settings/admin-credentials', (req: Request, res: Response) => {
  try {
    const { current_password, new_username, new_password } = req.body;
    if (!current_password) {
      return res.status(400).json({ success: false, error: 'Password saat ini diperlukan untuk verifikasi.' });
    }
    db.updateAdminCredentials(current_password, new_username, new_password);
    return res.json({ success: true, message: 'Kredensial admin berhasil diperbarui.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// AI OSIS ANALYZER (Thinking Mode with Gemini)
// -------------------------------------------------------------
apiRouter.post('/ai/analyze-candidates', async (req: Request, res: Response) => {
  try {
    const { query_type, custom_prompt } = req.body;
    const candidates = db.getCandidates(true);
    const settings = db.getSettings();

    const candidatesSummary = candidates.map((c) => `
Pasangan Nomor Urut ${c.ballot_number}:
- Ketua: ${c.chair_name}
- Wakil Ketua: ${c.vice_chair_name}
- Slogan: "${c.slogan}"
- Visi: ${c.vision}
- Misi: ${c.mission}
    `).join('\n\n');

    let prompt = '';
    if (query_type === 'comparative_analysis') {
      prompt = `Anda adalah konsultan pendidikan dan pakar kepemimpinan OSIS untuk sekolah di Indonesia. 
Sekolah: ${settings.school_name}.
Berikut adalah daftar calon pasangan ketua dan wakil ketua OSIS:
${candidatesSummary}

Lakukan analisis komparatif yang mendalam, netral, objektif, dan konstruktif terhadap visi, misi, dan slogan setiap pasangan calon. 
Berikan poin-poin:
1. Kekuatan utama masing-masing pasangan calon.
2. Area program kerja yang paling inovatif.
3. Pertanyaan kritis untuk sesi debat calon ketua OSIS bagi masing-masing pasangan.
4. Rekomendasi tema debat terbuka.`;
    } else if (query_type === 'debate_questions') {
      prompt = `Buatkan 6 pertanyaan debat resmi untuk Pemilihan Ketua OSIS ${settings.school_name} berdasarkan visi misi berikut:
${candidatesSummary}

Sertakan:
- 2 Pertanyaan studi kasus kepemimpinan (menangani perundungan / kedisiplinan)
- 2 Pertanyaan integrasi teknologi dan akademik
- 2 Pertanyaan kolaborasi ekstrakurikuler dan lingkungan hidup sekolah.`;
    } else {
      prompt = custom_prompt || `Analisis program kerja pasangan calon OSIS berikut: \n${candidatesSummary}`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum dikonfigurasi di environment.',
      });
    }

    const ai = new GoogleGenAI();
    let textResult = '';

    try {
      // Primary: gemini-4-argon with high thinking mode
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      textResult = response.text || '';
    } catch (argonErr: any) {
      console.warn('Falling back from gemini-4-argon to gemini-3.8-flash:', argonErr?.message);
      // Fallback model
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      textResult = fallbackResponse.text || '';
    }

    return res.json({
      success: true,
      data: {
        analysis: textResult,
      },
    });
  } catch (err: any) {
    console.error('AI Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal memproses analisis AI.' });
  }
});
