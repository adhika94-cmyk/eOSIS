<template>
  <div>
    <!-- Toast Feedback Notifikasi -->
    <div 
      v-if="toastMessage" 
      class="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-3 shadow-sm no-print"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-check-circle-fill text-success fs-5"></i>
        <span class="small fw-semibold">{{ toastMessage }}</span>
      </div>
      <button type="button" class="btn-close btn-close-sm" @click="toastMessage = ''"></button>
    </div>

    <!-- Page Header (Hidden when printing) -->
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 no-print">
      <div>
        <h1 class="h4 fw-bold text-dark mb-1">Perolehan & Rekapitulasi Suara</h1>
        <p class="text-muted small mb-0">
          Tabulasi hasil penghitungan suara real-time & arsip rekapitulasi resmi Pemilihan OSIS {{ settings.nama_sekolah }}
        </p>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <!-- Auto Refresh Toggle -->
        <button 
          type="button" 
          class="btn btn-sm d-flex align-items-center gap-1"
          :class="isAutoRefresh ? 'btn-success' : 'btn-outline-secondary'"
          @click="toggleAutoRefresh"
          title="Nyalakan/matikan pembaharuan data otomatis setiap 4 detik"
        >
          <i class="bi" :class="isAutoRefresh ? 'bi-arrow-repeat spin-icon' : 'bi-arrow-repeat'"></i>
          <span>{{ isAutoRefresh ? 'Live ON' : 'Live OFF' }}</span>
        </button>

        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="refreshData">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Segarkan</span>
        </button>

        <!-- Dropdown / Group Ekspor Hasil Pemilihan -->
        <div class="btn-group" role="group">
          <!-- Tombol Utama Ekspor PDF (Berita Acara Resmi) -->
          <button 
            type="button" 
            class="btn btn-danger btn-sm d-flex align-items-center gap-1 text-white shadow-sm"
            @click="handleExportPdf"
            title="Ekspor dokumen formal Berita Acara ke format PDF atau Cetak A4"
          >
            <i class="bi bi-file-earmark-pdf-fill"></i>
            <span class="fw-medium">Ekspor PDF (Berita Acara)</span>
          </button>

          <!-- Tombol Ekspor Excel (.xls) -->
          <button 
            type="button" 
            class="btn btn-success btn-sm d-flex align-items-center gap-1 text-white shadow-sm"
            @click="handleExportExcel"
            title="Ekspor tabel rekapitulasi lengkap ke format Microsoft Excel (.xls)"
          >
            <i class="bi bi-file-earmark-excel-fill"></i>
            <span class="fw-medium">Ekspor Excel</span>
          </button>

          <!-- Tombol Opsi Tambahan -->
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm dropdown-toggle dropdown-toggle-split" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
            @click="showExportDropdown = !showExportDropdown"
          >
            <span class="visually-hidden">Toggle Dropdown</span>
          </button>

          <!-- Dropdown Menu -->
          <ul 
            class="dropdown-menu dropdown-menu-end shadow-sm"
            :class="{ 'show d-block': showExportDropdown }"
            style="min-width: 230px;"
          >
            <li>
              <h6 class="dropdown-header text-uppercase small fw-bold">Pilihan Format Arsip</h6>
            </li>
            <li>
              <button class="dropdown-item d-flex align-items-center gap-2 py-2" @click="handleExportPdf(); showExportDropdown = false;">
                <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                <div>
                  <span class="d-block fw-semibold small">Dokumen PDF Berita Acara</span>
                  <small class="text-muted" style="font-size: 0.75rem;">Kop surat, tanda tangan & siap cetak</small>
                </div>
              </button>
            </li>
            <li>
              <button class="dropdown-item d-flex align-items-center gap-2 py-2" @click="handleExportExcel(); showExportDropdown = false;">
                <i class="bi bi-file-earmark-excel-fill text-success fs-5"></i>
                <div>
                  <span class="d-block fw-semibold small">Buku Kerja Excel (.xls)</span>
                  <small class="text-muted" style="font-size: 0.75rem;">Format spreadsheet ber-styling formal</small>
                </div>
              </button>
            </li>
            <li>
              <button class="dropdown-item d-flex align-items-center gap-2 py-2" @click="handleExportCsv(); showExportDropdown = false;">
                <i class="bi bi-file-earmark-text-fill text-primary fs-5"></i>
                <div>
                  <span class="d-block fw-semibold small">File CSV Data Mentah</span>
                  <small class="text-muted" style="font-size: 0.75rem;">Standar UTF-8 BOM untuk olah data</small>
                </div>
              </button>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item d-flex align-items-center gap-2 py-2" @click="openPreviewModal(); showExportDropdown = false;">
                <i class="bi bi-eye-fill text-dark fs-5"></i>
                <div>
                  <span class="d-block fw-semibold small">Pratinjau Berita Acara</span>
                  <small class="text-muted" style="font-size: 0.75rem;">Tinjau dokumen resmi di layar</small>
                </div>
              </button>
            </li>
          </ul>
        </div>

        <!-- Tombol Pratinjau Berita Acara Cepat -->
        <button 
          type="button" 
          class="btn btn-outline-dark btn-sm d-flex align-items-center gap-1"
          @click="openPreviewModal"
          title="Buka pratinjau Berita Acara resmi di layar"
        >
          <i class="bi bi-file-text"></i>
          <span>Pratinjau</span>
        </button>
      </div>
    </div>

    <!-- COUNTDOWN JELANG WAKTU PEMILIHAN -->
    <div class="mb-4 no-print">
      <ElectionCountdown 
        :start-time="settings.waktu_mulai" 
        :end-time="settings.waktu_selesai" 
        :voting-dibuka="settings.voting_dibuka"
      />
    </div>

    <!-- 4 KPI SUMMARY CARDS -->
    <div class="row g-3 mb-4 no-print">
      <div class="col-6 col-md-3">
        <div class="card card-clean p-3">
          <span class="text-muted small fw-medium d-block mb-1">Total DPT Siswa</span>
          <div class="h3 fw-bold text-dark font-mono-numbers mb-0">{{ stats.totalSiswa }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">Hak suara terdaftar</small>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card card-clean p-3 bg-primary-subtle bg-opacity-25 border-primary-subtle">
          <span class="text-primary small fw-semibold d-block mb-1">Total Suara Masuk</span>
          <div class="h3 fw-bold text-primary font-mono-numbers mb-0">{{ stats.totalSuaraMasuk }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">Telah diverifikasi</small>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card card-clean p-3">
          <span class="text-muted small fw-medium d-block mb-1">Suara Belum Masuk</span>
          <div class="h3 fw-bold text-danger font-mono-numbers mb-0">{{ stats.belumMemilih }}</div>
          <small class="text-muted" style="font-size: 0.75rem;">Belum menggunakan hak</small>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div class="card card-clean p-3">
          <span class="text-muted small fw-medium d-block mb-1">Tingkat Partisipasi</span>
          <div class="h3 fw-bold text-success font-mono-numbers mb-0">{{ stats.persentasePartisipasi }}%</div>
          <small class="text-muted" style="font-size: 0.75rem;">Dari total pemilih</small>
        </div>
      </div>
    </div>

    <!-- BANNER PEMBERITAHUAN PEMENANG SEMENTARA / TERPILIH -->
    <div 
      v-if="winnerCandidate && stats.totalSuaraMasuk > 0" 
      class="card card-clean p-3 mb-4 border-success bg-success-subtle bg-opacity-25 no-print"
    >
      <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">
            <i class="bi bi-trophy-fill fs-5"></i>
          </div>
          <div>
            <span class="badge bg-success font-mono-numbers small mb-1">Paslon Perolehan Suara Tertinggi</span>
            <h3 class="fs-6 fw-bold text-dark mb-0">
              No. {{ winnerCandidate.nomor_urut }} - {{ winnerCandidate.nama_ketua }} & {{ winnerCandidate.nama_wakil }}
            </h3>
            <small class="text-muted">
              Memperoleh <strong>{{ winnerCandidate.total_suara }} suara</strong> ({{ winnerCandidate.percentage }}% dari total suara masuk)
            </small>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" @click="handleExportPdf">
            <i class="bi bi-file-earmark-pdf"></i>
            <span>Arsipkan PDF</span>
          </button>
          <button type="button" class="btn btn-success btn-sm d-flex align-items-center gap-1 text-white" @click="handleExportExcel">
            <i class="bi bi-file-earmark-excel"></i>
            <span>Arsipkan Excel</span>
          </button>
        </div>
      </div>
    </div>

    <!-- GRAFIK VISUAL PEROLEHAN SUARA -->
    <div class="card card-clean p-4 mb-4 no-print">
      <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h2 class="h6 fw-bold text-dark mb-0">Grafik Komparasi Perolehan Suara</h2>
        <span class="badge bg-light text-muted border font-mono-numbers small">
          {{ stats.totalSuaraMasuk }} Total Suara
        </span>
      </div>

      <div class="d-flex flex-column gap-4 pt-2">
        <div v-for="k in kandidatWithShare" :key="k.id">
          <div class="d-flex justify-content-between align-items-end mb-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-dark font-mono-numbers fs-6">No. {{ k.nomor_urut }}</span>
              <div>
                <strong class="text-dark d-block">{{ k.nama_ketua }} & {{ k.nama_wakil }}</strong>
                <small class="text-muted d-none d-sm-inline">"{{ k.slogan }}"</small>
              </div>
            </div>
            <div class="text-end">
              <span class="h5 fw-bold text-dark font-mono-numbers mb-0 me-2">{{ k.total_suara }} Suara</span>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-mono-numbers fs-6">
                {{ k.percentage }}%
              </span>
            </div>
          </div>

          <!-- Bar Visual Graphic -->
          <div class="progress" style="height: 22px; border-radius: 11px; background-color: #f1f5f9;">
            <div 
              class="progress-bar font-mono-numbers fw-bold small text-white" 
              role="progressbar" 
              :style="{ width: `${Math.max(Number(k.percentage), 4)}%`, backgroundColor: getBarColor(k.nomor_urut) }"
              :aria-valuenow="Number(k.percentage)" 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {{ k.percentage }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABEL LENGKAP PEROLEHAN SUARA KANDIDAT -->
    <div class="card card-clean overflow-hidden mb-4 no-print">
      <div class="p-3 border-bottom bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <div>
          <h2 class="h6 fw-bold text-dark mb-0">Tabel Hasil Perolehan Suara Kandidat</h2>
          <small class="text-muted">Urutan berdasarkan nomor urut resmi pasangan calon</small>
        </div>

        <div class="d-flex gap-2">
          <button type="button" class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" @click="handleExportPdf">
            <i class="bi bi-file-pdf"></i>
            <span>PDF</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline-success d-flex align-items-center gap-1" @click="handleExportExcel">
            <i class="bi bi-file-excel"></i>
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover table-eosis align-middle mb-0">
          <thead>
            <tr>
              <th style="width: 90px;">No. Urut</th>
              <th style="width: 60px;">Foto</th>
              <th>Pasangan Calon (Ketua & Wakil)</th>
              <th class="d-none d-md-table-cell">Slogan / Visi Unggulan</th>
              <th class="text-end" style="width: 140px;">Jumlah Suara</th>
              <th class="text-end" style="width: 120px;">Persentase</th>
              <th style="width: 150px;" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in kandidatWithShare" :key="k.id" :class="{ 'table-success bg-opacity-25': k.isLeader && stats.totalSuaraMasuk > 0 }">
              <td>
                <span class="badge bg-dark fs-6 px-3 py-1 font-mono-numbers">
                  {{ k.nomor_urut }}
                </span>
              </td>
              <td>
                <img 
                  :src="k.foto_url || defaultPhoto" 
                  alt="Foto" 
                  class="rounded"
                  style="width: 44px; height: 44px; object-fit: cover;"
                  referrerpolicy="no-referrer"
                />
              </td>
              <td>
                <div class="fw-bold text-dark">{{ k.nama_ketua }}</div>
                <div class="text-muted small">& {{ k.nama_wakil }}</div>
              </td>
              <td class="d-none d-md-table-cell">
                <span class="text-secondary small fst-italic">"{{ k.slogan || '-' }}"</span>
              </td>
              <td class="text-end">
                <span class="fw-bold text-dark font-mono-numbers fs-6">
                  {{ k.total_suara }}
                </span>
              </td>
              <td class="text-end">
                <span class="badge bg-light text-primary border border-primary-subtle font-mono-numbers fs-6">
                  {{ k.percentage }}%
                </span>
              </td>
              <td class="text-center">
                <span 
                  v-if="k.isLeader && stats.totalSuaraMasuk > 0" 
                  class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"
                >
                  <i class="bi bi-trophy-fill me-1"></i>Suara Tertinggi
                </span>
                <span v-else class="text-muted small">Peserta</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="table-light fw-bold">
              <td colspan="4" class="text-end">TOTAL SUARA SAH MASUK:</td>
              <td class="text-end font-mono-numbers fs-6 text-primary">{{ stats.totalSuaraMasuk }}</td>
              <td class="text-end font-mono-numbers text-primary">100.0%</td>
              <td class="text-center text-muted small">SAH</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- TABEL REKAPITULASI PARTISIPASI PER KELAS -->
    <div class="card card-clean overflow-hidden mb-4 no-print">
      <div class="p-3 border-bottom bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <div>
          <h2 class="h6 fw-bold text-dark mb-0">Rekapitulasi Partisipasi Pemilih Per Kelas</h2>
          <small class="text-muted">Pantau tingkat kehadiran pemilih dan hak suara per rombel kelas VII, VIII, IX</small>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-secondary-subtle text-secondary border font-mono-numbers">
            {{ classTurnoutList.length }} Rombel Kelas
          </span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover table-eosis align-middle mb-0">
          <thead>
            <tr>
              <th style="width: 60px;" class="text-center">No</th>
              <th style="width: 110px;">Kelas</th>
              <th style="width: 100px;">Tingkat</th>
              <th>Wali Kelas</th>
              <th class="text-end" style="width: 110px;">Total DPT</th>
              <th class="text-end" style="width: 130px;">Sudah Memilih</th>
              <th class="text-end" style="width: 130px;">Belum Memilih</th>
              <th style="width: 180px;">Partisipasi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, idx) in classTurnoutList" :key="c.kelasId">
              <td class="text-center font-mono-numbers text-muted">{{ idx + 1 }}</td>
              <td>
                <span class="fw-bold text-dark">{{ c.namaKelas }}</span>
              </td>
              <td>
                <span class="badge bg-light text-dark border">Kelas {{ c.tingkat }}</span>
              </td>
              <td>
                <span class="text-dark small">{{ c.waliKelas }}</span>
              </td>
              <td class="text-end font-mono-numbers fw-semibold text-dark">{{ c.totalSiswa }}</td>
              <td class="text-end font-mono-numbers fw-bold text-success">{{ c.sudahMemilih }}</td>
              <td class="text-end font-mono-numbers text-muted">{{ c.belumMemilih }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height: 8px;">
                    <div 
                      class="progress-bar bg-success" 
                      role="progressbar" 
                      :style="{ width: `${c.persentase}%` }"
                    ></div>
                  </div>
                  <span class="font-mono-numbers small fw-bold text-dark" style="min-width: 42px; text-align: right;">
                    {{ c.persentase }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="table-light fw-bold">
              <td colspan="4" class="text-end">TOTAL KESELURUHAN DPT:</td>
              <td class="text-end font-mono-numbers fs-6 text-dark">{{ stats.totalSiswa }}</td>
              <td class="text-end font-mono-numbers fs-6 text-success">{{ stats.sudahMemilih }}</td>
              <td class="text-end font-mono-numbers text-danger">{{ stats.belumMemilih }}</td>
              <td class="font-mono-numbers fs-6 text-success">{{ stats.persentasePartisipasi }}% Partisipasi</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- MODAL PRATINJAU DOKUMEN BERITA ACARA RESMI -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showPreviewModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.7); z-index: 1060;"
      v-if="showPreviewModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-dark text-white py-3">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-text-fill text-warning fs-5"></i>
              <h5 class="modal-title fs-6 fw-bold mb-0">Pratinjau Berita Acara & Rekapitulasi Resmi Pemilihan</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" @click="showPreviewModal = false"></button>
          </div>

          <div class="modal-body p-4 bg-light">
            <!-- Lembar Dokumen Fisik A4 Mockup -->
            <div class="bg-white p-4 p-md-5 mx-auto rounded shadow-sm border" style="max-width: 820px; font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.4;">
              
              <!-- KOP SURAT FORMAL -->
              <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-1" style="border-bottom: 3px double #000 !important;">
                <img 
                  :src="settings.logo_sekolah || defaultLogo" 
                  alt="Logo" 
                  style="width: 70px; height: 70px; object-fit: contain;" 
                />
                <div class="text-center flex-grow-1 px-3">
                  <div style="font-size: 13pt; font-weight: bold; letter-spacing: 0.5px;">PEMERINTAH KOTA BOGOR</div>
                  <div style="font-size: 14pt; font-weight: bold; letter-spacing: 0.5px;">DINAS PENDIDIKAN</div>
                  <div style="font-size: 16pt; font-weight: bold; letter-spacing: 1px; color: #002b66;">{{ settings.nama_sekolah }}</div>
                  <div style="font-size: 11pt; font-weight: bold;">KOMISI PEMILIHAN OSIS (eOSIS SPENDA)</div>
                  <div style="font-size: 9pt; color: #333;">Jl. Ir. H. Juanda No. 16, Pabaton, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16121</div>
                </div>
                <div style="width: 70px;"></div>
              </div>

              <!-- JUDUL BERITA ACARA -->
              <div class="text-center my-3">
                <h4 style="font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 2px; text-transform: uppercase;">
                  BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA
                </h4>
                <p style="font-size: 10.5pt; font-weight: bold; margin-bottom: 2px;">
                  PEMILIHAN KETUA DAN WAKIL KETUA OSIS MASA BAKTI {{ settings.periode_pemilihan }}
                </p>
                <small style="font-style: italic; color: #444;">
                  Nomor: BA.03/KPO-OSIS-SPENDA/{{ new Date().getFullYear() }}
                </small>
              </div>

              <!-- NARASI -->
              <p style="text-align: justify; font-size: 10.5pt; text-indent: 30px; margin-bottom: 12px;">
                Pada hari ini, <strong>{{ formattedDateOnly }}</strong>, bertempat di Kampus SMP Negeri 2 Kota Bogor, Panitia Komisi Pemilihan OSIS telah melaksanakan rapat pleno penghitungan dan rekapitulasi akhir perolehan suara dalam Pemilihan Ketua dan Wakil Ketua OSIS Periode {{ settings.periode_pemilihan }} yang diselenggarakan secara langsung, umum, bebas, rahasia, jujur, dan adil melalui sistem e-Voting (eOSIS).
              </p>

              <!-- I. RINGKASAN HAK PILIH -->
              <div style="font-weight: bold; font-size: 10pt; text-transform: uppercase; margin-bottom: 4px;">
                I. DATA HAK SUARA DAN KEHADIRAN PEMILIH
              </div>
              <table class="table table-bordered table-sm mb-3" style="font-size: 9.5pt; border-color: #000;">
                <tbody>
                  <tr>
                    <td style="width: 65%;">A. Jumlah Hak Suara Terdaftar dalam Daftar Pemilih Tetap (DPT)</td>
                    <td class="text-end fw-bold" style="width: 35%;">{{ stats.totalSiswa }} Siswa</td>
                  </tr>
                  <tr>
                    <td>B. Jumlah Pemilih yang Menggunakan Hak Suara (Suara Sah Masuk)</td>
                    <td class="text-end fw-bold text-primary">{{ stats.totalSuaraMasuk }} Suara</td>
                  </tr>
                  <tr>
                    <td>C. Jumlah Pemilih yang Tidak Menggunakan Hak Suara (Belum Memilih)</td>
                    <td class="text-end fw-bold text-danger">{{ stats.belumMemilih }} Siswa</td>
                  </tr>
                  <tr style="background-color: #f5f5f5;">
                    <td><strong>D. Tingkat Partisipasi Pemilih Keseluruhan</strong></td>
                    <td class="text-end fw-bold text-success fs-6">{{ stats.persentasePartisipasi }}%</td>
                  </tr>
                </tbody>
              </table>

              <!-- II. PEROLEHAN SUARA KANDIDAT -->
              <div style="font-weight: bold; font-size: 10pt; text-transform: uppercase; margin-bottom: 4px;">
                II. HASIL PEROLEHAN SUARA PASANGAN CALON KETUA & WAKIL KETUA OSIS
              </div>
              <table class="table table-bordered table-sm mb-3" style="font-size: 9.5pt; border-color: #000;">
                <thead style="background-color: #f2f2f2;">
                  <tr class="text-center align-middle">
                    <th style="width: 50px;">No.</th>
                    <th>Pasangan Calon (Ketua & Wakil)</th>
                    <th>Slogan</th>
                    <th style="width: 100px;">Perolehan Suara</th>
                    <th style="width: 90px;">Persentase</th>
                    <th style="width: 110px;">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="k in kandidatWithShare" :key="k.id" :style="k.isLeader && stats.totalSuaraMasuk > 0 ? 'background-color: #f0fdf4;' : ''">
                    <td class="text-center fw-bold fs-6">{{ k.nomor_urut }}</td>
                    <td>
                      <strong>{{ k.nama_ketua }}</strong><br/>
                      <small class="text-muted">Wakil: {{ k.nama_wakil }}</small>
                    </td>
                    <td class="fst-italic small">"{{ k.slogan || '-' }}"</td>
                    <td class="text-end fw-bold">{{ k.total_suara }}</td>
                    <td class="text-end fw-bold">{{ k.percentage }}%</td>
                    <td class="text-center small">
                      <strong v-if="k.isLeader && stats.totalSuaraMasuk > 0" class="text-success">★ TERPILIH</strong>
                      <span v-else class="text-muted">Peserta</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="background-color: #f2f2f2; font-weight: bold;">
                    <td colspan="3" class="text-end">TOTAL SUARA SAH MASUK:</td>
                    <td class="text-end text-primary">{{ stats.totalSuaraMasuk }}</td>
                    <td class="text-end text-primary">100.0%</td>
                    <td class="text-center">FINAL</td>
                  </tr>
                </tfoot>
              </table>

              <!-- PENETAPAN CALON TERPILIH -->
              <div v-if="winnerCandidate && stats.totalSuaraMasuk > 0" class="p-2 mb-3 border rounded" style="background-color: #fafafa; font-size: 9.5pt;">
                <strong>PENETAPAN PASANGAN CALON TERPILIH:</strong><br/>
                Berdasarkan hasil perolehan suara di atas, Panitia Komisi Pemilihan OSIS menetapkan Pasangan Calon Nomor Urut <strong>{{ winnerCandidate.nomor_urut }}</strong> atas nama <strong>{{ winnerCandidate.nama_ketua }}</strong> & <strong>{{ winnerCandidate.nama_wakil }}</strong> sebagai <strong>Ketua & Wakil Ketua OSIS {{ settings.nama_sekolah }} Terpilih Periode {{ settings.periode_pemilihan }}</strong> dengan perolehan <strong>{{ winnerCandidate.total_suara }} suara ({{ winnerCandidate.percentage }}%)</strong>.
              </div>

              <!-- PENGESAHAN TANDA TANGAN -->
              <div class="mt-4 pt-2">
                <div class="text-end small mb-2">Kota Bogor, {{ formattedDateOnly }}</div>
                
                <div class="text-center small fw-bold mb-2">SAKSI-SAKSI PASANGAN CALON:</div>
                <div class="row text-center small mb-4">
                  <div class="col-4">
                    <p class="mb-4">Saksi Paslon No. 1</p>
                    <p class="mb-0">( ......................................... )</p>
                  </div>
                  <div class="col-4">
                    <p class="mb-4">Saksi Paslon No. 2</p>
                    <p class="mb-0">( ......................................... )</p>
                  </div>
                  <div class="col-4">
                    <p class="mb-4">Saksi Paslon No. 3</p>
                    <p class="mb-0">( ......................................... )</p>
                  </div>
                </div>

                <div class="row text-center small mt-3">
                  <div class="col-6">
                    <p class="mb-4">Ketua Panitia Pemilihan (KPO),</p>
                    <strong class="d-block text-decoration-underline">Dra. Sri Wahyuni, M.Pd</strong>
                    <small class="text-muted">NIP. 19740512 199903 2 004</small>
                  </div>
                  <div class="col-6">
                    <p class="mb-4">Pembina OSIS SMPN 2,</p>
                    <strong class="d-block text-decoration-underline">Ahmad Fauzi, S.Pd</strong>
                    <small class="text-muted">NIP. 19820315 200801 1 009</small>
                  </div>
                  <div class="col-12 text-center mt-3">
                    <p class="mb-4">Mengetahui dan Mengesahkan,<br/>Kepala {{ settings.nama_sekolah }}</p>
                    <strong class="d-block text-decoration-underline">Drs. H. Mulyadi, M.M.Pd</strong>
                    <small class="text-muted">NIP. 19681120 199412 1 002</small>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="modal-footer bg-white d-flex justify-content-between">
            <span class="text-muted small">
              Dokumen resmi dapat dicetak langsung atau disimpan menjadi file PDF beresolusi tinggi.
            </span>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="showPreviewModal = false">
                Tutup
              </button>
              <button type="button" class="btn btn-success btn-sm d-flex align-items-center gap-1" @click="handleExportExcel">
                <i class="bi bi-file-earmark-excel-fill"></i>
                <span>Unduh Excel</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm d-flex align-items-center gap-1 text-white" @click="handleExportPdf">
                <i class="bi bi-printer-fill"></i>
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { dbService } from '../../services/db';
import type { Statistics, Kandidat, Pengaturan, Kelas, Siswa } from '../../types';
import ElectionCountdown from '../../components/ElectionCountdown.vue';
import { 
  exportRekapToExcel, 
  exportRekapToCsv, 
  openBeritaAcaraPrintWindow, 
  calculateClassTurnout, 
  formatIndonesianDate, 
  formatIndonesianDateTime,
  ClassTurnout,
  ExportData 
} from '../../utils/exportRecap';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';
const defaultPhoto = '/src/assets/images/kandidat_paslon_1_1793253208173.jpg';

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
const siswaList = ref<Siswa[]>([]);
const classTurnoutList = ref<ClassTurnout[]>([]);

const isAutoRefresh = ref(false);
const showExportDropdown = ref(false);
const showPreviewModal = ref(false);
const toastMessage = ref('');
let refreshInterval: any = null;

const formattedDateOnly = computed(() => formatIndonesianDate());

const maxVotes = computed(() => {
  return Math.max(...kandidatList.value.map(k => k.total_suara || 0), 0);
});

const kandidatWithShare = computed(() => {
  const total = stats.value.totalSuaraMasuk;
  return kandidatList.value.map(k => {
    const suara = k.total_suara || 0;
    const percentage = total > 0 ? ((suara / total) * 100).toFixed(1) : '0.0';
    const isLeader = suara > 0 && suara === maxVotes.value;
    return {
      ...k,
      percentage,
      isLeader
    };
  });
});

const winnerCandidate = computed(() => {
  if (stats.value.totalSuaraMasuk === 0) return null;
  const leaders = kandidatWithShare.value.filter(k => k.isLeader);
  return leaders.length > 0 ? leaders[0] : null;
});

function getBarColor(nomorUrut: number) {
  const colors = ['#1d4ed8', '#059669', '#d97706', '#7c3aed', '#db2777'];
  return colors[(nomorUrut - 1) % colors.length];
}

async function refreshData() {
  const [sSettings, sStats, sKandidat, sKelas, sSiswa] = await Promise.all([
    dbService.getPengaturan(),
    dbService.getStatistics(),
    dbService.getKandidatList(),
    dbService.getKelasList(),
    dbService.getSiswaList()
  ]);

  settings.value = sSettings;
  stats.value = sStats;
  kandidatList.value = sKandidat;
  kelasList.value = sKelas;
  siswaList.value = sSiswa;
  classTurnoutList.value = calculateClassTurnout(sKelas, sSiswa);
}

function toggleAutoRefresh() {
  isAutoRefresh.value = !isAutoRefresh.value;
  if (isAutoRefresh.value) {
    refreshInterval = setInterval(() => {
      refreshData();
    }, 4000);
  } else {
    if (refreshInterval) clearInterval(refreshInterval);
  }
}

function buildExportData(): ExportData {
  return {
    settings: settings.value,
    stats: stats.value,
    kandidatList: kandidatWithShare.value,
    kelasList: kelasList.value,
    siswaList: siswaList.value,
    classTurnoutList: classTurnoutList.value
  };
}

function handleExportExcel() {
  try {
    const data = buildExportData();
    exportRekapToExcel(data);
    showToast('File Excel Rekapitulasi (.xls) berhasil diunduh.');
  } catch (err: any) {
    alert('Gagal mengekspor ke Excel: ' + (err?.message || err));
  }
}

function handleExportCsv() {
  try {
    const data = buildExportData();
    exportRekapToCsv(data);
    showToast('File CSV Rekapitulasi berhasil diunduh.');
  } catch (err: any) {
    alert('Gagal mengekspor ke CSV: ' + (err?.message || err));
  }
}

function handleExportPdf() {
  try {
    const data = buildExportData();
    openBeritaAcaraPrintWindow(data);
    showToast('Jendela Berita Acara PDF berhasil dibuka. Silakan pilih "Simpan sebagai PDF" atau Cetak.');
  } catch (err: any) {
    alert('Gagal membuka cetak PDF: ' + (err?.message || err));
  }
}

function openPreviewModal() {
  showPreviewModal.value = true;
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 4000);
}

onMounted(() => {
  refreshData();
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin-icon {
  animation: spin 1.2s linear infinite;
}
</style>
