<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <h1 class="h4 fw-bold text-dark mb-0">Manajemen Pemilih (DPT)</h1>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-mono-numbers">
            <i class="bi bi-database-check me-1"></i>Kapasitas Tak Terbatas
          </span>
        </div>
        <p class="text-muted small mb-0">
          Daftar Pemilih Tetap (DPT) Siswa & Guru SMP Negeri 2 Kota Bogor • Bebas tambah data tanpa batasan kuota
        </p>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <!-- Dropdown Reset Pemilih -->
        <div class="dropdown">
          <button 
            type="button" 
            class="btn btn-outline-warning btn-sm dropdown-toggle d-flex align-items-center gap-1"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
            <span>Reset Pemilih</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm small">
            <li>
              <button class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" @click="confirmResetAllPemilih">
                <i class="bi bi-people-fill text-warning"></i>
                <span>Reset Status Semua Pemilih (Belum Memilih)</span>
              </button>
            </li>
            <li v-if="filterKelas !== 'all'">
              <button class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" @click="confirmResetKelasPemilih">
                <i class="bi bi-building text-info"></i>
                <span>Reset Pemilih di Kelas Terpilih Saja</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Dropdown Reset Siswa -->
        <div class="dropdown">
          <button 
            type="button" 
            class="btn btn-outline-danger btn-sm dropdown-toggle d-flex align-items-center gap-1"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-trash3"></i>
            <span>Reset Siswa</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm small">
            <li>
              <button class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark" @click="confirmResetSiswaDefault">
                <i class="bi bi-arrow-repeat text-primary"></i>
                <span>Pulihkan Data Siswa Default (Bawaan)</span>
              </button>
            </li>
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <button class="dropdown-item py-2 d-flex align-items-center gap-2 text-danger" @click="confirmClearAllSiswa">
                <i class="bi bi-trash-fill text-danger"></i>
                <span>Kosongkan Seluruh Data Siswa (Hapus DPT)</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Tombol Generator DPT Otomatis -->
        <button 
          type="button" 
          class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" 
          @click="openGeneratorModal"
          title="Buat ratusan atau ribuan siswa otomatis untuk uji coba atau registrasi massal"
        >
          <i class="bi bi-magic"></i>
          <span>Generator DPT Massal</span>
        </button>

        <!-- Tombol Import CSV / Excel -->
        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="openImportModal">
          <i class="bi bi-file-earmark-arrow-up"></i>
          <span>Import CSV / Excel</span>
        </button>

        <!-- Export DPT -->
        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="exportCSV">
          <i class="bi bi-file-earmark-arrow-down"></i>
          <span>Export DPT</span>
        </button>

        <!-- Tambah Pemilih Manual -->
        <button type="button" class="btn btn-primary btn-sm d-flex align-items-center gap-1" @click="openAddModal" style="background-color: #1d4ed8;">
          <i class="bi bi-person-plus-fill"></i>
          <span>Tambah Pemilih</span>
        </button>
      </div>
    </div>

    <!-- Alert Success / Info -->
    <div v-if="alertMessage" class="alert alert-success alert-dismissible fade show small py-2 px-3 border-success-subtle mb-3" role="alert">
      <i class="bi bi-check-circle-fill me-1"></i>
      <span>{{ alertMessage }}</span>
      <button type="button" class="btn-close py-2" @click="alertMessage = ''"></button>
    </div>

    <!-- Secret Ballot Privacy Notice & Total Status -->
    <div class="row g-2 mb-3">
      <div class="col-12 col-lg-8">
        <div class="alert alert-info py-2 px-3 small border-info-subtle mb-0 d-flex align-items-center h-100">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-shield-lock-fill text-info fs-5 flex-shrink-0"></i>
            <span><strong>Asas Kerahasiaan (LUBER):</strong> Sistem hanya mencatat status Sudah/Belum Memilih. Pilihan kandidat anonim dan terpisah dari identitas pemilih.</span>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="p-2 px-3 rounded border bg-light d-flex align-items-center justify-content-between h-100 font-mono-numbers small">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-people text-primary"></i>
            <span class="text-muted">Total: <strong class="text-dark">{{ siswaList.length.toLocaleString('id-ID') }}</strong></span>
          </div>
          <span class="text-success"><i class="bi bi-check2-circle me-1"></i>{{ countSudah.toLocaleString('id-ID') }}</span>
          <span class="text-danger"><i class="bi bi-clock-history me-1"></i>{{ countBelum.toLocaleString('id-ID') }}</span>
        </div>
      </div>
    </div>

    <!-- Bulk Selection Action Bar -->
    <div v-if="selectedIds.length > 0" class="alert alert-primary py-2 px-3 small border-primary-subtle mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-check2-square fs-5 text-primary"></i>
        <span><strong>{{ selectedIds.length }}</strong> siswa dipilih</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button type="button" class="btn btn-warning btn-sm py-1 px-2" @click="confirmResetSelectedVotes">
          <i class="bi bi-arrow-counterclockwise me-1"></i>Reset Hak Suara Terpilih
        </button>
        <button type="button" class="btn btn-danger btn-sm py-1 px-2" @click="confirmDeleteSelected">
          <i class="bi bi-trash me-1"></i>Hapus Terpilih
        </button>
        <button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2" @click="clearSelection">
          Batal Pilih
        </button>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="card card-clean mb-4">
      <div class="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" style="background-color: #b8b2b2;">
        <!-- Filter Controls -->
        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Filter Kelas -->
          <div class="d-flex align-items-center gap-1">
            <span class="text-muted small fw-medium">Kelas:</span>
            <select v-model="filterKelas" class="form-select form-select-sm" style="min-width: 120px;" @change="currentPage = 1">
              <option value="all">Semua Kelas</option>
              <option v-for="k in kelasList" :key="k.id" :value="k.id">{{ k.nama_kelas }}</option>
            </select>
          </div>

          <!-- Filter Status Memilih -->
          <div class="d-flex align-items-center gap-1">
            <span class="text-muted small fw-medium">Status:</span>
            <select v-model="filterStatus" class="form-select form-select-sm" style="min-width: 130px;" @change="currentPage = 1">
              <option value="all">Semua Status</option>
              <option value="sudah">Sudah Memilih</option>
              <option value="belum">Belum Memilih</option>
            </select>
          </div>

          <!-- Filter Kategori -->
          <div class="d-flex align-items-center gap-1">
            <span class="text-muted small fw-medium">Kategori:</span>
            <select v-model="filterKategori" class="form-select form-select-sm" style="min-width: 100px;" @change="currentPage = 1">
              <option value="all">Semua</option>
              <option value="siswa">Siswa</option>
              <option value="guru">Guru/Staf</option>
            </select>
          </div>

          <!-- Per Halaman -->
          <div class="d-flex align-items-center gap-1">
            <span class="text-muted small fw-medium">Tampil:</span>
            <select v-model="pageSize" class="form-select form-select-sm" style="min-width: 90px;" @change="currentPage = 1">
              <option :value="25">25 / hal</option>
              <option :value="50">50 / hal</option>
              <option :value="100">100 / hal</option>
              <option :value="250">250 / hal</option>
              <option :value="500">500 / hal</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>

        <!-- Search Input -->
        <div class="input-group input-group-sm" style="max-width: 320px;">
          <span class="input-group-text bg-light text-muted border-end-0">
            <i class="bi bi-search"></i>
          </span>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control border-start-0" 
            placeholder="Cari NISN atau Nama Siswa..."
            @input="currentPage = 1"
          />
          <button v-if="searchQuery" class="btn btn-outline-secondary" type="button" @click="searchQuery = ''; currentPage = 1">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Table View -->
      <div class="table-responsive">
        <table class="table table-hover table-eosis align-middle mb-0">
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">
                <input 
                  type="checkbox" 
                  class="form-check-input"
                  :checked="isAllSelectedOnPage" 
                  :indeterminate.prop="isIndeterminateOnPage"
                  @change="toggleSelectAllPage"
                  title="Pilih semua siswa di halaman ini"
                />
              </th>
              <th style="width: 60px;">No</th>
              <th>NISN / NIP</th>
              <th>Nama Lengkap</th>
              <th>Kategori</th>
              <th>Tanggal Lahir</th>
              <th>Kelas / Unit</th>
              <th>Status Hak Suara</th>
              <th style="width: 140px;" class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSiswaList.length === 0">
              <td colspan="8" class="text-center py-5 text-muted small">
                <i class="bi bi-person-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                Tidak ada data siswa yang cocok dengan kriteria pencarian / filter.
              </td>
            </tr>
            <tr v-for="(siswa, idx) in paginatedSiswaList" :key="siswa.id">
              <td class="text-center">
                <input 
                  type="checkbox" 
                  class="form-check-input"
                  :value="siswa.id"
                  v-model="selectedIds"
                />
              </td>
              <td class="font-mono-numbers text-muted">
                {{ pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1 }}
              </td>
              <td>
                <span class="font-mono-numbers fw-bold text-dark">{{ siswa.nisn }}</span>
              </td>
              <td>
                <span class="fw-semibold text-dark">{{ siswa.nama }}</span>
              </td>
              <td>
                <span 
                  class="badge border small"
                  :class="siswa.kategori === 'guru' ? 'bg-info-subtle text-info border-info-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'"
                >
                  {{ (siswa.kategori || 'siswa').toUpperCase() }}
                </span>
              </td>
              <td>
                <span class="text-muted small font-mono-numbers">{{ siswa.tanggal_lahir }}</span>
              </td>
              <td>
                <span class="badge bg-light text-dark border font-mono-numbers">
                  {{ siswa.kelas_nama || 'Umum' }}
                </span>
              </td>
              <td>
                <span 
                  class="badge d-inline-flex align-items-center gap-1"
                  :class="siswa.sudah_memilih ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                >
                  <i class="bi" :class="siswa.sudah_memilih ? 'bi-check-circle-fill' : 'bi-x-circle'"></i>
                  <span>{{ siswa.sudah_memilih ? 'Sudah Memilih' : 'Belum Memilih' }}</span>
                </span>
                <span v-if="siswa.waktu_memilih" class="d-block text-muted" style="font-size: 0.7rem;">
                  {{ formatTime(siswa.waktu_memilih) }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  <!-- Reset Status Hak Suara -->
                  <button 
                    v-if="siswa.sudah_memilih"
                    type="button" 
                    class="btn btn-outline-warning btn-sm py-1 px-2"
                    title="Reset Hak Suara Siswa"
                    @click="confirmResetVote(siswa)"
                  >
                    <i class="bi bi-arrow-counterclockwise"></i>
                  </button>

                  <!-- Edit -->
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm py-1 px-2"
                    title="Edit Data Siswa"
                    @click="openEditModal(siswa)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>

                  <!-- Hapus -->
                  <button 
                    type="button" 
                    class="btn btn-outline-danger btn-sm py-1 px-2"
                    title="Hapus Siswa"
                    @click="confirmDelete(siswa)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer & Pagination Navigation -->
      <div class="p-3 border-top bg-light d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-muted small">
        <div>
          <span>
            Menampilkan 
            <strong>{{ filteredSiswaList.length === 0 ? 0 : (pageSize === 'all' ? 1 : (currentPage - 1) * (pageSize as number) + 1) }}</strong>
            - 
            <strong>{{ pageSize === 'all' ? filteredSiswaList.length : Math.min(currentPage * (pageSize as number), filteredSiswaList.length) }}</strong>
            dari total 
            <strong>{{ filteredSiswaList.length.toLocaleString('id-ID') }}</strong> siswa (DPT: {{ siswaList.length.toLocaleString('id-ID') }})
          </span>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="d-flex align-items-center gap-2">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage = 1" title="Halaman Pertama">&laquo;</button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage--" title="Sebelumnya">&lsaquo;</button>
            </li>
            
            <li 
              v-for="p in visiblePages" 
              :key="p" 
              class="page-item"
              :class="{ active: p === currentPage, disabled: p === -1 }"
            >
              <button v-if="p !== -1" class="page-link" @click="currentPage = p">{{ p }}</button>
              <span v-else class="page-link border-0">...</span>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="currentPage++" title="Selanjutnya">&rsaquo;</button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="currentPage = totalPages" title="Halaman Terakhir">&raquo;</button>
            </li>
          </ul>

          <!-- Jump To Page -->
          <div class="d-flex align-items-center gap-1 ms-2 font-mono-numbers">
            <span>Hal:</span>
            <input 
              type="number" 
              class="form-control form-control-sm text-center py-0 px-1" 
              style="width: 55px;" 
              min="1" 
              :max="totalPages"
              :value="currentPage"
              @change="(e: any) => jumpToPage(Number(e.target.value))"
            />
            <span>/ {{ totalPages }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORM SISWA (TAMBAH / EDIT DENGAN CONTINUOUS ADDING) -->
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
            <div>
              <h5 class="modal-title fw-bold text-dark fs-6 mb-0">
                {{ isEditing ? 'Edit Data Siswa' : 'Tambah Siswa ke DPT' }}
              </h5>
              <small class="text-muted" style="font-size: 0.75rem;">
                Total DPT saat ini: {{ siswaList.length.toLocaleString('id-ID') }} siswa • Kapasitas Tak Terbatas
              </small>
            </div>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <form @submit.prevent="saveSiswa(false)">
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
                    v-if="!isEditing"
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
                    <input class="form-check-input" type="radio" v-model="formData.kategori" value="siswa" id="katSiswa">
                    <label class="form-check-label small" for="katSiswa">Siswa</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="formData.kategori" value="guru" id="katGuru">
                    <label class="form-check-label small" for="katGuru">Guru / Staf</label>
                  </div>
                </div>
              </div>

              <!-- Kelas / Unit -->
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

              <!-- Status Memilih (Khusus Edit) -->
              <div v-if="isEditing" class="mb-3">
                <label class="form-label fw-semibold small text-secondary">Status Hak Suara</label>
                <div class="form-check form-switch">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="switchSudahMemilih"
                    v-model="formData.sudah_memilih"
                  />
                  <label class="form-check-label small" for="switchSudahMemilih">
                    {{ formData.sudah_memilih ? 'Sudah Menggunakan Hak Suara' : 'Belum Memilih' }}
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer bg-light border-top d-flex justify-content-between">
              <button type="button" class="btn btn-secondary btn-sm" @click="showModal = false">Batal</button>
              
              <div class="d-flex gap-2">
                <!-- Simpan & Tambah Siswa Lagi (Continuous Rapid Adding) -->
                <button 
                  v-if="!isEditing"
                  type="button" 
                  class="btn btn-outline-primary btn-sm px-3"
                  @click="saveSiswa(true)"
                >
                  <i class="bi bi-plus-circle me-1"></i>Simpan & Tambah Lagi
                </button>

                <!-- Simpan & Selesai / Tutup -->
                <button type="submit" class="btn btn-primary btn-sm px-3" style="background-color: #1d4ed8;">
                  <i class="bi bi-check-lg me-1"></i>{{ isEditing ? 'Simpan Perubahan' : 'Simpan & Tutup' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL GENERATOR DPT MASSAL TAK TERBATAS -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showGeneratorModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showGeneratorModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <div>
              <h5 class="modal-title fw-bold text-dark fs-6 mb-0">
                <i class="bi bi-magic me-1 text-success"></i>
                Generator DPT Siswa Massal Tak Terbatas
              </h5>
              <small class="text-muted" style="font-size: 0.75rem;">
                Tambahkan puluhan, ratusan, atau ribuan data pemilih instan secara otomatis
              </small>
            </div>
            <button type="button" class="btn-close" @click="showGeneratorModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="alert alert-info py-2 px-3 small border-info-subtle mb-3">
              <i class="bi bi-info-circle-fill me-1"></i>
              Generator ini akan menghasilkan siswa dengan nama asli pelajar Indonesia, NISN 10-digit valid unik, dan mendistribusikannya ke kelas terpilih dengan status <strong>Belum Memilih</strong>.
            </div>

            <!-- Preset Jumlah -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Pilih Jumlah Siswa:</label>
              <div class="d-flex flex-wrap gap-2 mb-2">
                <button 
                  v-for="amt in [50, 100, 250, 500, 1000]" 
                  :key="amt" 
                  type="button" 
                  class="btn btn-sm"
                  :class="generatorCount === amt ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="generatorCount = amt"
                >
                  +{{ amt }} Siswa
                </button>
              </div>
              <div class="input-group input-group-sm">
                <span class="input-group-text">Atau Masukkan Jumlah Kustom:</span>
                <input 
                  v-model.number="generatorCount" 
                  type="number" 
                  min="1" 
                  max="100000" 
                  class="form-control font-mono-numbers" 
                  placeholder="Contoh: 1500"
                />
              </div>
            </div>

            <!-- Target Kelas -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Kategori & Distribusi:</label>
              <div class="row g-2">
                <div class="col-6">
                  <select v-model="generatorKategori" class="form-select form-select-sm">
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru / Staf</option>
                  </select>
                </div>
                <div class="col-6">
                  <select v-model="generatorKelas" class="form-select form-select-sm">
                    <option value="all">Bagi Rata</option>
                    <option v-for="k in kelasList" :key="k.id" :value="k.id">
                      {{ k.nama_kelas }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="generatorLoading" class="text-center py-3">
              <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
              <p class="small text-muted mb-0">Sedang memproses pembuatan {{ generatorCount }} data siswa...</p>
            </div>

            <div v-if="generatorResult" class="alert alert-success py-2 px-3 small border-success-subtle mb-0">
              <i class="bi bi-check-circle-fill me-1"></i>{{ generatorResult }}
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-secondary btn-sm" @click="showGeneratorModal = false" :disabled="generatorLoading">
              Tutup
            </button>
            <button 
              type="button" 
              class="btn btn-success btn-sm px-3" 
              @click="processGenerator" 
              :disabled="generatorLoading || generatorCount <= 0"
            >
              <i class="bi bi-lightning-charge-fill me-1"></i>Generate Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL IMPORT DATA CSV / EXCEL MASSAL TAK TERBATAS -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showImportModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showImportModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <div>
              <h5 class="modal-title fw-bold text-dark fs-6 mb-0">
                <i class="bi bi-file-earmark-arrow-up me-1 text-primary"></i>
                Import Data Siswa / DPT Tak Terbatas dari CSV / Excel
              </h5>
              <small class="text-muted" style="font-size: 0.75rem;">
                Mendukung upload ribuan baris data sekaligus tanpa batas
              </small>
            </div>
            <button type="button" class="btn-close" @click="showImportModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-3">
              Pilih file (<strong>.xlsx, .xls, .csv, .tsv, .txt</strong>) atau tempelkan (paste) langsung dari <strong>Excel / Google Sheets</strong>.
            </p>

            <div class="row g-3 mb-3">
              <!-- File Upload Input -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-secondary">1. Upload File Excel / CSV:</label>
                <input 
                  type="file" 
                  accept=".csv,.txt,.tsv,.xlsx,.xls" 
                  class="form-control form-control-sm" 
                  @change="handleFileUpload"
                />
                <small class="text-muted" style="font-size: 0.72rem;">Mendukung .xlsx, .xls, .csv, .txt</small>
              </div>

              <!-- Pilihan Kelas Tujuan -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-secondary">
                  2. Pilihan Kelas Tujuan:
                </label>
                <select v-model="importTargetKelas" class="form-select form-select-sm">
                  <option value="auto">Deteksi Otomatis dari Kolom Kelas di Data</option>
                  <option v-for="k in kelasList" :key="k.id" :value="k.id">
                    Tetapkan Semua Masuk ke Kelas {{ k.nama_kelas }} (Tingkat {{ k.tingkat }})
                  </option>
                </select>
                <small class="text-muted" style="font-size: 0.72rem;">
                  Pilih jika file Anda tidak memiliki kolom kelas.
                </small>
              </div>
            </div>

            <!-- Format Petunjuk & Contoh -->
            <div class="p-2 bg-light rounded border mb-3 small font-mono-numbers">
              <span class="text-muted d-block mb-1">Format Kolom (Pemisah Koma, Tab Excel, atau Titik Koma):</span>
              <code>NISN, Nama Lengkap, Tanggal Lahir (YYYY-MM-DD), Kelas</code><br/>
              <span class="text-secondary" style="font-size: 0.75rem;">Contoh baris data:</span><br/>
              0081234501, Aditya Dimas, 2011-04-12, 7-A<br/>
              0081234502, Bella Safitri, 2011-06-25, 7-A
            </div>

            <!-- Textarea Data -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label fw-semibold small text-secondary mb-0">Atau Tempelkan (Paste) Teks dari Excel:</label>
                <span class="badge bg-primary-subtle text-primary border font-mono-numbers">
                  {{ parsedPreview.length }} siswa valid terdeteksi
                </span>
              </div>
              <textarea 
                v-model="csvText" 
                rows="5" 
                class="form-control font-mono-numbers small" 
                placeholder="0081234501&#9;Aditya Dimas&#9;2011-04-12&#9;7-A&#10;0081234502&#9;Bella Safitri&#9;2011-06-25&#9;7-A"
              ></textarea>
            </div>

            <!-- Pratinjau Data yang Terdeteksi -->
            <div v-if="parsedPreview.length > 0" class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold small text-secondary">
                  <i class="bi bi-eye me-1"></i>Pratinjau Data Siap Impor ({{ parsedPreview.length }} Baris Terbaca):
                </span>
                <small class="text-muted font-mono-numbers" style="font-size: 0.72rem;">Menampilkan maks 5 sampel</small>
              </div>
              <div class="table-responsive rounded border bg-white" style="max-height: 160px;">
                <table class="table table-sm table-striped align-middle mb-0 font-mono-numbers" style="font-size: 0.75rem;">
                  <thead class="table-light">
                    <tr>
                      <th>No</th>
                      <th>NISN</th>
                      <th>Nama Lengkap</th>
                      <th>Tgl Lahir (Password)</th>
                      <th>Kelas Tujuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(p, pIdx) in parsedPreview.slice(0, 5)" :key="pIdx">
                      <td>{{ pIdx + 1 }}</td>
                      <td class="fw-bold">{{ p.nisn }}</td>
                      <td>{{ p.nama }}</td>
                      <td>{{ p.tanggal_lahir }}</td>
                      <td>
                        <span class="badge bg-secondary-subtle text-secondary border">
                          {{ p.nama_kelas }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Opsi Update Duplikat -->
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="checkUpdateIfExists" v-model="updateIfExists">
              <label class="form-check-label small text-secondary" for="checkUpdateIfExists">
                Perbarui nama, tanggal lahir, dan kelas jika NISN sudah terdaftar sebelumnya (Mode Sinkronisasi / Update)
              </label>
            </div>

            <div v-if="importLoading" class="text-center py-2">
              <div class="spinner-border text-primary spinner-border-sm mb-1" role="status"></div>
              <p class="small text-muted mb-0">Sedang memproses dan menyimpan data siswa ke sistem & Supabase...</p>
            </div>

            <div v-if="importResult" class="alert alert-info py-2 px-3 small border-info-subtle mb-0">
              <i class="bi bi-info-circle-fill me-1"></i>{{ importResult }}
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-secondary btn-sm" @click="showImportModal = false" :disabled="importLoading">
              Tutup
            </button>
            <button 
              type="button" 
              class="btn btn-primary btn-sm px-3" 
              @click="processImport" 
              :disabled="parsedPreview.length === 0 || importLoading" 
              style="background-color: #1d4ed8;"
            >
              <i class="bi bi-upload me-1"></i>Proses Import Data ({{ parsedPreview.length }} Siswa)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRM DELETE SINGLE SISWA -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showDeleteModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showDeleteModal && siswaToDelete"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-4">
            <i class="bi bi-trash-fill fs-1 text-danger mb-2 d-block"></i>
            <h5 class="fw-bold mb-1">Hapus Siswa?</h5>
            <p class="text-muted small mb-4">
              Apakah Anda yakin ingin menghapus data siswa <strong>{{ siswaToDelete.nama }}</strong> (NISN: {{ siswaToDelete.nisn }}) dari DPT?
            </p>
            <div class="d-flex gap-2 justify-content-center">
              <button type="button" class="btn btn-outline-secondary btn-sm px-3" @click="showDeleteModal = false">
                Batal
              </button>
              <button type="button" class="btn btn-danger btn-sm px-3" @click="deleteSiswa">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRM GENERIC ACTION (RESET PEMILIH / RESET SISWA / BULK ACTIONS) -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showActionConfirmModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(2px);"
      v-if="showActionConfirmModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-bottom py-3" :class="actionConfirmColorClass">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2 mb-0">
              <i :class="actionConfirmIcon"></i>
              <span>{{ actionConfirmTitle }}</span>
            </h5>
            <button type="button" class="btn-close" @click="closeActionConfirmModal" :disabled="actionLoading"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-3">{{ actionConfirmMessage }}</p>
            
            <div v-if="actionConfirmType === 'clear-all-siswa'" class="mb-3">
              <label class="form-label small fw-semibold text-danger">Ketik "KOSONGKAN" untuk konfirmasi penghapusan DPT:</label>
              <input v-model="actionInput" type="text" class="form-control form-control-sm text-uppercase font-monospace" placeholder="KOSONGKAN" />
            </div>

            <div v-if="actionConfirmType === 'reset-all-pemilih'" class="mb-3">
              <label class="form-label small fw-semibold text-secondary">Ketik "RESET" untuk konfirmasi pengosongan suara & reset pemilih:</label>
              <input v-model="actionInput" type="text" class="form-control form-control-sm text-uppercase font-monospace" placeholder="RESET" />
            </div>

            <div v-if="actionLoading" class="text-center py-2">
              <div class="spinner-border text-primary spinner-border-sm mb-1" role="status"></div>
              <p class="small text-muted mb-0">Sedang memproses dan menyinkronkan data di database...</p>
            </div>
          </div>
          <div class="modal-footer bg-light border-top py-2" v-if="!actionLoading">
            <button type="button" class="btn btn-secondary btn-sm px-3" @click="closeActionConfirmModal">Batal</button>
            <button 
              type="button" 
              class="btn btn-sm px-4 fw-semibold"
              :class="actionConfirmBtnClass"
              :disabled="isActionConfirmDisabled"
              @click="processActionConfirm"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { dbService } from '../../services/db';
import type { Siswa, Kelas } from '../../types';
import * as XLSX from 'xlsx';
import { parseStudentText } from '../../utils/studentParser';

const siswaList = ref<Siswa[]>([]);
const kelasList = ref<Kelas[]>([]);

const filterKelas = ref('all');
const filterStatus = ref<'all' | 'sudah' | 'belum'>('all');
const filterKategori = ref<'all' | 'siswa' | 'guru'>('all');
const searchQuery = ref('');
const alertMessage = ref('');

// Pagination State
const currentPage = ref(1);
const pageSize = ref<number | 'all'>(50);

// Multi Selection State
const selectedIds = ref<string[]>([]);

// Modal Form Siswa
const showModal = ref(false);
const isEditing = ref(false);
const formError = ref('');
const formSuccessMessage = ref('');
const nisnInputRef = ref<HTMLInputElement | null>(null);

const formData = ref<{
  id?: string;
  nisn: string;
  nama: string;
  tanggal_lahir: string;
  kelas_id: string;
  sudah_memilih: boolean;
  kategori: 'siswa' | 'guru';
}>({
  nisn: '',
  nama: '',
  tanggal_lahir: '2011-01-01',
  kelas_id: '',
  sudah_memilih: false,
  kategori: 'siswa'
});

// Import modal
const showImportModal = ref(false);
const csvText = ref('');
const importTargetKelas = ref('auto');
const importResult = ref('');
const importLoading = ref(false);
const updateIfExists = ref(false);

// Generator modal
const showGeneratorModal = ref(false);
const generatorCount = ref(100);
const generatorKelas = ref('all');
const generatorKategori = ref<'siswa' | 'guru'>('siswa');
const generatorLoading = ref(false);
const generatorResult = ref('');

// Delete modal
const showDeleteModal = ref(false);
const siswaToDelete = ref<Siswa | null>(null);

// Generic Action Modal (Reset Pemilih / Siswa / Bulk)
type ActionType = 'reset-all-pemilih' | 'reset-kelas-pemilih' | 'reset-default-siswa' | 'clear-all-siswa' | 'reset-selected-votes' | 'delete-selected' | 'reset-single-vote';
const showActionConfirmModal = ref(false);
const actionConfirmTitle = ref('');
const actionConfirmMessage = ref('');
const actionConfirmType = ref<ActionType | null>(null);
const actionTargetSiswa = ref<Siswa | null>(null);
const actionLoading = ref(false);
const actionInput = ref('');

const actionConfirmColorClass = computed(() => {
  if (actionConfirmType.value === 'clear-all-siswa' || actionConfirmType.value === 'delete-selected') return 'bg-danger text-white';
  if (actionConfirmType.value === 'reset-all-pemilih' || actionConfirmType.value === 'reset-selected-votes' || actionConfirmType.value === 'reset-single-vote') return 'bg-warning-subtle text-dark';
  return 'bg-primary text-white';
});

const actionConfirmBtnClass = computed(() => {
  if (actionConfirmType.value === 'clear-all-siswa' || actionConfirmType.value === 'delete-selected') return 'btn-danger';
  if (actionConfirmType.value === 'reset-all-pemilih' || actionConfirmType.value === 'reset-selected-votes' || actionConfirmType.value === 'reset-single-vote') return 'btn-warning';
  return 'btn-primary';
});

const actionConfirmIcon = computed(() => {
  if (actionConfirmType.value === 'clear-all-siswa' || actionConfirmType.value === 'delete-selected') return 'bi bi-trash-fill';
  if (actionConfirmType.value === 'reset-all-pemilih' || actionConfirmType.value === 'reset-selected-votes' || actionConfirmType.value === 'reset-single-vote') return 'bi bi-arrow-counterclockwise';
  return 'bi bi-arrow-repeat';
});

const isActionConfirmDisabled = computed(() => {
  if (actionLoading.value) return true;
  if (actionConfirmType.value === 'clear-all-siswa') {
    return actionInput.value.trim().toUpperCase() !== 'KOSONGKAN';
  }
  if (actionConfirmType.value === 'reset-all-pemilih') {
    return actionInput.value.trim().toUpperCase() !== 'RESET';
  }
  return false;
});

function closeActionConfirmModal() {
  if (actionLoading.value) return;
  showActionConfirmModal.value = false;
  actionConfirmType.value = null;
  actionTargetSiswa.value = null;
  actionInput.value = '';
}

async function loadData() {
  kelasList.value = await dbService.getKelasList();
  siswaList.value = await dbService.getSiswaList();
}

const countSudah = computed(() => siswaList.value.filter(s => s.sudah_memilih).length);
const countBelum = computed(() => siswaList.value.filter(s => !s.sudah_memilih).length);

const filteredSiswaList = computed(() => {
  return siswaList.value.filter(s => {
    const matchKelas = filterKelas.value === 'all' || s.kelas_id === filterKelas.value;
    const matchStatus = filterStatus.value === 'all' || 
      (filterStatus.value === 'sudah' && s.sudah_memilih) ||
      (filterStatus.value === 'belum' && !s.sudah_memilih);
    const matchKategori = filterKategori.value === 'all' || (s.kategori || 'siswa') === filterKategori.value;
    const matchSearch = searchQuery.value === '' || 
      s.nama.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.nisn.includes(searchQuery.value.trim());

    return matchKelas && matchStatus && matchKategori && matchSearch;
  });
});

// Pagination Calculations
const totalPages = computed(() => {
  if (pageSize.value === 'all' || filteredSiswaList.value.length === 0) return 1;
  return Math.ceil(filteredSiswaList.value.length / (pageSize.value as number));
});

const paginatedSiswaList = computed(() => {
  if (pageSize.value === 'all') return filteredSiswaList.value;
  const start = (currentPage.value - 1) * (pageSize.value as number);
  const end = start + (pageSize.value as number);
  return filteredSiswaList.value.slice(start, end);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push(-1); // ellipsis
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(-1); // ellipsis
  }

  pages.push(total);
  return pages;
});

function jumpToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

// Selection logic
const isAllSelectedOnPage = computed(() => {
  if (paginatedSiswaList.value.length === 0) return false;
  return paginatedSiswaList.value.every(s => selectedIds.value.includes(s.id));
});

const isIndeterminateOnPage = computed(() => {
  const onPageSelected = paginatedSiswaList.value.filter(s => selectedIds.value.includes(s.id));
  return onPageSelected.length > 0 && onPageSelected.length < paginatedSiswaList.value.length;
});

function toggleSelectAllPage() {
  const currentIds = paginatedSiswaList.value.map(s => s.id);
  if (isAllSelectedOnPage.value) {
    selectedIds.value = selectedIds.value.filter(id => !currentIds.includes(id));
  } else {
    const combined = new Set([...selectedIds.value, ...currentIds]);
    selectedIds.value = Array.from(combined);
  }
}

function clearSelection() {
  selectedIds.value = [];
}

async function confirmResetSelectedVotes() {
  if (selectedIds.value.length === 0) return;
  actionConfirmType.value = 'reset-selected-votes';
  actionConfirmTitle.value = 'Reset Hak Suara Siswa Terpilih';
  actionConfirmMessage.value = `Apakah Anda yakin ingin mereset status hak suara untuk ${selectedIds.value.length} siswa terpilih menjadi BELUM MEMILIH?`;
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

async function confirmDeleteSelected() {
  if (selectedIds.value.length === 0) return;
  actionConfirmType.value = 'delete-selected';
  actionConfirmTitle.value = 'Hapus Siswa Terpilih';
  actionConfirmMessage.value = `PERINGATAN: Apakah Anda yakin ingin menghapus ${selectedIds.value.length} siswa terpilih secara permanen dari DPT?`;
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

function formatTime(isoStr?: string | null) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  } catch {
    return '';
  }
}

async function openAddModal() {
  if (kelasList.value.length === 0) {
    kelasList.value = await dbService.getKelasList();
  }
  isEditing.value = false;
  formError.value = '';
  formSuccessMessage.value = '';
  formData.value = {
    nisn: '',
    nama: '',
    tanggal_lahir: '2011-01-01',
    kelas_id: kelasList.value[0]?.id || '',
    sudah_memilih: false,
    kategori: 'siswa'
  };
  showModal.value = true;
  nextTick(() => {
    nisnInputRef.value?.focus();
  });
}

function generateNextNisn() {
  // Ambil NISN terakhir dari daftar siswa atau buat acak
  const currentMax = siswaList.value
    .map(s => parseInt(s.nisn))
    .filter(n => !isNaN(n) && n > 100000000)
    .sort((a, b) => b - a)[0];

  if (currentMax) {
    formData.value.nisn = String(currentMax + 1).padStart(10, '0');
  } else {
    formData.value.nisn = '008' + Math.floor(1000000 + Math.random() * 9000000);
  }
}

function openEditModal(siswa: Siswa) {
  isEditing.value = true;
  formError.value = '';
  formSuccessMessage.value = '';
  formData.value = {
    id: siswa.id,
    nisn: siswa.nisn,
    nama: siswa.nama,
    tanggal_lahir: siswa.tanggal_lahir,
    kelas_id: siswa.kelas_id,
    sudah_memilih: siswa.sudah_memilih,
    kategori: siswa.kategori || 'siswa'
  };
  showModal.value = true;
}

async function saveSiswa(continuous: boolean = false) {
  formError.value = '';
  formSuccessMessage.value = '';

  if (!formData.value.nisn || !formData.value.nama || !formData.value.tanggal_lahir) {
    formError.value = 'NISN, Nama, dan Tanggal Lahir wajib diisi.';
    return;
  }

  try {
    const savedName = formData.value.nama;
    await dbService.saveSiswa({
      id: formData.value.id,
      nisn: formData.value.nisn,
      nama: formData.value.nama,
      tanggal_lahir: formData.value.tanggal_lahir,
      kelas_id: formData.value.kelas_id,
      sudah_memilih: formData.value.sudah_memilih,
      kategori: formData.value.kategori
    });

    await loadData();

    if (continuous && !isEditing.value) {
      // Auto-increment NISN jika numerik untuk kemudahan admin
      const numericNisn = parseInt(formData.value.nisn);
      const nextNisn = !isNaN(numericNisn) ? String(numericNisn + 1).padStart(10, '0') : '';

      formSuccessMessage.value = `Siswa ${savedName} berhasil ditambahkan! Silakan masukkan siswa berikutnya.`;
      
      // Kosongkan nama, gunakan NISN berikutnya, pertahankan kelas
      formData.value.nisn = nextNisn;
      formData.value.nama = '';
      
      nextTick(() => {
        nisnInputRef.value?.focus();
      });
    } else {
      alertMessage.value = isEditing.value
        ? `Data siswa ${savedName} berhasil diperbarui.`
        : `Siswa ${savedName} berhasil didaftarkan ke DPT.`;
      showModal.value = false;
    }
  } catch (err: any) {
    formError.value = err.message || 'Gagal menyimpan data siswa.';
  }
}

function confirmDelete(siswa: Siswa) {
  siswaToDelete.value = siswa;
  showDeleteModal.value = true;
}

async function deleteSiswa() {
  if (!siswaToDelete.value) return;
  try {
    await dbService.deleteSiswa(siswaToDelete.value.id);
    alertMessage.value = `Siswa ${siswaToDelete.value.nama} berhasil dihapus dari DPT.`;
    showDeleteModal.value = false;
    siswaToDelete.value = null;
    await loadData();
  } catch (err: any) {
    alert(err.message || 'Gagal menghapus siswa.');
  }
}

function confirmResetVote(siswa: Siswa) {
  actionTargetSiswa.value = siswa;
  actionConfirmType.value = 'reset-single-vote';
  actionConfirmTitle.value = 'Reset Hak Suara Siswa';
  actionConfirmMessage.value = `Apakah Anda yakin ingin mereset hak suara siswa ${siswa.nama} (NISN: ${siswa.nisn}) menjadi BELUM MEMILIH?`;
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

function confirmResetAllPemilih() {
  actionConfirmType.value = 'reset-all-pemilih';
  actionConfirmTitle.value = 'Reset Hak Suara Seluruh Pemilih';
  actionConfirmMessage.value = 'PERINGATAN: Tindakan ini akan mengembalikan status SELURUH PEMILIH menjadi BELUM MEMILIH, mengosongkan perolehan suara paslon (0), dan menghapus bersih seluruh rekaman pada tabel votes dan suara di Supabase. Data biodata siswa tetap aman.';
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

function confirmResetKelasPemilih() {
  if (filterKelas.value === 'all') return;
  const targetKelas = kelasList.value.find(k => k.id === filterKelas.value);
  const namaKelas = targetKelas?.nama_kelas || 'kelas terpilih';

  actionConfirmType.value = 'reset-kelas-pemilih';
  actionConfirmTitle.value = `Reset Pemilih Kelas ${namaKelas}`;
  actionConfirmMessage.value = `Apakah Anda yakin ingin mereset status pemilih hanya untuk rombel kelas ${namaKelas} menjadi BELUM MEMILIH?`;
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

function confirmResetSiswaDefault() {
  actionConfirmType.value = 'reset-default-siswa';
  actionConfirmTitle.value = 'Pulihkan Data Siswa Default';
  actionConfirmMessage.value = 'Apakah Anda yakin ingin memulihkan data DPT ke daftar siswa default awal SMP Negeri 2 Kota Bogor? Seluruh perolehan suara dan data votes di Supabase akan diatur ulang.';
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

function confirmClearAllSiswa() {
  actionConfirmType.value = 'clear-all-siswa';
  actionConfirmTitle.value = 'Kosongkan Seluruh Data Siswa (DPT)';
  actionConfirmMessage.value = 'BAHAYA: Seluruh data siswa akan dihapus secara permanen dari sistem dan cloud Supabase. Rekaman di tabel votes juga akan dibersihkan.';
  actionInput.value = '';
  showActionConfirmModal.value = true;
}

async function processActionConfirm() {
  if (!actionConfirmType.value) return;
  actionLoading.value = true;
  alertMessage.value = '';

  try {
    if (actionConfirmType.value === 'reset-single-vote' && actionTargetSiswa.value) {
      await dbService.resetHakSuaraSiswa(actionTargetSiswa.value.id);
      alertMessage.value = `Hak suara siswa ${actionTargetSiswa.value.nama} berhasil direset menjadi Belum Memilih.`;
    } else if (actionConfirmType.value === 'reset-selected-votes') {
      const count = await dbService.resetHakSuaraMultipleSiswa(selectedIds.value);
      alertMessage.value = `Berhasil mereset hak suara ${count} siswa terpilih menjadi Belum Memilih.`;
      clearSelection();
    } else if (actionConfirmType.value === 'delete-selected') {
      const deletedCount = await dbService.deleteMultipleSiswa(selectedIds.value);
      alertMessage.value = `Berhasil menghapus ${deletedCount} siswa terpilih dari DPT.`;
      clearSelection();
    } else if (actionConfirmType.value === 'reset-all-pemilih') {
      const res = await dbService.resetPemilihStatus();
      alertMessage.value = `Berhasil mereset hak suara seluruh pemilih. Sebanyak ${res.count} data pemilih telah dikembalikan menjadi Belum Memilih dan tabel votes di Supabase telah dibersihkan.`;
    } else if (actionConfirmType.value === 'reset-kelas-pemilih') {
      const targetKelas = kelasList.value.find(k => k.id === filterKelas.value);
      const namaKelas = targetKelas?.nama_kelas || 'kelas terpilih';
      const res = await dbService.resetPemilihStatus(filterKelas.value);
      alertMessage.value = `Hak suara siswa kelas ${namaKelas} berhasil direset (${res.count} siswa).`;
    } else if (actionConfirmType.value === 'reset-default-siswa') {
      await dbService.resetSiswaToDefault();
      alertMessage.value = 'Data siswa (DPT) berhasil dipulihkan ke data standar bawaan SMPN 2 Kota Bogor dan rekaman votes dibersihkan.';
    } else if (actionConfirmType.value === 'clear-all-siswa') {
      await dbService.clearAllSiswa();
      alertMessage.value = 'Seluruh data siswa DPT dan data suara pada tabel votes di Supabase berhasil dikosongkan.';
    }

    closeActionConfirmModal();
    await loadData();
  } catch (err: any) {
    alertMessage.value = 'Gagal memproses aksi: ' + (err.message || 'Terjadi kesalahan');
    closeActionConfirmModal();
  } finally {
    actionLoading.value = false;
  }
}

// ====================== IMPORT LOGIC ======================
const detectedRowCount = computed(() => {
  if (!csvText.value.trim()) return 0;
  return csvText.value.split('\n').filter(l => l.trim().length > 0).length;
});

const parsedPreview = computed(() => {
  if (!csvText.value.trim()) return [];
  const { parsed } = parseStudentText(csvText.value, importTargetKelas.value, kelasList.value);
  return parsed;
});

async function openImportModal() {
  if (kelasList.value.length === 0) {
    kelasList.value = await dbService.getKelasList();
  }
  csvText.value = '';
  importTargetKelas.value = 'auto';
  importResult.value = '';
  importLoading.value = false;
  showImportModal.value = true;
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      csvText.value = XLSX.utils.sheet_to_csv(worksheet);
    } catch (e: any) {
      alertMessage.value = 'Gagal membaca berkas Excel: ' + (e.message || 'Format tidak didukung');
    }
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      csvText.value = (e.target?.result as string) || '';
    };
    reader.readAsText(file);
  }
}

async function processImport() {
  importLoading.value = true;
  importResult.value = '';

  try {
    const { parsed, headersSkipped } = parseStudentText(csvText.value, importTargetKelas.value, kelasList.value);

    if (parsed.length === 0) {
      importResult.value = 'Tidak ada baris data siswa yang valid terdeteksi. Pastikan data minimal berisi: NISN dan Nama Siswa.';
      importLoading.value = false;
      return;
    }

    const res = await dbService.importSiswaBatch(parsed, updateIfExists.value, importTargetKelas.value);
    
    // Temukan nama kelas tujuan jika spesifik
    const targetK = kelasList.value.find(k => k.id === importTargetKelas.value);
    const kelasInfo = targetK ? ` ke rombel Kelas ${targetK.nama_kelas}` : '';

    importResult.value = `Berhasil! Sukses menambahkan ${res.imported} siswa baru${kelasInfo}, dan memperbarui ${res.updated} siswa. Total DPT tersimpan saat ini: ${res.total} siswa. (${res.skipped} baris dilewati${headersSkipped ? ', baris judul dilewati otomatis' : ''}).`;
    alertMessage.value = `Sukses mengimpor ${res.imported} data siswa${kelasInfo}! Total DPT terdaftar: ${res.total} siswa.`;
    await loadData();
  } catch (err: any) {
    importResult.value = `Gagal memproses import data: ${err.message || 'Terjadi kesalahan sistem'}`;
  } finally {
    importLoading.value = false;
  }
}

// ====================== BULK GENERATOR LOGIC ======================
function openGeneratorModal() {
  generatorResult.value = '';
  generatorLoading.value = false;
  showGeneratorModal.value = true;
}

async function processGenerator() {
  if (generatorCount.value <= 0) return;
  generatorLoading.value = true;
  generatorResult.value = '';

  try {
    const res = await dbService.generateBulkSiswa(generatorCount.value, generatorKelas.value, generatorKategori.value);
    const label = generatorKategori.value === 'guru' ? 'guru/staf' : 'siswa';
    generatorResult.value = `Berhasil meng-generate ${res.generated.toLocaleString('id-ID')} ${label} baru! Total DPT sekarang: ${res.totalNow.toLocaleString('id-ID')} pemilih.`;
    alertMessage.value = `Berhasil menambahkan ${res.generated.toLocaleString('id-ID')} ${label} otomatis ke DPT. Total pemilih terdaftar: ${res.totalNow.toLocaleString('id-ID')}.`;
    await loadData();
  } catch (err: any) {
    generatorResult.value = `Gagal generate siswa: ${err.message || 'Terjadi kesalahan'}`;
  } finally {
    generatorLoading.value = false;
  }
}

function exportCSV() {
  const header = ['NISN', 'Nama Lengkap', 'Tanggal Lahir', 'Kelas', 'Status Memilih', 'Waktu Memilih'];
  const rows = siswaList.value.map(s => [
    `"${s.nisn}"`,
    `"${s.nama}"`,
    `"${s.tanggal_lahir}"`,
    `"${s.kelas_nama || ''}"`,
    `"${s.sudah_memilih ? 'SUDAH' : 'BELUM'}"`,
    `"${s.waktu_memilih || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `DPT_eOSIS_SMPN2_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  loadData();
});
</script>
