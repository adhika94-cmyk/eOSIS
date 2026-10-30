<template>
  <div v-if="compact" class="d-inline-flex align-items-center gap-2">
    <span 
      class="badge d-inline-flex align-items-center gap-1 font-mono-numbers px-2 py-1"
      :class="statusBadgeClass"
    >
      <i class="bi" :class="statusIconClass"></i>
      <span>{{ countdown.label }}: {{ countdown.formattedTime }}</span>
    </span>
  </div>

  <div v-else class="card card-clean border-0 shadow-sm p-3 p-sm-4 bg-white">
    <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span 
            class="badge d-inline-flex align-items-center gap-1 px-2 py-1 small"
            :class="statusBadgeClass"
          >
            <i class="bi" :class="statusIconClass"></i>
            <span>{{ statusLabelText }}</span>
          </span>
          <span class="text-muted small">· eOSIS SPENDA BOGOR</span>
        </div>
        <h4 class="h6 fw-bold text-dark mb-0">{{ countdown.label }}</h4>
      </div>

      <!-- Segmented Countdown Digits -->
      <div class="d-flex align-items-center gap-2 font-mono-numbers">
        <!-- Days -->
        <div class="text-center p-2 rounded bg-light border" style="min-width: 58px;">
          <div class="h5 fw-bold text-dark mb-0 lh-1">{{ pad(countdown.days) }}</div>
          <small class="text-muted text-uppercase" style="font-size: 0.65rem;">Hari</small>
        </div>
        <span class="fw-bold text-muted">:</span>

        <!-- Hours -->
        <div class="text-center p-2 rounded bg-light border" style="min-width: 58px;">
          <div class="h5 fw-bold text-dark mb-0 lh-1">{{ pad(countdown.hours) }}</div>
          <small class="text-muted text-uppercase" style="font-size: 0.65rem;">Jam</small>
        </div>
        <span class="fw-bold text-muted">:</span>

        <!-- Minutes -->
        <div class="text-center p-2 rounded bg-light border" style="min-width: 58px;">
          <div class="h5 fw-bold text-dark mb-0 lh-1">{{ pad(countdown.minutes) }}</div>
          <small class="text-muted text-uppercase" style="font-size: 0.65rem;">Menit</small>
        </div>
        <span class="fw-bold text-muted">:</span>

        <!-- Seconds -->
        <div class="text-center p-2 rounded bg-primary-subtle text-primary border border-primary-subtle" style="min-width: 58px;">
          <div class="h5 fw-bold text-primary mb-0 lh-1">{{ pad(countdown.seconds) }}</div>
          <small class="text-primary text-uppercase" style="font-size: 0.65rem;">Detik</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { calculateElectionCountdown, CountdownState } from '../utils/countdown';

const props = withDefaults(defineProps<{
  startTime?: string;
  endTime?: string;
  votingDibuka?: boolean;
  compact?: boolean;
}>(), {
  compact: false,
  votingDibuka: true
});

const countdown = ref<CountdownState>({
  status: 'ACTIVE',
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  label: 'Hitung Mundur Pemilihan',
  formattedTime: '00h : 00j : 00m : 00d'
});

let timer: any = null;

function updateTimer() {
  countdown.value = calculateElectionCountdown(props.startTime, props.endTime);
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

const statusBadgeClass = computed(() => {
  if (!props.votingDibuka) return 'bg-danger-subtle text-danger border border-danger-subtle';
  if (countdown.value.status === 'UPCOMING') return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
  if (countdown.value.status === 'ACTIVE') return 'bg-success-subtle text-success border border-success-subtle';
  return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
});

const statusIconClass = computed(() => {
  if (!props.votingDibuka) return 'bi-lock-fill';
  if (countdown.value.status === 'UPCOMING') return 'bi-hourglass-top';
  if (countdown.value.status === 'ACTIVE') return 'bi-broadcast';
  return 'bi-check-all';
});

const statusLabelText = computed(() => {
  if (!props.votingDibuka) return 'Pemilihan Ditutup';
  if (countdown.value.status === 'UPCOMING') return 'Segera Dibuka';
  if (countdown.value.status === 'ACTIVE') return 'Pemungutan Suara Aktif';
  return 'Waktu Selesai';
});

onMounted(() => {
  updateTimer();
  timer = setInterval(updateTimer, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
