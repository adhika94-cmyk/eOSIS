<template>
  <div class="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3" style="background: #0f1e36;">
    <div class="w-100" style="max-width: 420px;">
      
      <!-- Brand Header -->
      <div class="text-center mb-4">
        <div class="d-inline-flex p-3 rounded-circle bg-white shadow-lg mb-3">
          <img 
            :src="settings.logo_sekolah || defaultLogo" 
            alt="Logo Sekolah" 
            style="width: 58px; height: 58px; object-fit: contain;"
          />
        </div>
        <h1 class="h4 fw-bold text-white mb-1">eOSIS SPENDA BOGOR</h1>
        <p class="text-white-50 small mb-0">Panel Masuk Administrator & Panitia Pemilihan</p>
      </div>

      <!-- Card Login Admin -->
      <div class="card card-clean border-0 shadow-lg p-4 p-sm-5 bg-white">
        <div class="mb-4 text-center">
          <div class="d-inline-flex p-2 rounded-circle bg-primary-subtle text-primary mb-2">
            <i class="bi bi-shield-lock-fill fs-4"></i>
          </div>
          <h2 class="h5 fw-bold text-dark mb-1">Otentikasi Admin</h2>
          <small class="text-muted">Gunakan kredensial terverifikasi untuk mengelola sistem</small>
        </div>

        <!-- Alert Error -->
        <div v-if="errorMessage" class="alert alert-danger py-2 px-3 small border-danger-subtle d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-exclamation-octagon-fill text-danger flex-shrink-0"></i>
          <div>{{ errorMessage }}</div>
        </div>

        <form @submit.prevent="handleLogin">
          <!-- Username -->
          <div class="mb-3">
            <label for="adminUsername" class="form-label fw-semibold text-secondary small mb-1">
              Username Admin
            </label>
            <div class="input-group">
              <span class="input-group-text bg-light text-muted border-end-0">
                <i class="bi bi-person"></i>
              </span>
              <input 
                id="adminUsername"
                v-model="username" 
                type="text" 
                class="form-control border-start-0 ps-0" 
                placeholder="admin"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label for="adminPassword" class="form-label fw-semibold text-secondary small mb-1">
              Kata Sandi (Password)
            </label>
            <div class="input-group">
              <span class="input-group-text bg-light text-muted border-end-0">
                <i class="bi bi-key"></i>
              </span>
              <input 
                id="adminPassword"
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                class="form-control border-start-0 border-end-0 ps-0" 
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <button 
                type="button" 
                class="btn btn-light border border-start-0 text-muted" 
                @click="showPassword = !showPassword"
              >
                <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
            :disabled="isLoading"
            style="background-color: #1d4ed8; border-color: #1d4ed8;"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
            <i v-else class="bi bi-box-arrow-in-right"></i>
            <span>{{ isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard' }}</span>
          </button>
        </form>

        <!-- Hint Akun Default -->
        <div class="mt-4 pt-3 border-top text-center">
          <small class="text-muted d-block mb-2">
            Akun Default Panitia: <strong>admin</strong> · Kata Sandi: <strong>admin123</strong>
          </small>
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm py-1 px-3"
            @click="fillDefaultAdmin"
          >
            <i class="bi bi-box-arrow-in-right me-1"></i>Isi Akun Default (admin / admin123)
          </button>
        </div>
      </div>

      <!-- Kembali ke Portal Siswa -->
      <div class="text-center mt-4">
        <router-link to="/" class="text-white-50 text-decoration-none small">
          <i class="bi bi-arrow-left me-1"></i>Kembali ke Portal Pemilih Siswa
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from '../../services/auth';
import { dbService } from '../../services/db';
import type { Pengaturan } from '../../types';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const router = useRouter();
const route = useRoute();
const username = ref('admin');
const password = ref('admin123');
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

function fillDefaultAdmin() {
  username.value = 'admin';
  password.value = 'admin123';
  errorMessage.value = '';
}

async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const res = await authService.loginAdmin(username.value, password.value);
    if (!res.success) {
      errorMessage.value = res.message;
      return;
    }
    const destination = (route.query.redirect as string) || '/admin/beranda';
    router.push(destination);
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal melakukan otentikasi admin.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  settings.value = await dbService.getPengaturan();
});
</script>
