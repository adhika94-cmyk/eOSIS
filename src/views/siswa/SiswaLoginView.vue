<template>
  <div class="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3" style="background: linear-gradient(135deg, #0f1e36 0%, #1e293b 100%);">
    <div class="w-100" style="max-width: 460px;">
      
      <!-- School Brand Header -->
      <div class="text-center mb-4">
        <div class="d-inline-flex p-3 rounded-circle bg-white shadow-lg mb-3">
          <img 
            :src="settings.logo_sekolah || defaultLogo" 
            alt="Logo SMPN 2 Kota Bogor" 
            style="width: 72px; height: 72px; object-fit: contain;"
          />
        </div>
        <h1 class="h3 fw-extrabold mb-1 tracking-tight" style="color: #60f528;">eOSIS SPENDA</h1>
        <p class="text-white-50 mb-1 fw-medium" style="font-size: 0.95rem;">
          {{ settings.nama_sekolah }}
        </p>
        <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 text-white-50 small mt-1">
          <span>Periode {{ settings.periode_pemilihan }}</span>
          <span>·</span>
          <span :class="settings.voting_dibuka ? 'text-success fw-semibold' : 'text-danger fw-semibold'">
            {{ settings.voting_dibuka ? 'Pemilihan Dibuka' : 'Pemilihan Ditutup' }}
          </span>
        </div>
      </div>

      <!-- HITUNG MUNDUR JELANG WAKTU PEMILIHAN -->
      <div class="mb-4">
        <ElectionCountdown 
          :start-time="settings.waktu_mulai" 
          :end-time="settings.waktu_selesai" 
          :voting-dibuka="settings.voting_dibuka"
        />
      </div>

      <!-- Login Card -->
      <div class="card card-clean border-0 shadow-lg p-4 p-sm-5" style="background-color: #f5f011;">
        <VoterAuthForm @success="onLoginSuccess" />
      </div>

      <!-- Live Quick Count Trigger -->
      <div v-if="settings.quick_count_publik !== false" class="text-center mt-3">
        <button 
          type="button" 
          class="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
          @click="showQuickCountModal = true"
        >
          <span class="live-dot-pulse"></span>
          <i class="bi bi-bar-chart-fill text-warning"></i>
          <span>Pantau Live Quick Count Hasil Pemilihan</span>
        </button>
      </div>

      <!-- Footer Info & Admin Portal Link -->
      <div class="text-center mt-3">
        <router-link to="/admin/login" class="text-decoration-none small hover-underline" style="color: #f2eaea; font-weight: bold;">
          <i class="bi bi-shield-lock me-1"></i>Login Administrator eOSIS
        </router-link>
      </div>

    </div>

    <!-- Modal Live Quick Count Hasil Pemilihan -->
    <div 
      v-if="showQuickCountModal" 
      class="modal show d-block" 
      tabindex="-1" 
      style="background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); z-index: 1055;"
      @click.self="showQuickCountModal = false"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-dark text-white border-bottom-0 py-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger text-white d-inline-flex align-items-center gap-1">
                <i class="bi bi-broadcast"></i> REAL-TIME
              </span>
              <h5 class="modal-title h6 fw-bold mb-0">Quick Count Pemilihan OSIS {{ settings.nama_sekolah }}</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" @click="showQuickCountModal = false"></button>
          </div>
          <div class="modal-body p-0">
            <QuickCountWidget />
          </div>
          <div class="modal-footer bg-light py-2">
            <button type="button" class="btn btn-secondary btn-sm" @click="showQuickCountModal = false">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dbService } from '../../services/db';
import type { Pengaturan, Siswa } from '../../types';
import ElectionCountdown from '../../components/ElectionCountdown.vue';
import QuickCountWidget from '../../components/QuickCountWidget.vue';
import VoterAuthForm from '../../components/VoterAuthForm.vue';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const router = useRouter();
const showQuickCountModal = ref(false);

const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

function onLoginSuccess(siswa: Siswa) {
  console.log('Login success for:', siswa.nama);
  router.push('/siswa/dashboard');
}

onMounted(async () => {
  settings.value = await dbService.getPengaturan();
});
</script>

<style scoped>
.hover-underline:hover {
  text-decoration: underline !important;
  color: #ffffff !important;
}

.live-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
  display: inline-block;
  box-shadow: 0 0 0 rgba(239, 68, 68, 0.6);
  animation: pulse-ring 1.8s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
