<template>
  <div class="min-vh-100 bg-light d-flex flex-column">
    <!-- Student Header Bar -->
    <header class="bg-white border-bottom sticky-top py-2 px-3 px-md-4 shadow-sm">
      <div class="container-md d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <img 
            :src="settings.logo_sekolah || defaultLogo" 
            alt="Logo Sekolah" 
            class="rounded"
            style="width: 36px; height: 36px; object-fit: contain;"
          />
          <div>
            <span class="fw-bold text-dark fs-6 d-block lh-1">eOSIS SPENDA</span>
            <small class="text-muted d-none d-sm-block" style="font-size: 0.75rem;">
              {{ settings.nama_sekolah }} · Periode {{ settings.periode_pemilihan }}
            </small>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button 
            type="button" 
            class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            @click="handleLogout"
          >
            <i class="bi bi-box-arrow-right"></i>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container-md my-4 my-md-5 flex-grow-1" style="max-width: 820px;">
      
      <!-- HITUNG MUNDUR JELANG WAKTU PEMILIHAN -->
      <div class="mb-4">
        <ElectionCountdown 
          :start-time="settings.waktu_mulai" 
          :end-time="settings.waktu_selesai" 
          :voting-dibuka="settings.voting_dibuka"
        />
      </div>

      <!-- Alert Voting Tutup jika voting ditutup -->
      <div v-if="!settings.voting_dibuka" class="alert alert-warning border-warning-subtle d-flex align-items-center gap-2 mb-4" role="alert">
        <i class="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
        <div>
          <strong>Perhatian:</strong> Pemilihan OSIS saat ini berstatus <strong>DITUTUP</strong> oleh panitia. Anda hanya dapat melihat data biodata pemilih.
        </div>
      </div>

      <!-- Card Biodata Siswa -->
      <div class="card card-clean border-0 shadow-sm p-4 p-md-5 mb-4 bg-white">
        <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 border-bottom pb-4 mb-4">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; font-size: 1.5rem;">
              <i class="bi bi-person-circle"></i>
            </div>
            <div>
              <span class="text-muted small text-uppercase fw-semibold tracking-wider d-block">Biodata Pemilih Terdaftar</span>
              <h2 class="h4 fw-bold text-dark mb-0">{{ siswaSession?.nama || 'Siswa SMPN 2' }}</h2>
            </div>
          </div>

          <!-- Status Badge -->
          <div>
            <span 
              v-if="siswaSession?.sudah_memilih" 
              class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 fs-6 d-inline-flex align-items-center gap-2"
            >
              <i class="bi bi-check-all text-secondary"></i>
              <span>Hak Suara Terpakai</span>
            </span>
            <span 
              v-else 
              class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6 d-inline-flex align-items-center gap-2"
            >
              <i class="bi bi-patch-check-fill text-success"></i>
              <span>Hak Suara Aktif</span>
            </span>
          </div>
        </div>

        <!-- Detail Grid Biodata -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="p-3 rounded bg-light border">
              <span class="text-muted d-block small mb-1">Nomor Induk (NISN)</span>
              <span class="fw-bold font-mono-numbers text-dark">{{ siswaSession?.nisn }}</span>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="p-3 rounded bg-light border">
              <span class="text-muted d-block small mb-1">Kelas</span>
              <span class="fw-bold text-dark">{{ siswaSession?.kelas_nama || 'Kelas' }}</span>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="p-3 rounded bg-light border">
              <span class="text-muted d-block small mb-1">Tanggal Lahir</span>
              <span class="fw-semibold text-dark">{{ formatDate(siswaSession?.tanggal_lahir) }}</span>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="p-3 rounded bg-light border">
              <span class="text-muted d-block small mb-1">Status Partisipasi</span>
              <span 
                class="fw-bold" 
                :class="siswaSession?.sudah_memilih ? 'text-secondary' : 'text-success'"
              >
                {{ siswaSession?.sudah_memilih ? 'Sudah Memilih' : 'Belum Memilih' }}
              </span>
            </div>
          </div>
        </div>

        <!-- KONDISI 1: JIKA BELUM MEMILIH -->
        <div v-if="!siswaSession?.sudah_memilih" class="p-4 rounded-3 border border-primary-subtle bg-primary-subtle bg-opacity-25">
          <div class="row align-items-center">
            <div class="col-md-8 mb-3 mb-md-0">
              <div class="d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-shield-check text-primary fs-5"></i>
                <h3 class="h5 fw-bold text-primary mb-0">Hak Suara Tersedia</h3>
              </div>
              <p class="text-secondary small mb-0">
                Anda memiliki <strong>1 (satu) hak suara</strong> yang sah untuk memilih Calon Ketua dan Wakil Ketua OSIS SMP Negeri 2 Kota Bogor periode {{ settings.periode_pemilihan }}. Gunakan hak suara Anda dengan cermat dan bijak.
              </p>
            </div>
            <div class="col-md-4 text-md-end">
              <!-- Tombol Berikan Suara (HANYA MUNCUL JIKA BELUM MEMILIH) -->
              <button 
                type="button" 
                class="btn btn-primary btn-lg w-100 shadow-sm fw-bold d-inline-flex align-items-center justify-content-center gap-2"
                :disabled="!settings.voting_dibuka"
                @click="goToBilikSuara"
                style="background-color: #1d4ed8; border-color: #1d4ed8; padding: 0.85rem 1.5rem;"
              >
                <i class="bi bi-envelope-paper-heart-fill"></i>
                <span>Berikan Suara</span>
              </button>
            </div>
          </div>
        </div>

        <!-- KONDISI 2: JIKA SUDAH MEMILIH (JANGAN TAMPILKAN TOMBOL BERIKAN SUARA) -->
        <div v-else class="p-4 rounded-3 border border-secondary-subtle bg-light text-center">
          <div class="text-success mb-2">
            <i class="bi bi-check-circle-fill display-5"></i>
          </div>
          <h3 class="h4 fw-bold text-dark mb-2">Anda sudah menggunakan hak suara</h3>
          <p class="text-muted small mx-auto mb-3" style="max-width: 520px;">
            Terima kasih atas partisipasi aktif Anda dalam Pemilihan OSIS SMP Negeri 2 Kota Bogor.
            Sesuai asas LUBER JURDIL, suara Anda telah dicatat secara anonim dan rahasia ke dalam sistem. Setiap siswa hanya dapat memberikan suara sebanyak 1 (satu) kali.
          </p>
          <div class="d-inline-flex gap-2 mb-4">
            <button type="button" class="btn btn-outline-secondary btn-sm px-4" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-1"></i>Selesai & Keluar
            </button>
          </div>

          <!-- Real-Time Quick Count untuk pemilih yang sudah memberikan suara -->
          <div v-if="settings.quick_count_publik !== false" class="text-start border-top pt-4">
            <QuickCountWidget />
          </div>
        </div>

      </div>

      <!-- Informasi Asas Pemilihan OSIS -->
      <div class="card card-clean border-0 p-4 bg-white">
        <h4 class="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-info-circle text-primary"></i>
          <span>Asas Pemilihan OSIS SMP Negeri 2 Kota Bogor</span>
        </h4>
        <div class="row g-3 text-muted small">
          <div class="col-6 col-md-4">
            <strong class="d-block text-dark">1. Langsung</strong>
            <span>Pemilih memberikan suaranya secara langsung tanpa perantara.</span>
          </div>
          <div class="col-6 col-md-4">
            <strong class="d-block text-dark">2. Rahasia</strong>
            <span>Pilihan kandidat dijamin anonim dan tidak dapat dilihat siapapun.</span>
          </div>
          <div class="col-6 col-md-4">
            <strong class="d-block text-dark">3. Adil & Sah</strong>
            <span>Setiap siswa hanya berhak 1 suara yang divalidasi oleh sistem.</span>
          </div>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="bg-white border-top py-3 text-center text-muted small mt-auto">
      <span>&copy; {{ new Date().getFullYear() }} {{ settings.nama_sekolah }} · Aplikasi eOSIS Terpadu</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService, SiswaSession } from '../../services/auth';
import { dbService } from '../../services/db';
import type { Pengaturan } from '../../types';
import ElectionCountdown from '../../components/ElectionCountdown.vue';
import QuickCountWidget from '../../components/QuickCountWidget.vue';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const router = useRouter();
const siswaSession = ref<SiswaSession | null>(null);
const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

async function loadData() {
  const session = await authService.refreshSiswaSession();
  siswaSession.value = session;
  settings.value = await dbService.getPengaturan();
}

function goToBilikSuara() {
  if (!siswaSession.value?.sudah_memilih && settings.value.voting_dibuka) {
    router.push('/siswa/bilik-suara');
  }
}

function handleLogout() {
  authService.logoutSiswa();
  router.push('/');
}

onMounted(() => {
  loadData();
});
</script>
