import type {
  ClassItem,
  Student,
  Candidate,
  ElectionSettings,
  ElectionStats,
  AdminUser,
  StudentProfile,
  ApiResponse,
} from '../types/index.ts';

const API_BASE = '/api';

function getAuthHeaders(type: 'admin' | 'student' = 'student'): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem(type === 'admin' ? 'eosis_admin_token' : 'eosis_student_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- AUTH ---
  async adminLogin(username: string, passwordPlain: string): Promise<{ user: AdminUser; token: string }> {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordPlain }),
    });
    const data: ApiResponse<{ user: AdminUser; token: string }> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login admin gagal');
    }
    return data.data!;
  },

  async studentLogin(nisn: string, birthDate: string): Promise<{ student: StudentProfile; token: string }> {
    const res = await fetch(`${API_BASE}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nisn, birth_date: birthDate }),
    });
    const data: ApiResponse<{ student: StudentProfile; token: string }> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login siswa gagal');
    }
    return data.data!;
  },

  async getStudentMe(): Promise<StudentProfile> {
    const res = await fetch(`${API_BASE}/auth/student/me`, {
      headers: getAuthHeaders('student'),
    });
    const data: ApiResponse<{ student: StudentProfile }> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat profil siswa');
    }
    return data.data!.student;
  },

  async studentLogout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/student/logout`, {
        method: 'POST',
        headers: getAuthHeaders('student'),
      });
    } catch (e) {
      // ignore network errors on logout
    }
  },

  // --- STATS & RESULTS ---
  async getStats(): Promise<ElectionStats> {
    const res = await fetch(`${API_BASE}/stats`);
    const data: ApiResponse<ElectionStats> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengambil data statistik');
    }
    return data.data!;
  },

  async getResults(): Promise<any> {
    const res = await fetch(`${API_BASE}/results`);
    const data: ApiResponse<any> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengambil data perolehan suara');
    }
    return data.data!;
  },

  // --- VOTING (ATOMIC RPC) ---
  async castVote(candidateId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/vote/cast`, {
      method: 'POST',
      headers: getAuthHeaders('student'),
      body: JSON.stringify({ candidate_id: candidateId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengirimkan suara Anda.');
    }
    return data;
  },

  // --- CLASSES ---
  async getClasses(): Promise<ClassItem[]> {
    const res = await fetch(`${API_BASE}/classes`);
    const data: ApiResponse<ClassItem[]> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat data kelas');
    }
    return data.data!;
  },

  async addClass(payload: { name: string; grade: number; is_active?: boolean }): Promise<ClassItem> {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<ClassItem> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menambahkan kelas');
    }
    return data.data!;
  },

  async updateClass(id: string, payload: Partial<ClassItem>): Promise<ClassItem> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<ClassItem> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui kelas');
    }
    return data.data!;
  },

  async deleteClass(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders('admin'),
    });
    const data: ApiResponse = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus kelas');
    }
  },

  // --- STUDENTS ---
  async getStudents(params?: {
    search?: string;
    class_id?: string;
    voted_status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ students: Student[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.class_id) query.set('class_id', params.class_id);
    if (params?.voted_status) query.set('voted_status', params.voted_status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/students?${query.toString()}`, {
      headers: getAuthHeaders('admin'),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat data siswa');
    }
    return data.data!;
  },

  async addStudent(payload: {
    nisn: string;
    full_name: string;
    birth_date: string;
    class_id: string;
    is_active?: boolean;
  }): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menambahkan siswa');
    }
    return data.data!;
  },

  async updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui data siswa');
    }
    return data.data!;
  },

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders('admin'),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus siswa');
    }
  },

  async importStudentsCSV(rows: Array<{ nisn: string; full_name: string; birth_date: string; class_name: string }>): Promise<{
    success_count: number;
    errors: string[];
  }> {
    const res = await fetch(`${API_BASE}/students/import-csv`, {
      method: 'POST',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengimpor data CSV');
    }
    return data.data!;
  },

  // --- CANDIDATES ---
  async getCandidates(onlyActive: boolean = false): Promise<Candidate[]> {
    const res = await fetch(`${API_BASE}/candidates?active=${onlyActive}`);
    const data: ApiResponse<Candidate[]> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat kandidat');
    }
    return data.data!;
  },

  async addCandidate(payload: Partial<Candidate>): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menambahkan pasangan calon');
    }
    return data.data!;
  },

  async updateCandidate(id: string, payload: Partial<Candidate>): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui data calon');
    }
    return data.data!;
  },

  async deleteCandidate(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders('admin'),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghapus kandidat');
    }
  },

  // --- SETTINGS ---
  async getSettings(): Promise<ElectionSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    const data: ApiResponse<ElectionSettings> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memuat pengaturan');
    }
    return data.data!;
  },

  async updateSettings(payload: Partial<ElectionSettings>): Promise<ElectionSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui pengaturan');
    }
    return data.data!;
  },

  async updateAdminCredentials(currentPassword: string, newUsername?: string, newPassword?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/settings/admin-credentials`, {
      method: 'PUT',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify({
        current_password: currentPassword,
        new_username: newUsername,
        new_password: newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui password admin');
    }
  },

  // --- AI ANALYSIS (GEMINI THINKING MODE) ---
  async analyzeWithAI(queryType: 'comparative_analysis' | 'debate_questions' | 'custom', customPrompt?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/analyze-candidates`, {
      method: 'POST',
      headers: getAuthHeaders('admin'),
      body: JSON.stringify({
        query_type: queryType,
        custom_prompt: customPrompt,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal melakukan analisis AI');
    }
    return data.data!.analysis;
  },
};
