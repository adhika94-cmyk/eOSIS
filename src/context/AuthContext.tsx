import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import type { AdminUser, StudentProfile, ElectionSettings } from '../types/index.ts';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  role: 'guest' | 'student' | 'admin';
  student: StudentProfile | null;
  admin: AdminUser | null;
  settings: ElectionSettings | null;
  isLoading: boolean;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  loginStudent: (nisn: string, birthDate: string) => Promise<StudentProfile>;
  loginAdmin: (username: string, passwordPlain: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshStudent: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<'guest' | 'student' | 'admin'>('guest');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  };

  const refreshStudent = async () => {
    const studentToken = localStorage.getItem('eosis_student_token');
    if (studentToken) {
      try {
        const profile = await api.getStudentMe();
        setStudent(profile);
        setRole('student');
      } catch (e) {
        localStorage.removeItem('eosis_student_token');
        setStudent(null);
        setRole('guest');
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshSettings();

      // Check admin session
      const adminToken = localStorage.getItem('eosis_admin_token');
      const adminUserRaw = localStorage.getItem('eosis_admin_user');
      if (adminToken && adminUserRaw) {
        try {
          const user = JSON.parse(adminUserRaw);
          setAdmin(user);
          setRole('admin');
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('eosis_admin_token');
          localStorage.removeItem('eosis_admin_user');
        }
      }

      // Check student session
      const studentToken = localStorage.getItem('eosis_student_token');
      if (studentToken) {
        try {
          const profile = await api.getStudentMe();
          setStudent(profile);
          setRole('student');
        } catch (e) {
          localStorage.removeItem('eosis_student_token');
          setStudent(null);
          setRole('guest');
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginStudent = async (nisn: string, birthDate: string): Promise<StudentProfile> => {
    const res = await api.studentLogin(nisn, birthDate);
    localStorage.setItem('eosis_student_token', res.token);
    setStudent(res.student);
    setRole('student');
    showToast(`Selamat datang, ${res.student.full_name}!`, 'success');
    return res.student;
  };

  const loginAdmin = async (username: string, passwordPlain: string): Promise<AdminUser> => {
    const res = await api.adminLogin(username, passwordPlain);
    localStorage.setItem('eosis_admin_token', res.token);
    localStorage.setItem('eosis_admin_user', JSON.stringify(res.user));
    setAdmin(res.user);
    setRole('admin');
    showToast(`Berhasil masuk sebagai ${res.user.display_name}`, 'success');
    return res.user;
  };

  const logout = async () => {
    if (role === 'student') {
      await api.studentLogout();
      localStorage.removeItem('eosis_student_token');
      setStudent(null);
    } else if (role === 'admin') {
      localStorage.removeItem('eosis_admin_token');
      localStorage.removeItem('eosis_admin_user');
      setAdmin(null);
    }
    setRole('guest');
    showToast('Sesi telah berakhir.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        student,
        admin,
        settings,
        isLoading,
        toasts,
        showToast,
        removeToast,
        loginStudent,
        loginAdmin,
        logout,
        refreshStudent,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
