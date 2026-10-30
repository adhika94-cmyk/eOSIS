<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <div>
        <h1 class="h4 fw-bold text-dark mb-1">Manajemen Data Kelas</h1>
        <p class="text-muted small mb-0">Kelola rombel kelas siswa SMP Negeri 2 Kota Bogor (Tingkat VII, VIII, IX)</p>
      </div>

      <button type="button" class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openAddModal" style="background-color: #1d4ed8;">
        <i class="bi bi-plus-circle"></i>
        <span>Tambah Kelas Baru</span>
      </button>
    </div>

    <!-- Alert Success / Info -->
    <div v-if="alertMessage" class="alert alert-success alert-dismissible fade show small py-2 px-3 border-success-subtle mb-3" role="alert">
      <i class="bi bi-check-circle-fill me-1"></i>
      <span>{{ alertMessage }}</span>
      <button type="button" class="btn-close py-2" @click="alertMessage = ''"></button>
    </div>

    <!-- Kelas Table Card -->
    <div class="card card-clean overflow-hidden">
      <div class="p-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 bg-white">
        <div class="d-flex align-items-center gap-2">
          <span class="fw-semibold text-dark small">Filter Tingkat:</span>
          <div class="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              class="btn" 
              :class="selectedTingkat === 'all' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectedTingkat = 'all'"
            >
              Semua ({{ kelasList.length }})
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="selectedTingkat === 7 ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectedTingkat = 7"
            >
              Kelas 7
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="selectedTingkat === 8 ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectedTingkat = 8"
            >
              Kelas 8
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="selectedTingkat === 9 ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectedTingkat = 9"
            >
              Kelas 9
            </button>
          </div>
        </div>

        <div class="input-group input-group-sm" style="max-width: 250px;">
          <span class="input-group-text bg-light text-muted border-end-0">
            <i class="bi bi-search"></i>
          </span>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control border-start-0" 
            placeholder="Cari nama kelas / wali..."
          />
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover table-eosis align-middle mb-0">
          <thead>
            <tr>
              <th style="width: 70px;">No</th>
              <th>Nama Kelas</th>
              <th>Tingkat</th>
              <th>Wali Kelas</th>
              <th>Jumlah Siswa</th>
              <th style="width: 130px;" class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredKelasList.length === 0">
              <td colspan="6" class="text-center py-4 text-muted small">
                Tidak ada data kelas yang sesuai dengan filter.
              </td>
            </tr>
            <tr v-for="(kelas, idx) in filteredKelasList" :key="kelas.id">
              <td class="font-mono-numbers text-muted">{{ idx + 1 }}</td>
              <td>
                <span class="fw-bold text-dark font-mono-numbers">{{ kelas.nama_kelas }}</span>
              </td>
              <td>
                <span class="badge bg-light text-secondary border">
                  Tingkat {{ kelas.tingkat }}
                </span>
              </td>
              <td>
                <span class="text-dark small">{{ kelas.wali_kelas || '-' }}</span>
              </td>
              <td>
                <span class="font-mono-numbers badge bg-primary-subtle text-primary border border-primary-subtle">
                  {{ getStudentCount(kelas.id) }} Siswa
                </span>
              </td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm py-1 px-2"
                    title="Edit Kelas"
                    @click="openEditModal(kelas)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-danger btn-sm py-1 px-2"
                    title="Hapus Kelas"
                    @click="confirmDelete(kelas)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM KELAS (TAMBAH / EDIT) -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <h5 class="modal-title fw-bold text-dark fs-6">
              {{ isEditing ? 'Edit Data Kelas' : 'Tambah Kelas Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <form @submit.prevent="saveKelas">
            <div class="modal-body p-4">
              <div v-if="formError" class="alert alert-danger py-2 small mb-3">
                {{ formError }}
              </div>

              <!-- Nama Kelas -->
              <div class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Nama Kelas</label>
                <input 
                  v-model="formData.nama_kelas" 
                  type="text" 
                  class="form-control" 
                  placeholder="Contoh: 7-A, 8-B, 9-C"
                  required
                />
                <div class="form-text small text-muted">Format standar: Nomor Tingkat - Abjad Kelas</div>
              </div>

              <!-- Tingkat -->
              <div class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Tingkat Jenjang</label>
                <select v-model.number="formData.tingkat" class="form-select" required>
                  <option :value="7">Kelas VII (Tujuh)</option>
                  <option :value="8">Kelas VIII (Delapan)</option>
                  <option :value="9">Kelas IX (Sembilan)</option>
                </select>
              </div>

              <!-- Wali Kelas -->
              <div class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Nama Wali Kelas (Opsional)</label>
                <input 
                  v-model="formData.wali_kelas" 
                  type="text" 
                  class="form-control" 
                  placeholder="Contoh: Dra. Sri Wahyuni, M.Pd"
                />
              </div>
            </div>

            <div class="modal-footer bg-light border-top">
              <button type="button" class="btn btn-secondary btn-sm" @click="showModal = false">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm px-3" style="background-color: #1d4ed8;">
                {{ isEditing ? 'Simpan Perubahan' : 'Tambah Kelas' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRM DELETE -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showDeleteModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showDeleteModal && kelasToDelete"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-4">
            <i class="bi bi-trash-fill fs-1 text-danger mb-2 d-block"></i>
            <h5 class="fw-bold mb-1">Hapus Kelas {{ kelasToDelete.nama_kelas }}?</h5>
            <p class="text-muted small mb-4">
              Apakah Anda yakin ingin menghapus kelas ini? Siswa di kelas ini tidak akan terhapus namun status kelasnya akan menjadi umum.
            </p>
            <div class="d-flex gap-2 justify-content-center">
              <button type="button" class="btn btn-outline-secondary btn-sm px-3" @click="showDeleteModal = false">
                Batal
              </button>
              <button type="button" class="btn btn-danger btn-sm px-3" @click="deleteKelas">
                Ya, Hapus
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
import { dbService } from '../../services/db';
import type { Kelas, Siswa } from '../../types';

const kelasList = ref<Kelas[]>([]);
const siswaList = ref<Siswa[]>([]);
const selectedTingkat = ref<'all' | number>('all');
const searchQuery = ref('');
const alertMessage = ref('');

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const formError = ref('');
const formData = ref<{ id?: string; nama_kelas: string; tingkat: number; wali_kelas: string }>({
  nama_kelas: '',
  tingkat: 7,
  wali_kelas: ''
});

const showDeleteModal = ref(false);
const kelasToDelete = ref<Kelas | null>(null);

async function loadData() {
  kelasList.value = await dbService.getKelasList();
  siswaList.value = await dbService.getSiswaList();
}

function getStudentCount(kelasId: string) {
  return siswaList.value.filter(s => s.kelas_id === kelasId).length;
}

const filteredKelasList = computed(() => {
  return kelasList.value.filter(k => {
    const matchTingkat = selectedTingkat.value === 'all' || k.tingkat === selectedTingkat.value;
    const matchSearch = searchQuery.value === '' || 
      k.nama_kelas.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      k.wali_kelas?.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchTingkat && matchSearch;
  });
});

function openAddModal() {
  isEditing.value = false;
  formError.value = '';
  formData.value = { nama_kelas: '', tingkat: 7, wali_kelas: '' };
  showModal.value = true;
}

function openEditModal(kelas: Kelas) {
  isEditing.value = true;
  formError.value = '';
  formData.value = {
    id: kelas.id,
    nama_kelas: kelas.nama_kelas,
    tingkat: kelas.tingkat,
    wali_kelas: kelas.wali_kelas || ''
  };
  showModal.value = true;
}

async function saveKelas() {
  formError.value = '';
  if (!formData.value.nama_kelas.trim()) {
    formError.value = 'Nama kelas wajib diisi.';
    return;
  }

  try {
    await dbService.saveKelas({
      id: formData.value.id,
      nama_kelas: formData.value.nama_kelas,
      tingkat: formData.value.tingkat,
      wali_kelas: formData.value.wali_kelas
    });

    alertMessage.value = isEditing.value 
      ? `Kelas ${formData.value.nama_kelas} berhasil diperbarui.`
      : `Kelas ${formData.value.nama_kelas} berhasil ditambahkan.`;

    showModal.value = false;
    await loadData();
  } catch (err: any) {
    formError.value = err.message || 'Gagal menyimpan data kelas.';
  }
}

function confirmDelete(kelas: Kelas) {
  kelasToDelete.value = kelas;
  showDeleteModal.value = true;
}

async function deleteKelas() {
  if (!kelasToDelete.value) return;
  try {
    await dbService.deleteKelas(kelasToDelete.value.id);
    alertMessage.value = `Kelas ${kelasToDelete.value.nama_kelas} berhasil dihapus.`;
    showDeleteModal.value = false;
    kelasToDelete.value = null;
    await loadData();
  } catch (err: any) {
    alert(err.message || 'Gagal menghapus kelas.');
  }
}

onMounted(() => {
  loadData();
});
</script>
