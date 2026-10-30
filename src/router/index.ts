import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { authService } from '../services/auth';

// Views Siswa
import SiswaLoginView from '../views/siswa/SiswaLoginView.vue';
import SiswaDashboardView from '../views/siswa/SiswaDashboardView.vue';
import SiswaBilikSuaraView from '../views/siswa/SiswaBilikSuaraView.vue';

// Views Admin
import AdminLoginView from '../views/admin/AdminLoginView.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminBerandaView from '../views/admin/AdminBerandaView.vue';
import AdminKelasView from '../views/admin/AdminKelasView.vue';
import AdminSiswaView from '../views/admin/AdminSiswaView.vue';
import AdminKandidatView from '../views/admin/AdminKandidatView.vue';
import AdminPerolehanSuaraView from '../views/admin/AdminPerolehanSuaraView.vue';
import AdminPengaturanView from '../views/admin/AdminPengaturanView.vue';

const routes: RouteRecordRaw[] = [
  // Siswa Routes
  {
    path: '/',
    name: 'SiswaLogin',
    component: SiswaLoginView,
    meta: { title: 'Login Pemilih - eOSIS SPENDA' }
  },
  {
    path: '/siswa/dashboard',
    name: 'SiswaDashboard',
    component: SiswaDashboardView,
    meta: { requiresSiswa: true, title: 'Dashboard Siswa - eOSIS' }
  },
  {
    path: '/siswa/bilik-suara',
    name: 'SiswaBilikSuara',
    component: SiswaBilikSuaraView,
    meta: { requiresSiswa: true, requiresNotVoted: true, title: 'Bilik Suara Digital - eOSIS' }
  },

  // Admin Login
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLoginView,
    meta: { title: 'Login Administrator - eOSIS' }
  },

  // Admin Protected Area
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/beranda'
      },
      {
        path: 'beranda',
        name: 'AdminBeranda',
        component: AdminBerandaView,
        meta: { title: 'Beranda Admin - eOSIS' }
      },
      {
        path: 'kelas',
        name: 'AdminKelas',
        component: AdminKelasView,
        meta: { title: 'Manajemen Data Kelas - eOSIS' }
      },
      {
        path: 'siswa',
        name: 'AdminSiswa',
        component: AdminSiswaView,
        meta: { title: 'Manajemen Siswa & DPT - eOSIS' }
      },
      {
        path: 'kandidat',
        name: 'AdminKandidat',
        component: AdminKandidatView,
        meta: { title: 'Manajemen Calon Kandidat - eOSIS' }
      },
      {
        path: 'perolehan-suara',
        name: 'AdminPerolehanSuara',
        component: AdminPerolehanSuaraView,
        meta: { title: 'Perolehan & Rekapitulasi Suara - eOSIS' }
      },
      {
        path: 'pengaturan',
        name: 'AdminPengaturan',
        component: AdminPengaturanView,
        meta: { title: 'Pengaturan Sistem - eOSIS' }
      }
    ]
  },

  // Catch all / 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guards
router.beforeEach(async (to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} | SMPN 2 Kota Bogor`;
  }

  // Guard Admin
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!authService.isAdminLoggedIn()) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } });
      return;
    }
  }

  // Guard Siswa
  if (to.matched.some(record => record.meta.requiresSiswa)) {
    if (!authService.isSiswaLoggedIn()) {
      next({ name: 'SiswaLogin' });
      return;
    }

    // Refresh status siswa dari database untuk kepastian hak suara
    const session = await authService.refreshSiswaSession();
    if (!session) {
      next({ name: 'SiswaLogin' });
      return;
    }

    // Jika masuk ke bilik suara padahal sudah memilih
    if (to.meta.requiresNotVoted && session.sudah_memilih) {
      next({ name: 'SiswaDashboard' });
      return;
    }
  }

  // Jika admin sudah login dan mengakses login page admin
  if (to.name === 'AdminLogin' && authService.isAdminLoggedIn()) {
    next({ name: 'AdminBeranda' });
    return;
  }

  // Jika siswa sudah login dan mengakses login page siswa
  if (to.name === 'SiswaLogin' && authService.isSiswaLoggedIn()) {
    next({ name: 'SiswaDashboard' });
    return;
  }

  next();
});

export default router;
