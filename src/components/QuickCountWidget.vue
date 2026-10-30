<template>
  <div class="card card-clean border-0 shadow-sm p-4 bg-white">
    <!-- Header Quick Count -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 border-bottom pb-3 mb-4">
      <div class="d-flex align-items-center gap-2">
        <span class="live-pill d-inline-flex align-items-center gap-1 px-2 py-1 rounded bg-danger text-white small fw-bold">
          <span class="pulse-dot"></span>
          <span>LIVE QUICK COUNT</span>
        </span>
        <span class="text-muted small">· Real-Time Rekapitulasi Suara</span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <small class="text-muted font-mono-numbers small d-none d-md-inline">
          Pembaruan: {{ lastUpdatedText }}
        </small>
        <button 
          type="button" 
          class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          @click="fetchData"
          title="Segarkan Suara Sekarang"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': isFetching }"></i>
          <span class="small">Segarkan</span>
        </button>
      </div>
    </div>

    <!-- 3 Mini Summary Badges -->
    <div class="row g-2 mb-4">
      <div class="col-4">
        <div class="p-2 p-sm-3 rounded bg-light border text-center">
          <small class="text-muted d-block" style="font-size: 0.725rem;">Suara Masuk</small>
          <strong class="h5 fw-bold text-dark font-mono-numbers mb-0">{{ stats.totalSuaraMasuk }}</strong>
        </div>
      </div>
      <div class="col-4">
        <div class="p-2 p-sm-3 rounded bg-light border text-center">
          <small class="text-muted d-block" style="font-size: 0.725rem;">Total DPT</small>
          <strong class="h5 fw-bold text-dark font-mono-numbers mb-0">{{ stats.totalSiswa }}</strong>
        </div>
      </div>
      <div class="col-4">
        <div class="p-2 p-sm-3 rounded bg-primary-subtle text-primary border border-primary-subtle text-center">
          <small class="text-primary d-block fw-semibold" style="font-size: 0.725rem;">Data Masuk</small>
          <strong class="h5 fw-bold text-primary font-mono-numbers mb-0">{{ stats.persentasePartisipasi }}%</strong>
        </div>
      </div>
    </div>

    <!-- Candidates Live Cards Grid -->
    <div class="row g-3 mb-4">
      <div 
        v-for="k in candidatesWithMetrics" 
        :key="k.id"
        class="col-12 col-md-4"
      >
        <div 
          class="p-3 rounded-3 border h-100 position-relative transition-all"
          :class="k.isLeader && stats.totalSuaraMasuk > 0 ? 'border-primary bg-primary-subtle bg-opacity-10 shadow-sm' : 'bg-light'"
        >
          <!-- Leader Badge -->
          <div v-if="k.isLeader && stats.totalSuaraMasuk > 0" class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-success text-white small px-2 py-1 shadow-sm d-inline-flex align-items-center gap-1">
              <i class="bi bi-trophy-fill"></i>
              <span>Unggul</span>
            </span>
          </div>

          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="rounded-circle bg-dark text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px; font-size: 1.2rem;">
              {{ k.nomor_urut }}
            </div>
            <div class="text-truncate">
              <span class="badge bg-dark-subtle text-dark font-mono-numbers small mb-1">PASLON {{ k.nomor_urut }}</span>
              <h5 class="fs-6 fw-bold text-dark mb-0 text-truncate">{{ k.nama_ketua }}</h5>
              <small class="text-muted text-truncate d-block">& {{ k.nama_wakil }}</small>
            </div>
          </div>

          <!-- Big Percentage & Vote Number -->
          <div class="d-flex align-items-baseline justify-content-between mb-2">
            <div class="h3 fw-extrabold text-dark font-mono-numbers mb-0">
              {{ k.percentage }}<span class="fs-5">%</span>
            </div>
            <span class="text-muted font-mono-numbers small">
              {{ k.total_suara }} suara
            </span>
          </div>

          <!-- Animated Progress Bar -->
          <div class="progress" style="height: 10px; border-radius: 5px; background-color: #e2e8f0;">
            <div 
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              :style="{ width: `${Math.max(Number(k.percentage), 3)}%`, backgroundColor: getBarColor(k.nomor_urut) }"
              :aria-valuenow="Number(k.percentage)"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Count Breakdown per Tingkat Kelas -->
    <div class="p-3 rounded bg-light border">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="fw-semibold text-dark small">Partisipasi Quick Count per Tingkat:</span>
        <span class="text-muted small font-mono-numbers">{{ classBreakdown.totalVoted }} / {{ stats.totalSiswa }} siswa</span>
      </div>
      <div class="row g-2 text-center small font-mono-numbers">
        <div class="col-4">
          <div class="p-2 rounded bg-white border">
            <span class="text-muted d-block" style="font-size: 0.7rem;">Kelas VII</span>
            <strong class="text-dark">{{ classBreakdown.tingkat7.voted }} / {{ classBreakdown.tingkat7.total }}</strong>
            <small class="text-muted d-block" style="font-size: 0.65rem;">({{ classBreakdown.tingkat7.pct }}%)</small>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 rounded bg-white border">
            <span class="text-muted d-block" style="font-size: 0.7rem;">Kelas VIII</span>
            <strong class="text-dark">{{ classBreakdown.tingkat8.voted }} / {{ classBreakdown.tingkat8.total }}</strong>
            <small class="text-muted d-block" style="font-size: 0.65rem;">({{ classBreakdown.tingkat8.pct }}%)</small>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 rounded bg-white border">
            <span class="text-muted d-block" style="font-size: 0.7rem;">Kelas IX</span>
            <strong class="text-dark">{{ classBreakdown.tingkat9.voted }} / {{ classBreakdown.tingkat9.total }}</strong>
            <small class="text-muted d-block" style="font-size: 0.65rem;">({{ classBreakdown.tingkat9.pct }}%)</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { dbService } from '../services/db';
