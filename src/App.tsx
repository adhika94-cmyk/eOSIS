/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { Header } from './components/common/Header.tsx';
import { AdminSidebar, AdminTab } from './components/common/AdminSidebar.tsx';

// Pages
import { StudentLogin } from './pages/auth/StudentLogin.tsx';
import { AdminLogin } from './pages/auth/AdminLogin.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { CandidateSelection } from './pages/student/CandidateSelection.tsx';
import { VoteSuccess } from './pages/student/VoteSuccess.tsx';
import { Dashboard } from './pages/admin/Dashboard.tsx';
import { Classes } from './pages/admin/Classes.tsx';
import { Students } from './pages/admin/Students.tsx';
import { Candidates } from './pages/admin/Candidates.tsx';
import { Results } from './pages/admin/Results.tsx';
import { AIAssistant } from './pages/admin/AIAssistant.tsx';
import { Settings } from './pages/admin/Settings.tsx';

function MainApp() {
  const { role, isLoading, logout, refreshStudent } = useAuth();

  // Guest view toggle (student login vs admin login)
  const [guestView, setGuestView] = useState<'student_login' | 'admin_login'>('student_login');

  // Student flow view: 'dashboard' | 'voting' | 'success'
  const [studentView, setStudentView] = useState<'dashboard' | 'voting' | 'success'>('dashboard');

  // Admin flow tab
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold tracking-tight">Memuat Aplikasi eOSIS...</h2>
        <p className="text-xs text-slate-400 mt-1">Menghubungkan ke sistem pemilihan</p>
      </div>
    );
  }

  // --- GUEST FLOW ---
  if (role === 'guest') {
    return (
      <>
        <ToastContainer />
        {guestView === 'student_login' ? (
          <StudentLogin onSwitchToAdmin={() => setGuestView('admin_login')} />
        ) : (
          <AdminLogin onSwitchToStudent={() => setGuestView('student_login')} />
        )}
      </>
    );
  }

  // --- STUDENT FLOW ---
  if (role === 'student') {
    const handleVoteSuccess = () => {
      setStudentView('success');
    };

    const handleSuccessComplete = async () => {
      // Clear session after 4-second countdown and redirect to student login
      await logout();
      setStudentView('dashboard');
      setGuestView('student_login');
    };

    return (
      <>
        <ToastContainer />
        {studentView === 'success' ? (
          <VoteSuccess onComplete={handleSuccessComplete} />
        ) : (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header title="Portal Siswa eOSIS" />
            <div className="flex-1">
              {studentView === 'dashboard' ? (
                <StudentDashboard onStartVoting={() => setStudentView('voting')} />
              ) : (
                <CandidateSelection
                  onBack={() => setStudentView('dashboard')}
                  onVoteSuccess={handleVoteSuccess}
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // --- ADMIN FLOW ---
  const tabTitles: Record<AdminTab, string> = {
    dashboard: 'Beranda & Statistik',
    classes: 'Data Kelas',
    students: 'Data Siswa / Pemilih',
    candidates: 'Calon Kandidat OSIS',
    results: 'Rekapitulasi Perolehan Suara',
    'ai-assistant': 'Asisten AI OSIS (Thinking Mode)',
    settings: 'Pengaturan Sistem',
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Admin Sidebar */}
        <AdminSidebar
          currentTab={adminTab}
          onSelectTab={(tab) => setAdminTab(tab)}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Content Wrapper */}
        <div className="lg:pl-72 flex-1 flex flex-col">
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            title={tabTitles[adminTab]}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {adminTab === 'dashboard' && <Dashboard onNavigate={(t) => setAdminTab(t)} />}
            {adminTab === 'classes' && <Classes />}
            {adminTab === 'students' && <Students />}
            {adminTab === 'candidates' && <Candidates />}
            {adminTab === 'results' && <Results />}
            {adminTab === 'ai-assistant' && <AIAssistant />}
            {adminTab === 'settings' && <Settings />}
          </main>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
