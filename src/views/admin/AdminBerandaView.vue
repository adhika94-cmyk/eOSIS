<template>
  <div class="space-y-4">
    <!-- Header Page Title -->
    <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="h4 fw-bold text-dark mb-1">Beranda Administrator</h1>
        <p class="text-muted small mb-0">
          Ringkasan statistik real-time pelaksanaan e-Voting OSIS {{ settings.nama_sekolah }}
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="refreshData">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Segarkan Data</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openQuickAddSiswaModal" style="background-color: #1d4ed8;">
          <i class="bi bi-person-plus-fill"></i>
          <span>Tambah Pemilih</span>
        </button>
        <router-link to="/admin/perolehan-suara" class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
          <i class="bi bi-file-earmark-pdf-fill"></i>
          <span>Ekspor Rekapitulasi (PDF/Excel)</span>
        </router-link>
        <router-link to="/admin/perolehan-suara" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
          <i class="bi bi-bar-chart-line"></i>
          <span>Lihat Perolehan Suara</span>
        </router-link>
      </div>
    </div>

    <!-- Alert Success / Info -->
    <div v-if="alertMessage" class="alert alert-success alert-dismissible fade show small py-2 px-3 border-success-subtle mb-3" role="alert">
      <i class="bi bi-check-circle-fill me-1"></i>
      <span>{{ alertMessage }}</span>
      <button type="button" class="btn-close py-2" @click="alertMessage = ''"></button>
    </div>

    <!-- COUNTDOWN JELANG WAKTU PEMILIHAN -->
    <div class="mb-4">
      <ElectionCountdown 
        :start-time="settings.waktu_mulai" 
        :end-time="settings.waktu_selesai" 
        :voting-dibuka="settings.voting_dibuka"
      />
    </div>

    <!-- 6 KPI STATISTIC CARDS -->
    <div class="row g-3 mb-4">
      <!-- 1. Total Siswa (DPT) -->
      <div class="col-12 col-sm-6 col-xl-2">
        <div class="card card-clean p-3 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-medium">Total Pemilih (DPT)</span>
            <span class="p-2 rounded bg-primary-subtle text-primary">
              <i class="bi bi-people-fill"></i>
            </span>
          </div>
          <div class="h3 fw-bold text-dark font-mono-numbers mb-0">{{ stats.totalSiswa }}</div>
          <div class="d-flex gap-2 mt-1" style="font-size: 0.7rem;">
            <span class="text-muted">S: <strong>{{ stats.totalSiswaOnly || 0 }}</strong></span>
            <span class="text-muted">G: <strong>{{ stats.totalGuru || 0 }}</strong></span>
          </div>
        </div>
      </div>

      <!-- 2. Total Kelas -->
      <div class="col-12 col-sm-6 col-xl-2">
        <div class="card card-clean p-3 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-medium">Total Kelas</span>
            <span class="p-2 rounded bg-info-subtle text-info">
              <i class="bi bi-buildings-fill"></i>
            </span>
          </div>
          <div class="h3 fw-bold text-dark font-mono-numbers mb-0">{{ stats.totalKelas }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">Tingkat 7, 8, 9</small>
        </div>
      </div>

      <!-- 3. Total Kandidat -->
      <div class="col-12 col-sm-6 col-xl-2">
        <div class="card card-clean p-3 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-medium">Kandidat Paslon</span>
            <span class="p-2 rounded bg-warning-subtle text-warning">
              <i class="bi bi-person-badge-fill"></i>
            </span>
          </div>
          <div class="h3 fw-bold text-dark font-mono-numbers mb-0">{{ stats.totalKandidat }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">Pasangan calon</small>
        </div>
      </div>

      <!-- 4. Siswa Sudah Memilih -->
      <div class="col-12 col-sm-6 col-xl-2">
        <div class="card card-clean p-3 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-medium">Sudah Memilih</span>
            <span class="p-2 rounded bg-success-subtle text-success">
              <i class="bi bi-check2-circle"></i>
            </span>
          </div>
          <div class="h3 fw-bold text-success font-mono-numbers mb-0">{{ stats.sudahMemilih }}</div>
          <div class="d-flex gap-2 mt-1" style="font-size: 0.7rem;">
            <span class="text-success">S: <strong>{{ stats.siswaSudahMemilih || 0 }}</strong></span>
            <span class="text-success">G: <strong>{{ stats.guruSudahMemilih || 0 }}</strong></span>
          </div>
        </div>
      </div>

      <!-- 5. Siswa Belum Memilih -->
      <div class="col-12 col-sm-6 col-xl-2">
        <div class="card card-clean p-3 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-muted small fw-medium">Belum Memilih</span>
            <span class="p-2 rounded bg-danger-subtle text-danger">
              <i class="bi bi-clock-history"></i>
            </span>
          </div>
          <div class="h3 fw-bold text-danger font-mono-numbers mb-0">{{ stats.belumMemilih }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">Hak suara tersisa</small>
        </div>
      </div>

      <!-- 6. Persentase Partisipasi -->
      <div class="col-12 col-sm-6 col-xl-2">
        <div class="card card-clean p-3 h-100 bg-primary-subtle bg-opacity-25 border-primary-subtle">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-primary small fw-semibold">Partisipasi</span>
            <span class="p-2 rounded bg-primary text-white">
              <i class="bi bi-pie-chart-fill"></i>
            </span>
          </div>
          <div class="h3 fw-bold text-primary font-mono-numbers mb-0">{{ stats.persentasePartisipasi }}%</div>
          <small class="text-muted" style="font-size: 0.75rem;">Dari total DPT</small>
        </div>
      </div>
    </div>

    <!-- SECTION PROGRESS PARTISIPASI -->
    <div class="card card-clean p-4 mb-4">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <div>
          <h2 class="h6 fw-bold text-dark mb-1">Tingkat Partisipasi Pemilih</h2>
          <small class="text-muted">
            Sebanyak <strong>{{ stats.sudahMemilih }}</strong> dari <strong>{{ stats.totalSiswa }}</strong> pemilih telah menggunakan hak pilihnya
          (Siswa: {{ stats.siswaSudahMemilih }}/{{ stats.totalSiswaOnly }} · Guru: {{ stats.guruSudahMemilih }}/{{ stats.totalGuru }})
          </small>
        </div>
        <div class="h5 fw-bold text-primary font-mono-numbers mb-0">
          {{ stats.persentasePartisipasi }}% Tercapai
        </div>
      </div>

      <div class="progress" style="height: 14px; border-radius: 7px; background-color: #e2e8f0;">
        <div 
          class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
          role="progressbar" 
          :style="{ width: `${stats.persentasePartisipasi}%` }"
          :aria-valuenow="stats.persentasePartisipasi" 
          aria-valuemin="0" 
          aria-valuemax="100"
        ></div>
      </div>
    </div>

    <!-- REAL-TIME QUICK COUNT HASIL PEMILIHAN -->
    <QuickCountWidget class="mb-4" />

    <!-- SECTION QUICK CANDIDATES SUMMARY -->
    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div class="card card-clean p-4 h-100">
          <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h2 class="h6 fw-bold text-dark mb-1">Perolehan Suara Sementara</h2>
              <small class="text-muted">Total Suara Masuk Terverifikasi: <strong>{{ stats.totalSuaraMasuk }} suara</strong></small>
            </div>
            <router-link to="/admin/perolehan-suara" class="btn btn-outline-primary btn-sm">
              Lihat Grafik Lengkap
            </router-link>
          </div>

          <div class="d-flex flex-column gap-3">
            <div 
              v-for="kandidat in kandidatList" 
              :key="kandidat.id"
              class="p-3 rounded border bg-light d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
            >
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle bg-dark text-white fw-bold d-flex align-items-center justify-content-center" style="width: 42px; height: 42px; font-size: 1.1rem;">
                  {{ kandidat.nomor_urut }}
                </div>
                <div>
                  <h3 class="fs-6 fw-bold text-dark mb-0">
                    {{ kandidat.nama_ketua }} & {{ kandidat.nama_wakil }}
                  </h3>
                  <small class="text-muted text-truncate d-block" style="max-width: 320px;">
                    "{{ kandidat.slogan }}"
                  </small>
                </div>
              </div>

              <div class="text-sm-end">
                <div class="h5 fw-bold text-dark font-mono-numbers mb-0">
                  {{ kandidat.total_suara }} suara
                </div>
                <small class="text-muted font-mono-numbers">
                  {{ calculatePercentage(kandidat.total_suara) }}%
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Shortcuts -->
      <div class="col-12 col-lg-4">
        <div class="card card-clean p-4 h-100">
          <h2 class="h6 fw-bold text-dark mb-3 border-bottom pb-2">Aksi Cepat Panitia</h2>

          <div class="d-flex flex-column gap-2">
            <router-link to="/admin/siswa" class="btn btn-light text-start border p-3 d-flex align-items-center gap-3">
              <i class="bi bi-person-plus text-primary fs-5"></i>
              <div>
                <strong class="d-block text-dark small">Kelola Data Siswa & DPT</strong>
                <small class="text-muted">Tambah siswa, import file CSV, reset hak suara</small>
              </div>
            </router-link>

            <router-link to="/admin/kelas" class="btn btn-light text-start border p-3 d-flex align-items-center gap-3">
              <i class="bi bi-buildings text-info fs-5"></i>
              <div>
                <strong class="d-block text-dark small">Kelola Kelas</strong>
                <small class="text-muted">Atur kelas VII, VIII, IX dan wali kelas</small>
              </div>
            </router-link>

            <router-link to="/admin/kandidat" class="btn btn-light text-start border p-3 d-flex align-items-center gap-3">
              <i class="bi bi-person-badge text-warning fs-5"></i>
              <div>
                <strong class="d-block text-dark small">Kelola Calon Kandidat</strong>
                <small class="text-muted">Edit visi, misi, foto dan nomor urut paslon</small>
              </div>
            </router-link>

            <router-link to="/admin/perolehan-suara" class="btn btn-light text-start border p-3 d-flex align-items-center gap-3">
              <i class="bi bi-file-earmark-spreadsheet-fill text-success fs-5"></i>
              <div>
                <strong class="d-block text-dark small">Ekspor Rekapitulasi (PDF & Excel)</strong>
                <small class="text-muted">Unduh arsip formal & cetak Berita Acara resmi</small>
              </div>
            </router-link>

            <router-link to="/admin/pengaturan" class="btn btn-light text-start border p-3 d-flex align-items-center gap-3">
              <i class="bi bi-sliders text-secondary fs-5"></i>
              <div>
                <strong class="d-block text-dark small">Pengaturan & Supabase</strong>
                <small class="text-muted">Buka/tutup voting, logo sekolah, kredensial</small>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL TAMBAH SISWA CEPAT DENGAN KELAS TUJUAN -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showQuickAddModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showQuickAddModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <div>
              <h5 class="modal-title fw-bold text-dark fs-6 mb-0">
                <i class="bi bi-person-plus-fill me-1 text-primary"></i>Tambah Siswa ke DPT
              </h5>
              <small class="text-muted" style="font-size: 0.75rem;">
                Daftarkan siswa baru ke DPT SMP Negeri 2 Kota Bogor
              </small>
            </div>
            <button type="button" class="btn-close" @click="showQuickAddModal = false"></button>
          </div>
          <form @submit.prevent="saveQuickSiswa(false)">
            <div class="modal-body p-4">
              <div v-if="formError" class="alert alert-danger py-2 small mb-3">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ formError }}
              </div>
              <div v-if="formSuccessMessage" class="alert alert-success py-2 small mb-3">
                <i class="bi bi-check-circle-fill me-1"></i>{{ formSuccessMessage }}
              </div>

              <!-- NISN -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label fw-semibold small text-secondary mb-0">NISN (10 Digit Unik)</label>
                  <button 
                    type="button" 
                    class="btn btn-link btn-sm p-0 text-decoration-none text-primary small"
                    @click="generateNextNisn"
                  >
                    <i class="bi bi-magic me-1"></i>Auto NISN
                  </button>
                </div>
                <input 
                  ref="nisnInputRef"
                  v-model="formData.nisn" 
                  type="text" 
                  maxlength="10"
                  class="form-control font-mono-numbers" 
                  placeholder="Contoh: 0081234501"
                  required
                />
              </div>

              <!-- Nama Lengkap -->
              <div class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Nama Lengkap Siswa</label>
                <input 
                  v-model="formData.nama" 
                  type="text" 
                  class="form-control" 
                  placeholder="Contoh: Muhammad Bintang Pratama"
                  required
                />
              </div>

              <!-- Tanggal Lahir -->
              <div class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Tanggal Lahir (Sebagai Password Pemilih)</label>
                <input 
                  v-model="formData.tanggal_lahir" 
                  type="date" 
                  class="form-control" 
                  required
                />
              </div>

              <!-- Kategori -->
              <div class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Kategori Pemilih</label>
                <div class="d-flex gap-3 mt-1">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="formData.kategori" value="siswa" id="quickKatSiswa">
                    <label class="form-check-label small" for="quickKatSiswa">Siswa</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="formData.kategori" value="guru" id="quickKatGuru">
                    <label class="form-check-label small" for="quickKatGuru">Guru / Staf</label>
                  </div>
                </div>
              </div>

              <!-- Kelas Tujuan -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label fw-semibold small text-secondary mb-0">
                    {{ formData.kategori === 'guru' ? 'Unit / Penugasan' : 'Kelas Tujuan' }} <span class="text-danger">*</span>
                  </label>
                  <span class="badge bg-light text-muted border font-mono-numbers" style="font-size: 0.7rem;">
                    {{ kelasList.length }} opsi tersedia
                  </span>
                </div>
                <select v-model="formData.kelas_id" class="form-select" required>
                  <option value="" disabled>-- Pilih {{ formData.kategori === 'guru' ? 'Unit' : 'Kelas' }} --</option>
                  <option v-for="k in kelasList" :key="k.id" :value="k.id">
                    {{ k.nama_kelas }} ({{ k.tingkat === 0 ? 'Staf' : 'Tingkat ' + k.tingkat }})
                  </option>
                </select>
              </div>
            </div>

            <div class="modal-footer bg-light border-top d-flex justify-content-between">
              <button type="button" class="btn btn-secondary btn-sm" @click="showQuickAddModal = false">Batal</button>
              
              <div class="d-flex gap-2">
                <button 
                  type="button" 
                  class="btn btn-outline-primary btn-sm px-3"
                  @click="saveQuickSiswa(true)"
                >
                  <i class="bi bi-plus-circle me-1"></i>Simpan & Tambah Lagi
                </button>
                <button type="submit" class="btn btn-primary btn-sm px-3" style="background-color: #1d4ed8;">
                  <i class="bi bi-check-lg me-1"></i>Simpan & Tutup
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { dbService } from '../../services/db';
import type { Statistics, Kandidat, Pengaturan, Kelas } from '../../types';
import ElectionCountdown from '../../components/ElectionCountdown.vue';
import QuickCountWidget from '../../components/QuickCountWidget.vue';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

const stats = ref<Statistics>({
  totalSiswa: 0,
  totalKelas: 0,
  totalKandidat: 0,
  sudahMemilih: 0,
  belumMemilih: 0,
  persentasePartisipasi: 0,
  totalSuaraMasuk: 0
});

const kandidatList = ref<Kandidat[]>([]);
const kelasList = ref<Kelas[]>([]);

const alertMessage = ref('');
const showQuickAddModal = ref(false);
const formError = ref('');
const formSuccessMessage = ref('');
const nisnInputRef = ref<HTMLInputElement | null>(null);

const formData = ref<{
  nisn: string;
  nama: string;
  tanggal_lahir: string;
  kelas_id: string;
  kategori: 'siswa' | 'guru';
}>({
  nisn: '',
  nama: '',
  tanggal_lahir: '2011-01-01',
  kelas_id: '',
  kategori: 'siswa'
});

function calculatePercentage(suara: number) {
  if (stats.value.totalSuaraMasuk === 0) return '0.0';
  return ((suara / stats.value.totalSuaraMasuk) * 100).toFixed(1);
}

async function refreshData() {
  settings.value = await dbService.getPengaturan();
  stats.value = await dbService.getStatistics();
  kandidatList.value = await dbService.getKandidatList();
  kelasList.value = await dbService.getKelasList();
}

async function openQuickAddSiswaModal() {
  if (kelasList.value.length === 0) {
    kelasList.value = await dbService.getKelasList();
  }
  formError.value = '';
  formSuccessMessage.value = '';
  formData.value = {
    nisn: '',
    nama: '',
    tanggal_lahir: '2011-01-01',
    kelas_id: kelasList.value[0]?.id || '',
    kategori: 'siswa'
  };
  showQuickAddModal.value = true;
  nextTick(() => {
    nisnInputRef.value?.focus();
  });
}

function generateNextNisn() {
  formData.value.nisn = '008' + Math.floor(1000000 + Math.random() * 9000000);
}

async function saveQuickSiswa(continuous: boolean = false) {
  formError.value = '';
  formSuccessMessage.value = '';

  if (!formData.value.nisn || !formData.value.nama || !formData.value.tanggal_lahir) {
    formError.value = 'NISN, Nama, dan Tanggal Lahir wajib diisi.';
    return;
  }

  if (!formData.value.kelas_id) {
    formError.value = 'Silakan pilih Kelas Tujuan.';
    return;
  }

  try {
    const savedName = formData.value.nama;
    await dbService.saveSiswa({
      nisn: formData.value.nisn,
      nama: formData.value.nama,
      tanggal_lahir: formData.value.tanggal_lahir,
      kelas_id: formData.value.kelas_id,
      sudah_memilih: false,
      kategori: formData.value.kategori
    });

    await refreshData();

    if (continuous) {
      const numericNisn = parseInt(formData.value.nisn);
      const nextNisn = !isNaN(numericNisn) ? String(numericNisn + 1).padStart(10, '0') : '';
      formSuccessMessage.value = `Siswa ${savedName} berhasil ditambahkan! Silakan masukkan siswa berikutnya.`;
      formData.value.nisn = nextNisn;
      formData.value.nama = '';
      nextTick(() => {
        nisnInputRef.value?.focus();
      });
    } else {
      alertMessage.value = `Siswa ${savedName} berhasil didaftarkan ke DPT. Total siswa: ${stats.value.totalSiswa}.`;
      showQuickAddModal.value = false;
    }
  } catch (err: any) {
    formError.value = err.message || 'Gagal menambahkan siswa.';
  }
}

onMounted(() => {
  refreshData();
});
</script>