import type { Statistics, Kandidat, Siswa, Kelas } from '../types';

const isFetching = ref(false);
const lastUpdated = ref(new Date());

const stats = ref<Statistics>({
  totalSiswa: 0,
  totalKelas: 0,
  totalKandidat: 0,
  sudahMemilih: 0,
  belumMemilih: 0,
  persentasePartisipasi: 0,
  totalSuaraMasuk: 0
});

const candidates = ref<Kandidat[]>([]);
const students = ref<Siswa[]>([]);
const classes = ref<Kelas[]>([]);

let pollingTimer: any = null;

const lastUpdatedText = computed(() => {
  return lastUpdated.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
});

const maxVotes = computed(() => {
  return Math.max(...candidates.value.map(c => c.total_suara || 0), 0);
});

const candidatesWithMetrics = computed(() => {
  const total = stats.value.totalSuaraMasuk;
  return candidates.value.map(c => {
    const suara = c.total_suara || 0;
    const percentage = total > 0 ? ((suara / total) * 100).toFixed(1) : '0.0';
    const isLeader = suara > 0 && suara === maxVotes.value;
    return {
      ...c,
      percentage,
      isLeader
    };
  });
});

const classBreakdown = computed(() => {
  const kelasMap = new Map(classes.value.map(k => [k.id, k.tingkat]));
  
  let t7Total = 0, t7Voted = 0;
  let t8Total = 0, t8Voted = 0;
  let t9Total = 0, t9Voted = 0;

  students.value.forEach(s => {
    const tingkat = kelasMap.get(s.kelas_id) || 7;
    if (tingkat === 7) {
      t7Total++;
      if (s.sudah_memilih) t7Voted++;
    } else if (tingkat === 8) {
      t8Total++;
      if (s.sudah_memilih) t8Voted++;
    } else if (tingkat === 9) {
      t9Total++;
      if (s.sudah_memilih) t9Voted++;
    }
  });

  return {
    totalVoted: t7Voted + t8Voted + t9Voted,
    tingkat7: { total: t7Total, voted: t7Voted, pct: t7Total > 0 ? ((t7Voted / t7Total) * 100).toFixed(0) : '0' },
    tingkat8: { total: t8Total, voted: t8Voted, pct: t8Total > 0 ? ((t8Voted / t8Total) * 100).toFixed(0) : '0' },
    tingkat9: { total: t9Total, voted: t9Voted, pct: t9Total > 0 ? ((t9Voted / t9Total) * 100).toFixed(0) : '0' }
  };
});

function getBarColor(nomorUrut: number) {
  const colors = ['#1d4ed8', '#059669', '#d97706', '#7c3aed', '#db2777'];
  return colors[(nomorUrut - 1) % colors.length];
}

async function fetchData() {
  isFetching.value = true;
  try {
    stats.value = await dbService.getStatistics();
    candidates.value = await dbService.getKandidatList();
    students.value = await dbService.getSiswaList();
    classes.value = await dbService.getKelasList();
    lastUpdated.value = new Date();
  } catch (e) {
    console.error('Failed to fetch quick count data', e);
  } finally {
    isFetching.value = false;
  }
}

onMounted(() => {
  fetchData();
  pollingTimer = setInterval(fetchData, 3500); // Poll every 3.5s for real-time live count
});

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
});
</script>

<style scoped>
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ffffff;
  display: inline-block;
  animation: pulseAnimation 1.5s infinite;
}

@keyframes pulseAnimation {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin-icon {
  animation: spin 1s linear infinite;
}

.transition-all {
  transition: all 0.25s ease;
}
</style>
