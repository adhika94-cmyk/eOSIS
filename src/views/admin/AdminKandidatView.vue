<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <div>
        <h1 class="h4 fw-bold text-dark mb-1">Manajemen Calon Kandidat OSIS</h1>
        <p class="text-muted small mb-0">
          Kelola pasangan calon ketua dan wakil ketua OSIS SMP Negeri 2 Kota Bogor
        </p>
      </div>

      <button type="button" class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openAddModal" style="background-color: #1d4ed8;">
        <i class="bi bi-plus-circle"></i>
        <span>Tambah Calon Kandidat</span>
      </button>
    </div>

    <!-- Alert Message -->
    <div v-if="alertMessage" class="alert alert-success alert-dismissible fade show small py-2 px-3 border-success-subtle mb-3" role="alert">
      <i class="bi bi-check-circle-fill me-1"></i>
      <span>{{ alertMessage }}</span>
      <button type="button" class="btn-close py-2" @click="alertMessage = ''"></button>
    </div>

    <!-- Grid Kartu Kandidat -->
    <div class="row g-4">
      <div v-for="kandidat in kandidatList" :key="kandidat.id" class="col-12 col-md-6 col-xl-4">
        <div class="card card-clean h-100 d-flex flex-column overflow-hidden position-relative shadow-sm">
          
          <!-- Badge Nomor Urut -->
          <div class="position-absolute top-0 start-0 m-3 z-2">
            <span class="badge bg-dark fs-6 px-3 py-2 shadow border border-white font-mono-numbers">
              NO. {{ kandidat.nomor_urut }}
            </span>
          </div>

          <!-- Header Foto Paslon -->
          <div class="bg-dark position-relative" style="height: 240px; overflow: hidden;">
            <img 
              :src="kandidat.foto_url || defaultPhoto" 
              :alt="`Paslon ${kandidat.nomor_urut}`"
              class="w-100 h-100 object-fit-cover"
              referrerpolicy="no-referrer"
            />
            <div class="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient" style="background: linear-gradient(to top, rgba(15,30,54,0.92) 0%, transparent 100%);">
              <h2 class="h6 text-white fw-bold mb-0 text-truncate">
                {{ kandidat.nama_ketua }}
              </h2>
              <div class="text-white-50 small text-truncate">
                & {{ kandidat.nama_wakil }}
              </div>
            </div>
          </div>

          <!-- Body Kartu -->
          <div class="p-3 p-md-4 flex-grow-1 d-flex flex-column justify-content-between">
            <div>
              <!-- Slogan -->
              <div class="p-2 rounded bg-light border text-center mb-3">
                <small class="text-secondary fst-italic">"{{ kandidat.slogan || '-' }}"</small>
              </div>

              <!-- Visi Singkat -->
              <div class="mb-3">
                <strong class="d-block text-dark small fw-bold mb-1">Visi:</strong>
                <p class="text-muted small mb-0 lh-sm line-clamp-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  {{ kandidat.visi }}
                </p>
              </div>

              <!-- Misi Singkat -->
              <div class="mb-3">
                <strong class="d-block text-dark small fw-bold mb-1">Misi & Program:</strong>
                <div class="text-muted small lh-sm line-clamp-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line;">
                  {{ kandidat.misi }}
                </div>
              </div>
            </div>

            <!-- Perolehan Suara & Aksi -->
            <div class="pt-3 border-top d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small d-block" style="font-size: 0.75rem;">Perolehan Suara:</span>
                <span class="h6 fw-bold text-primary font-mono-numbers mb-0">
                  {{ kandidat.total_suara || 0 }} suara
                </span>
              </div>

              <div class="d-flex gap-1">
                <button 
                  type="button" 
                  class="btn btn-outline-primary btn-sm py-1 px-2"
                  title="Edit Kandidat"
                  @click="openEditModal(kandidat)"
                >
                  <i class="bi bi-pencil-square"></i>
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline-danger btn-sm py-1 px-2"
                  title="Hapus Kandidat"
                  @click="confirmDelete(kandidat)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORM KANDIDAT (TAMBAH / EDIT) -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <h5 class="modal-title fw-bold text-dark fs-6">
              {{ isEditing ? 'Edit Calon Paslon' : 'Tambah Pasangan Calon Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <form @submit.prevent="saveKandidat">
            <div class="modal-body p-4">
              <div v-if="formError" class="alert alert-danger py-2 small mb-3">
                {{ formError }}
              </div>

              <div class="row g-3">
                <!-- Nomor Urut -->
                <div class="col-12 col-sm-4">
                  <label class="form-label fw-semibold small text-secondary">Nomor Urut</label>
                  <input 
                    v-model.number="formData.nomor_urut" 
                    type="number" 
                    min="1"
                    max="10"
                    class="form-control font-mono-numbers" 
                    placeholder="1"
                    required
                  />
                </div>

                <!-- Foto URL / Upload -->
                <div class="col-12 col-sm-8">
                  <label class="form-label fw-semibold small text-secondary">Foto Paslon (File / URL)</label>
                  <div class="input-group">
                    <input 
                      v-model="formData.foto_url" 
                      type="text" 
                      class="form-control small font-mono-numbers" 
                      placeholder="/src/assets/images/... atau URL gambar"
                    />
                    <label class="btn btn-outline-secondary btn-sm mb-0 d-flex align-items-center">
                      <i class="bi bi-upload me-1"></i>Upload
                      <input type="file" accept="image/*" class="d-none" @change="handleFileUpload" />
                    </label>
                  </div>
                </div>

                <!-- Nama Calon Ketua -->
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small text-secondary">Nama Calon Ketua OSIS</label>
                  <input 
                    v-model="formData.nama_ketua" 
                    type="text" 
                    class="form-control" 
                    placeholder="Contoh: Muhammad Reza"
                    required
                  />
                </div>

                <!-- Nama Calon Wakil Ketua -->
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small text-secondary">Nama Calon Wakil Ketua OSIS</label>
                  <input 
                    v-model="formData.nama_wakil" 
                    type="text" 
                    class="form-control" 
                    placeholder="Contoh: Amanda Putri"
                    required
                  />
                </div>

                <!-- Slogan -->
                <div class="col-12">
                  <label class="form-label fw-semibold small text-secondary">Slogan / Tagline Paslon</label>
                  <input 
                    v-model="formData.slogan" 
                    type="text" 
                    class="form-control" 
                    placeholder="Contoh: Inovatif, Berkarakter, dan Berprestasi"
                  />
                </div>

                <!-- Visi -->
                <div class="col-12">
                  <label class="form-label fw-semibold small text-secondary">Visi Paslon</label>
                  <textarea 
                    v-model="formData.visi" 
                    rows="3" 
                    class="form-control" 
                    placeholder="Tuliskan visi kepemimpinan OSIS..."
                    required
                  ></textarea>
                </div>

                <!-- Misi -->
                <div class="col-12">
                  <label class="form-label fw-semibold small text-secondary">Misi & Program Kerja (Satu per baris)</label>
                  <textarea 
                    v-model="formData.misi" 
                    rows="4" 
                    class="form-control" 
                    placeholder="1. Meningkatkan kegiatan ekstrakurikuler...&#10;2. Mengoptimalkan program peduli lingkungan..."
                    required
                  ></textarea>
                </div>
              </div>

            </div>

            <div class="modal-footer bg-light border-top">
              <button type="button" class="btn btn-secondary btn-sm" @click="showModal = false">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm px-3" style="background-color: #1d4ed8;">
                {{ isEditing ? 'Simpan Perubahan' : 'Tambahkan Paslon' }}
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
      v-if="showDeleteModal && kandidatToDelete"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-4">
            <i class="bi bi-trash-fill fs-1 text-danger mb-2 d-block"></i>
            <h5 class="fw-bold mb-1">Hapus Paslon No. {{ kandidatToDelete.nomor_urut }}?</h5>
            <p class="text-muted small mb-4">
              Apakah Anda yakin ingin menghapus data calon <strong>{{ kandidatToDelete.nama_ketua }} & {{ kandidatToDelete.nama_wakil }}</strong>?
            </p>
            <div class="d-flex gap-2 justify-content-center">
              <button type="button" class="btn btn-outline-secondary btn-sm px-3" @click="showDeleteModal = false">
                Batal
              </button>
              <button type="button" class="btn btn-danger btn-sm px-3" @click="deleteKandidat">
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
import { ref, onMounted } from 'vue';
import { dbService } from '../../services/db';
import type { Kandidat } from '../../types';

const defaultPhoto = '/src/assets/images/kandidat_paslon_1_1793253208173.jpg';

const kandidatList = ref<Kandidat[]>([]);
const alertMessage = ref('');

// Modal Form
const showModal = ref(false);
const isEditing = ref(false);
const formError = ref('');
const formData = ref<{
  id?: string;
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string;
  slogan: string;
  visi: string;
  misi: string;
  foto_url: string;
}>({
  nomor_urut: 1,
  nama_ketua: '',
  nama_wakil: '',
  slogan: '',
  visi: '',
  misi: '',
  foto_url: defaultPhoto
});

// Delete Modal
const showDeleteModal = ref(false);
const kandidatToDelete = ref<Kandidat | null>(null);

async function loadData() {
  kandidatList.value = await dbService.getKandidatList();
}

function openAddModal() {
  isEditing.value = false;
  formError.value = '';
  const nextNo = (kandidatList.value.length > 0 ? Math.max(...kandidatList.value.map(k => k.nomor_urut)) + 1 : 1);
  formData.value = {
    nomor_urut: nextNo,
    nama_ketua: '',
    nama_wakil: '',
    slogan: '',
    visi: '',
    misi: '',
    foto_url: defaultPhoto
  };
  showModal.value = true;
}

function openEditModal(kandidat: Kandidat) {
  isEditing.value = true;
  formError.value = '';
  formData.value = {
    id: kandidat.id,
    nomor_urut: kandidat.nomor_urut,
    nama_ketua: kandidat.nama_ketua,
    nama_wakil: kandidat.nama_wakil,
    slogan: kandidat.slogan || '',
    visi: kandidat.visi,
    misi: kandidat.misi,
    foto_url: kandidat.foto_url || defaultPhoto
  };
  showModal.value = true;
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      formData.value.foto_url = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

async function saveKandidat() {
  formError.value = '';
  if (!formData.value.nama_ketua || !formData.value.nama_wakil || !formData.value.visi || !formData.value.misi) {
    formError.value = 'Nomor urut, nama ketua, nama wakil, visi, dan misi wajib diisi.';
    return;
  }

  try {
    await dbService.saveKandidat({
      id: formData.value.id,
      nomor_urut: formData.value.nomor_urut,
      nama_ketua: formData.value.nama_ketua,
      nama_wakil: formData.value.nama_wakil,
      slogan: formData.value.slogan,
      visi: formData.value.visi,
      misi: formData.value.misi,
      foto_url: formData.value.foto_url
    });

    alertMessage.value = isEditing.value
      ? `Paslon No. ${formData.value.nomor_urut} berhasil diperbarui.`
      : `Paslon No. ${formData.value.nomor_urut} berhasil ditambahkan.`;

    showModal.value = false;
    await loadData();
  } catch (err: any) {
    formError.value = err.message || 'Gagal menyimpan calon kandidat.';
  }
}

function confirmDelete(kandidat: Kandidat) {
  kandidatToDelete.value = kandidat;
  showDeleteModal.value = true;
}

async function deleteKandidat() {
  if (!kandidatToDelete.value) return;
  try {
    await dbService.deleteKandidat(kandidatToDelete.value.id);
    alertMessage.value = `Paslon No. ${kandidatToDelete.value.nomor_urut} berhasil dihapus.`;
    showDeleteModal.value = false;
    kandidatToDelete.value = null;
    await loadData();
  } catch (err: any) {
    alert(err.message || 'Gagal menghapus paslon.');
  }
}

onMounted(() => {
  loadData();
});
</script>
