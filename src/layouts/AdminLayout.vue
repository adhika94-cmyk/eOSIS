<template>
  <div class="admin-wrapper">
    <!-- Backdrop for mobile drawer -->
    <div 
      v-if="isMobileSidebarOpen" 
      class="sidebar-backdrop" 
      @click="isMobileSidebarOpen = false"
    ></div>

    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar" :class="{ 'show': isMobileSidebarOpen }">
      <div class="sidebar-brand">
        <img 
          :src="settings.logo_sekolah || defaultLogo" 
          alt="Logo Sekolah" 
          class="rounded"
          style="width: 38px; height: 38px; object-fit: contain; background: #fff; padding: 2px;"
        />
        <div class="text-truncate">
          <div class="fw-bold text-white fs-6 lh-1">eOSIS SPENDA</div>
          <small class="text-white-50 text-truncate d-block" style="font-size: 0.75rem;">
            {{ settings.nama_sekolah }}
          </small>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="px-3 pb-2 text-uppercase text-white-50 fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
          Menu Utama
        </div>
        
        <router-link to="/admin/beranda" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-grid-1x2"></i>
          <span>Beranda</span>
        </router-link>

        <router-link to="/admin/kelas" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-buildings"></i>
          <span>Kelas</span>
        </router-link>

        <router-link to="/admin/siswa" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-people"></i>
          <span>Siswa / User</span>
        </router-link>

        <router-link to="/admin/kandidat" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-person-badge"></i>
          <span>Calon Kandidat</span>
        </router-link>

        <router-link to="/admin/perolehan-suara" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-bar-chart-line"></i>
          <span>Perolehan Suara</span>
        </router-link>

        <div class="px-3 pt-3 pb-2 text-uppercase text-white-50 fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
          Sistem
        </div>

        <router-link to="/admin/pengaturan" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-sliders"></i>
          <span>Pengaturan</span>
        </router-link>

        <button type="button" class="sidebar-link border-0 w-100 text-start bg-transparent text-danger-emphasis" @click="triggerLogout">
          <i class="bi bi-box-arrow-right text-danger"></i>
          <span class="text-danger">Keluar</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="d-flex align-items-center justify-content-between">
          <div class="text-truncate me-2">
            <span class="d-block text-white fw-medium text-truncate" style="font-size: 0.85rem;">
              {{ currentAdmin?.nama_lengkap || 'Administrator' }}
            </span>
            <span class="d-block text-white-50" style="font-size: 0.75rem;">
              @{{ currentAdmin?.username }}
            </span>
          </div>
          <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-mono-numbers" style="font-size: 0.7rem;">
            {{ isSupabaseActive ? 'Supabase' : 'Local DB' }}
          </span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="admin-content-area">
      <!-- Top Header Bar -->
      <header class="border-bottom px-3 px-lg-4 py-2 d-flex align-items-center justify-content-between sticky-top top-header" style="z-index: 1020; background-color: #b8b2b2;">
        <div class="d-flex align-items-center gap-3">
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm d-lg-none"
            @click="isMobileSidebarOpen = !isMobileSidebarOpen"
            aria-label="Toggle Navigation"
          >
            <i class="bi bi-list fs-5"></i>
          </button>
          <div class="d-none d-sm-block">
            <span class="fw-semibold text-dark fs-6">{{ pageTitle }}</span>
            <span class="text-muted mx-2">·</span>
            <span class="text-muted small">Periode {{ settings.periode_pemilihan }}</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <span 
              class="badge rounded-pill d-flex align-items-center gap-1"
              :class="settings.voting_dibuka ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
            >
              <i class="bi" :class="settings.voting_dibuka ? 'bi-check-circle-fill' : 'bi-lock-fill'"></i>
              <span>{{ settings.voting_dibuka ? 'Pemilihan Dibuka' : 'Pemilihan Ditutup' }}</span>
            </span>
          </div>

          <router-link to="/" target="_blank" class="btn btn-outline-primary btn-sm d-none d-md-inline-flex align-items-center gap-1">
            <i class="bi bi-box-arrow-up-right"></i>
            <span>Buka Portal Siswa</span>
          </router-link>

          <button class="btn btn-light btn-sm text-danger border" @click="triggerLogout" title="Keluar">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </header>

      <!-- View Container -->
      <main class="p-3 p-lg-4 flex-grow-1" style="background-color: #b8b2b2;">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="bg-white border-top py-2 px-4 text-center text-muted small">
        <span>&copy; {{ new Date().getFullYear() }} {{ settings.nama_sekolah }} · Sistem Pemilihan OSIS Demokratis (eOSIS)</span>
      </footer>
    </div>

    <!-- Modal Konfirmasi Logout -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showLogoutModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showLogoutModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-4">
            <div class="text-danger mb-3">
              <i class="bi bi-exclamation-circle fs-1"></i>
            </div>
            <h5 class="fw-bold mb-2">Konfirmasi Keluar</h5>
            <p class="text-muted small mb-4">
              Apakah Anda yakin ingin keluar dari sesi administrator eOSIS?
            </p>
            <div class="d-flex gap-2 justify-content-center">
              <button type="button" class="btn btn-outline-secondary btn-sm px-3" @click="showLogoutModal = false">
                Batal
              </button>
              <button type="button" class="btn btn-danger btn-sm px-3" @click="confirmLogout">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService, AdminSession } from '../services/auth';
import { dbService } from '../services/db';
import type { Pengaturan } from '../types';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const router = useRouter();
const route = useRoute();

const isMobileSidebarOpen = ref(false);
const showLogoutModal = ref(false);
const currentAdmin = ref<AdminSession | null>(null);
const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

const isSupabaseActive = computed(() => dbService.isUsingSupabase());

const pageTitle = computed(() => {
  return (route.meta.title as string)?.replace(' - eOSIS', '') || 'Dashboard';
});

async function loadData() {
  currentAdmin.value = authService.getAdminSession();
  settings.value = await dbService.getPengaturan();
}

function triggerLogout() {
  showLogoutModal.value = true;
}

function confirmLogout() {
  showLogoutModal.value = false;
  authService.logoutAdmin();
  router.push('/admin/login');
}

onMounted(() => {
  loadData();
});
</script>
