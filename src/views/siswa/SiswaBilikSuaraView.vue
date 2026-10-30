<template>
  <div class="min-vh-100 bg-light d-flex flex-column">
    <!-- Header Bar Bilik Suara -->
    <header class="bg-white border-bottom sticky-top py-2 px-3 px-md-4 shadow-sm">
      <div class="container-xl d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <img 
            :src="settings.logo_sekolah || defaultLogo" 
            alt="Logo Sekolah" 
            class="rounded"
            style="width: 36px; height: 36px; object-fit: contain;"
          />
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-dark fs-6 lh-1">Bilik Suara Digital eOSIS</span>
              <span class="badge bg-primary text-white font-mono-numbers small">No. DPT: {{ siswaSession?.nisn }}</span>
            </div>
            <small class="text-muted" style="font-size: 0.75rem;">
              Pemilih: <strong>{{ siswaSession?.nama }}</strong> ({{ siswaSession?.kelas_nama }})
            </small>
          </div>
        </div>

        <router-link to="/siswa/dashboard" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <i class="bi bi-arrow-left"></i>
          <span>Kembali</span>
        </router-link>
      </div>
    </header>

    <!-- Main Content Area: Daftar Calon Kandidat -->
    <main class="container-xl my-4 my-md-5 flex-grow-1">
      <!-- Banner Instruksi -->
      <div class="text-center mb-4">
        <h1 class="h3 fw-extrabold text-dark tracking-tight mb-2">
          Surat Suara Pemilihan Ketua & Wakil Ketua OSIS
        </h1>
        <p class="text-muted small mx-auto mb-0" style="max-width: 650px;">
          Silakan pelajari visi, misi, dan program kerja masing-masing calon kandidat di bawah ini. Tentukan pilihan terbaikmu lalu tekan tombol <strong>"PILIH PASLON INI"</strong>.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingCandidates" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted small mt-2">Memuat daftar calon kandidat...</p>
      </div>

      <!-- Candidates Grid -->
      <div v-else class="row g-4 justify-content-center">
        <div 
          v-for="kandidat in kandidatList" 
          :key="kandidat.id" 
          class="col-12 col-md-6 col-lg-4"
        >
          <div class="candidate-card h-100 d-flex flex-column position-relative shadow-sm">
            <!-- Badge Nomor Urut -->
            <div class="candidate-number-badge">
              {{ kandidat.nomor_urut }}
            </div>

            <!-- Foto Kandidat -->
            <div class="position-relative bg-dark" style="height: 290px; overflow: hidden;">
              <img 
                :src="kandidat.foto_url || defaultPhoto" 
                :alt="`Paslon No. ${kandidat.nomor_urut} ${kandidat.nama_ketua}`"
                class="w-100 h-100 object-fit-cover"
                referrerpolicy="no-referrer"
              />
              <div class="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient" style="background: linear-gradient(to top, rgba(15,30,54,0.92) 0%, rgba(15,30,54,0.3) 70%, transparent 100%);">
                <span class="text-white-50 text-uppercase fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                  Pasangan Calon Nomor {{ kandidat.nomor_urut }}
                </span>
                <h2 class="h5 text-white fw-bold mb-0 text-truncate">
                  {{ kandidat.nama_ketua }}
                </h2>
                <div class="text-white-50 small text-truncate">
                  & {{ kandidat.nama_wakil }}
                </div>
              </div>
            </div>

            <!-- Detail Isi Kartu -->
            <div class="p-3 p-md-4 flex-grow-1 d-flex flex-column justify-content-between">
              <div>
                <!-- Slogan -->
                <div v-if="kandidat.slogan" class="p-2 rounded bg-light border text-center mb-3">
                  <small class="text-secondary fst-italic">"{{ kandidat.slogan }}"</small>
                </div>

                <!-- Cuplikan Visi -->
                <div class="mb-3">
                  <strong class="d-block text-dark small mb-1 fw-bold">Visi Utama:</strong>
                  <p class="text-muted small mb-0 lh-sm line-clamp-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    {{ kandidat.visi }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-3 border-top d-flex flex-column gap-2">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                  @click="openDetailModal(kandidat)"
                >
                  <i class="bi bi-file-earmark-text"></i>
                  <span>Lihat Visi & Misi Lengkap</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-eosis w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  @click="initiateVote(kandidat)"
                >
                  <i class="bi bi-check2-circle fs-5"></i>
                  <span>PILIH PASLON {{ kandidat.nomor_urut }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL 1: LIHAT DETAIL VISI & MISI -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showDetailModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.65);"
      v-if="showDetailModal && selectedKandidat"
    >
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-light border-bottom">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-dark fs-6">{{ selectedKandidat.nomor_urut }}</span>
              <div>
                <h5 class="modal-title fw-bold text-dark fs-6 mb-0">
                  {{ selectedKandidat.nama_ketua }} & {{ selectedKandidat.nama_wakil }}
                </h5>
                <small class="text-muted">Profil Calon Pemimpin OSIS</small>
              </div>
            </div>
            <button type="button" class="btn-close" @click="showDetailModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="text-center mb-3">
              <img 
                :src="selectedKandidat.foto_url || defaultPhoto" 
                class="rounded shadow-sm"
                style="max-height: 200px; width: auto; object-fit: cover;"
              />
              <p class="fst-italic text-muted small mt-2 mb-0">"{{ selectedKandidat.slogan }}"</p>
            </div>

            <div class="mb-3">
              <h6 class="fw-bold text-primary border-bottom pb-1 mb-2">Visi</h6>
              <p class="text-secondary small">{{ selectedKandidat.visi }}</p>
            </div>

            <div class="mb-3">
              <h6 class="fw-bold text-primary border-bottom pb-1 mb-2">Misi & Program</h6>
              <div class="text-secondary small" style="white-space: pre-line;">
                {{ selectedKandidat.misi }}
              </div>
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-secondary btn-sm" @click="showDetailModal = false">
              Tutup
            </button>
            <button type="button" class="btn btn-eosis btn-sm" @click="confirmFromDetail">
              Pilih Paslon Ini
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: KONFIRMASI PILIHAN (SEBELUM SUARA DISIMPAN) -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showConfirmModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.75);"
      v-if="showConfirmModal && pendingKandidat"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-body text-center p-4 p-md-5">
            <div class="rounded-circle bg-primary-subtle text-primary d-inline-flex p-3 mb-3">
              <i class="bi bi-shield-lock-fill display-5"></i>
            </div>
            <h4 class="fw-extrabold text-dark mb-2">Konfirmasi Pilihan Suara</h4>
            <p class="text-muted small mb-4">
              Apakah Anda yakin ingin memberikan suara Anda kepada:
            </p>

            <!-- Box Kandidat Pilihan -->
            <div class="p-3 rounded-3 bg-light border mb-4 text-center">
              <span class="badge bg-primary fs-6 px-3 py-1 mb-2 font-mono-numbers">
                PASLON NOMOR URUT {{ pendingKandidat.nomor_urut }}
              </span>
              <h5 class="fw-bold text-dark mb-1">
                {{ pendingKandidat.nama_ketua }}
              </h5>
              <div class="text-muted small">
                Wakil: {{ pendingKandidat.nama_wakil }}
              </div>
            </div>

            <div class="alert alert-warning py-2 px-3 small border-warning-subtle text-start mb-4">
              <i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>
              <strong>PENTING:</strong> Sesuai asas LUBER JURDIL, suara bersifat <strong>RAHASIA & FINAL</strong>. Setelah disimpan, pilihan Anda tidak dapat dibatalkan atau diubah.
            </div>

            <!-- Error message if submission fails -->
            <div v-if="voteErrorMessage" class="alert alert-danger py-2 px-3 small border-danger-subtle mb-3">
              {{ voteErrorMessage }}
            </div>

            <!-- Tombol Konfirmasi -->
            <div class="d-flex gap-2 justify-content-center">
              <button 
                type="button" 
                class="btn btn-outline-secondary px-4 py-2"
                :disabled="isSubmittingVote"
                @click="showConfirmModal = false"
              >
                Batal / Periksa Kembali
              </button>
              <button 
                type="button" 
                class="btn btn-primary px-4 py-2 fw-bold d-flex align-items-center gap-2"
                :disabled="isSubmittingVote"
                @click="submitVote"
                style="background-color: #1d4ed8;"
              >
                <span v-if="isSubmittingVote" class="spinner-border spinner-border-sm" role="status"></span>
                <span>{{ isSubmittingVote ? 'Menyimpan Suara...' : 'Ya, Simpan Pilihan Saya' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: SUKSES (4 DETIK COUNTDOWN & AUTO LOGOUT) -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showSuccessModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.85); z-index: 1060;"
      v-if="showSuccessModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg text-center p-4 p-md-5">
          <div class="text-success mb-3">
            <i class="bi bi-patch-check-fill display-2"></i>
          </div>
          
          <!-- Pesan Resmi Sesuai Brief: "Suara Anda berhasil dicatat, terima kasih telah berpartisipasi" -->
          <h3 class="h4 fw-extrabold text-dark mb-2">
            Suara Anda berhasil dicatat, terima kasih telah berpartisipasi
          </h3>

          <p class="text-muted small mb-4">
            Hak suara atas nama <strong>{{ siswaSession?.nama }}</strong> telah berhasil diverifikasi dan disimpan ke tabulasi rekapitulasi secara rahasia.
          </p>

          <!-- Countdown 4 Detik Indicator -->
          <div class="p-3 rounded-pill bg-light border d-inline-flex align-items-center justify-content-center gap-2 mx-auto mb-2 px-4">
            <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
            <span class="text-muted small">
              Otomatis kembali ke halaman login dalam 
              <strong class="text-primary font-mono-numbers fs-5">{{ countdownSeconds }}</strong> detik...
            </span>
          </div>

          <div class="mt-3">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="forceImmediateLogout">
              Kembali ke Login Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import confetti from 'canvas-confetti';
import { authService, SiswaSession } from '../../services/auth';
import { dbService } from '../../services/db';
import type { Kandidat, Pengaturan } from '../../types';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';
const defaultPhoto = '/src/assets/images/kandidat_paslon_1_1793253208173.jpg';

const router = useRouter();
const siswaSession = ref<SiswaSession | null>(null);
const kandidatList = ref<Kandidat[]>([]);
const isLoadingCandidates = ref(true);

const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

// Modals state
const showDetailModal = ref(false);
const selectedKandidat = ref<Kandidat | null>(null);

const showConfirmModal = ref(false);
const pendingKandidat = ref<Kandidat | null>(null);
const isSubmittingVote = ref(false);
const voteErrorMessage = ref('');

// Success countdown state
const showSuccessModal = ref(false);
const countdownSeconds = ref(4);
let countdownTimer: any = null;

async function loadData() {
  siswaSession.value = await authService.refreshSiswaSession();

  // Guard: Jika siswa ternyata sudah memilih, lempar ke dashboard
  if (siswaSession.value?.sudah_memilih) {
    router.replace('/siswa/dashboard');
    return;
  }

  settings.value = await dbService.getPengaturan();
  kandidatList.value = await dbService.getKandidatList();
  isLoadingCandidates.value = false;
}

function openDetailModal(kandidat: Kandidat) {
  selectedKandidat.value = kandidat;
  showDetailModal.value = true;
}

function confirmFromDetail() {
  if (selectedKandidat.value) {
    showDetailModal.value = false;
    initiateVote(selectedKandidat.value);
  }
}

function initiateVote(kandidat: Kandidat) {
  pendingKandidat.value = kandidat;
  voteErrorMessage.value = '';
  showConfirmModal.value = true;
}

async function submitVote() {
  if (!siswaSession.value || !pendingKandidat.value) return;

  isSubmittingVote.value = true;
  voteErrorMessage.value = '';

  try {
    const res = await dbService.castVote(
      siswaSession.value.nisn,
      siswaSession.value.tanggal_lahir,
      pendingKandidat.value.id
    );

    if (!res.success) {
      voteErrorMessage.value = res.message;
      isSubmittingVote.value = false;
      return;
    }

    // Suara berhasil dicatat!
    showConfirmModal.value = false;
    showSuccessModal.value = true;
    countdownSeconds.value = 4;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    // Hitung mundur 4 detik lalu otomatis kembali ke halaman login siswa & hapus session pemilih
    countdownTimer = setInterval(() => {
      countdownSeconds.value--;
      if (countdownSeconds.value <= 0) {
        clearInterval(countdownTimer);
        forceImmediateLogout();
      }
    }, 1000);

  } catch (err: any) {
    voteErrorMessage.value = err.message || 'Terjadi kesalahan sistem saat menyimpan suara.';
  } finally {
    isSubmittingVote.value = false;
  }
}

function forceImmediateLogout() {
  if (countdownTimer) clearInterval(countdownTimer);
  authService.logoutSiswa();
  router.replace('/');
}

onMounted(() => {
  loadData();
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>
