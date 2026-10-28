import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { ClassItem } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export const Classes: React.FC = () => {
  const { showToast } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState<number>(7);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirm State
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getClasses();
      setClasses(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat kelas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormName('');
    setFormGrade(7);
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormName(cls.name);
    setFormGrade(cls.grade);
    setFormIsActive(cls.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama kelas wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          name: formName.trim(),
          grade: Number(formGrade),
          is_active: formIsActive,
        });
        showToast('Kelas berhasil diperbarui.', 'success');
      } else {
        await api.addClass({
          name: formName.trim(),
          grade: Number(formGrade),
          is_active: formIsActive,
        });
        showToast('Kelas baru berhasil ditambahkan.', 'success');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan kelas.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    setDeleteLoading(true);
    try {
      await api.deleteClass(deletingClass.id);
      showToast('Kelas berhasil dihapus.', 'success');
      setDeletingClass(null);
      fetchClasses();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kelas.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesGrade = gradeFilter === 'all' || cls.grade.toString() === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Data Kelas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola daftar kelas dan periksa alokasi jumlah siswa pemilih
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelas..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Tingkat:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="all">Semua Tingkat</option>
            <option value="7">Kelas 7</option>
            <option value="8">Kelas 8</option>
            <option value="9">Kelas 9</option>
          </select>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Memuat data kelas...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada kelas yang sesuai.</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Nama Kelas</th>
                  <th className="py-3.5 px-6">Tingkat</th>
                  <th className="py-3.5 px-6">Jumlah Siswa</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {cls.name.slice(0, 3)}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{cls.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        Tingkat {cls.grade}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.student_count || 0} Siswa</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {cls.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <XCircle className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(cls)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Kelas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingClass(cls)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
        subtitle="Pastikan penamaan kelas seragam sesuai format sekolah (contoh: VII-A)"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: VII-A atau VIII-B"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tingkat (Grade)
            </label>
            <select
              value={formGrade}
              onChange={(e) => setFormGrade(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value={7}>Kelas 7 (Tujuh)</option>
              <option value={8}>Kelas 8 (Delapan)</option>
              <option value={9}>Kelas 9 (Sembilan)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700">
              Kelas berstatus aktif dalam pemilihan
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              {formLoading ? 'Menyimpan...' : 'Simpan Data Kelas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClass}
        onClose={() => !deleteLoading && setDeletingClass(null)}
        title="Hapus Kelas"
        subtitle="Tindakan ini tidak dapat dibatalkan"
      >
        {deletingClass && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Apakah Anda yakin ingin menghapus kelas <b>{deletingClass.name}</b>?
                {deletingClass.student_count && deletingClass.student_count > 0 ? (
                  <p className="mt-1 font-bold text-rose-900">
                    Peringatan: Terdapat {deletingClass.student_count} siswa di kelas ini. Kelas tidak dapat dihapus jika masih ada siswa terdaftar!
                  </p>
                ) : null}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Kelas'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
