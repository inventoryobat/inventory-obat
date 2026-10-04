import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const initialForm = {
  kode_obat: '',
  nama_obat: '',
  kategori_id: '',
  satuan: '',
  harga_beli: '',
  stok_minimum: '',
  deskripsi: '',
}

export default function DataObat() {
  const navigate = useNavigate()

  const [obat, setObat] = useState([])
  const [kategori, setKategori] = useState([])

  const [form, setForm] = useState(initialForm)

  const [editingId, setEditingId] = useState(null)
  const [selectedObat, setSelectedObat] = useState(null)

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  // =========================================
  // FETCH DATA OBAT
  // =========================================

  const fetchObat = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('obat')
      .select(`
        *,
        kategori (
          id,
          nama_kategori
        )
      `)
      .order('nama_obat', {
        ascending: true,
      })

    if (error) {
      console.error(error)

      setMessage(
        `Gagal mengambil data obat: ${error.message}`
      )

      setMessageType('error')
    } else {
      setObat(data || [])
    }

    setLoading(false)
  }

  // =========================================
  // FETCH KATEGORI
  // =========================================

  const fetchKategori = async () => {
    const { data, error } = await supabase
      .from('kategori')
      .select('*')
      .order('nama_kategori', {
        ascending: true,
      })

    if (error) {
      console.error(error)

      setMessage(
        `Gagal mengambil kategori: ${error.message}`
      )

      setMessageType('error')
    } else {
      setKategori(data || [])
    }
  }

  useEffect(() => {
    fetchObat()
    fetchKategori()
  }, [])

  // =========================================
  // HANDLE CHANGE
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // =========================================
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  // =========================================
  // SUBMIT FORM
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.kode_obat.trim()) {
      setMessage('Kode obat wajib diisi.')
      setMessageType('error')
      return
    }

    if (!form.nama_obat.trim()) {
      setMessage('Nama obat wajib diisi.')
      setMessageType('error')
      return
    }

    if (!form.kategori_id) {
      setMessage('Kategori obat wajib dipilih.')
      setMessageType('error')
      return
    }

    if (!form.satuan.trim()) {
      setMessage('Satuan obat wajib diisi.')
      setMessageType('error')
      return
    }

    if (form.harga_beli === '') {
      setMessage('Harga beli wajib diisi.')
      setMessageType('error')
      return
    }

    if (Number(form.harga_beli) < 0) {
      setMessage(
        'Harga beli tidak boleh kurang dari 0.'
      )
      setMessageType('error')
      return
    }

    if (form.stok_minimum === '') {
      setMessage('Stok minimum wajib diisi.')
      setMessageType('error')
      return
    }

    if (Number(form.stok_minimum) < 0) {
      setMessage(
        'Stok minimum tidak boleh kurang dari 0.'
      )
      setMessageType('error')
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      kode_obat: form.kode_obat.trim(),
      nama_obat: form.nama_obat.trim(),
      kategori_id: Number(form.kategori_id),
      satuan: form.satuan.trim(),
      harga_beli: Number(form.harga_beli),
      stok_minimum: Number(form.stok_minimum),
      deskripsi: form.deskripsi.trim() || null,
      updated_at: new Date().toISOString(),
    }

    // =======================================
    // UPDATE
    // =======================================

    if (editingId) {
      const { error } = await supabase
        .from('obat')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error(error)

        setMessage(
          `Gagal memperbarui data obat: ${error.message}`
        )

        setMessageType('error')
      } else {
        setMessage(
          'Data obat berhasil diperbarui.'
        )

        setMessageType('success')

        resetForm()
        await fetchObat()

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }
    }

    // =======================================
    // INSERT
    // =======================================

    else {
      const { error } = await supabase
        .from('obat')
        .insert(payload)

      if (error) {
        console.error(error)

        setMessage(
          `Gagal menambahkan data obat: ${error.message}`
        )

        setMessageType('error')
      } else {
        setMessage(
          'Data obat berhasil ditambahkan.'
        )

        setMessageType('success')

        resetForm()
        await fetchObat()
      }
    }

    setSaving(false)
  }

  // =========================================
  // EDIT
  // =========================================

  const handleEdit = (item) => {
    setEditingId(item.id)

    setForm({
      kode_obat: item.kode_obat || '',
      nama_obat: item.nama_obat || '',
      kategori_id: item.kategori_id
        ? String(item.kategori_id)
        : '',
      satuan: item.satuan || '',
      harga_beli:
        item.harga_beli !== null &&
        item.harga_beli !== undefined
          ? String(item.harga_beli)
          : '',
      stok_minimum:
        item.stok_minimum !== null &&
        item.stok_minimum !== undefined
          ? String(item.stok_minimum)
          : '',
      deskripsi: item.deskripsi || '',
    })

    setSelectedObat(null)
    setMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================================
  // DELETE
  // =========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus data obat ini?'
    )

    if (!confirmed) return

    setMessage('')

    const { error } = await supabase
      .from('obat')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)

      setMessage(
        'Data obat tidak dapat dihapus. Kemungkinan obat masih digunakan pada transaksi obat masuk atau obat keluar.'
      )

      setMessageType('error')
    } else {
      setMessage(
        'Data obat berhasil dihapus.'
      )

      setMessageType('success')

      await fetchObat()
    }
  }

  // =========================================
  // DETAIL
  // =========================================

  const handleDetail = (item) => {
    setSelectedObat(item)
  }

  const closeDetail = () => {
    setSelectedObat(null)
  }

  // =========================================
  // SEARCH
  // =========================================

  const filteredObat = obat.filter((item) => {
    const keyword = search
      .toLowerCase()
      .trim()

    return (
      item.kode_obat
        ?.toLowerCase()
        .includes(keyword) ||
      item.nama_obat
        ?.toLowerCase()
        .includes(keyword) ||
      item.kategori?.nama_kategori
        ?.toLowerCase()
        .includes(keyword) ||
      item.satuan
        ?.toLowerCase()
        .includes(keyword)
    )
  })

  // =========================================
  // FORMAT RUPIAH
  // =========================================

  const formatRupiah = (value) => {
    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }
    ).format(value || 0)
  }

  return (
    <div className="data-obat-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="page-header">

        <div className="page-header-left">

          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/master-data')}
            aria-label="Kembali ke Master Data"
            title="Kembali ke Master Data"
          >
            <ArrowLeft
              size={18}
              strokeWidth={2}
            />
          </button>

          <div>
            <h2>Data Obat</h2>

            <p>
              Kelola data master obat yang digunakan
              dalam sistem inventory.
            </p>
          </div>

        </div>

      </div>

      {/* =====================================
          MESSAGE
      ===================================== */}

      {message && (
        <div
          className={
            messageType === 'error'
              ? 'alert-error'
              : 'alert-success'
          }
        >
          {message}
        </div>
      )}

      {/* =====================================
          MAIN LAYOUT
      ===================================== */}

      <div className="data-obat-layout">

        {/* ===================================
            FORM
        =================================== */}

        <section className="data-obat-form-card">

          <div className="card-heading">

            <h3>
              {editingId
                ? 'Edit Data Obat'
                : 'Tambah Data Obat'}
            </h3>

            <p>
              Masukkan informasi obat dengan
              lengkap.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            {/* KODE */}

            <div className="form-field">

              <label htmlFor="kode_obat">
                Kode Obat
              </label>

              <input
                id="kode_obat"
                type="text"
                name="kode_obat"
                value={form.kode_obat}
                onChange={handleChange}
                placeholder="Contoh: OBT-001"
                required
              />

            </div>

            {/* NAMA */}

            <div className="form-field">

              <label htmlFor="nama_obat">
                Nama Obat
              </label>

              <input
                id="nama_obat"
                type="text"
                name="nama_obat"
                value={form.nama_obat}
                onChange={handleChange}
                placeholder="Contoh: Paracetamol"
                required
              />

            </div>

            {/* KATEGORI */}

            <div className="form-field">

              <label htmlFor="kategori_id">
                Kategori
              </label>

              <select
                id="kategori_id"
                name="kategori_id"
                value={form.kategori_id}
                onChange={handleChange}
                required
              >

                <option value="">
                  Pilih kategori
                </option>

                {kategori.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nama_kategori}
                  </option>
                ))}

              </select>

            </div>

            {/* SATUAN */}

            <div className="form-field">

              <label htmlFor="satuan">
                Satuan
              </label>

              <input
                id="satuan"
                type="text"
                name="satuan"
                value={form.satuan}
                onChange={handleChange}
                placeholder="Contoh: Tablet"
                required
              />

            </div>

            {/* HARGA */}

            <div className="form-field">

              <label htmlFor="harga_beli">
                Harga Beli
              </label>

              <input
                id="harga_beli"
                type="number"
                name="harga_beli"
                value={form.harga_beli}
                onChange={handleChange}
                placeholder="Contoh: 5000"
                min="0"
                step="0.01"
                required
              />

            </div>

            {/* STOK MINIMUM */}

            <div className="form-field">

              <label htmlFor="stok_minimum">
                Stok Minimum
              </label>

              <input
                id="stok_minimum"
                type="number"
                name="stok_minimum"
                value={form.stok_minimum}
                onChange={handleChange}
                placeholder="Contoh: 10"
                min="0"
                step="1"
                required
              />

            </div>

            {/* DESKRIPSI */}

            <div className="form-field">

              <label htmlFor="deskripsi">
                Deskripsi
              </label>

              <textarea
                id="deskripsi"
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="Masukkan deskripsi obat..."
                rows="4"
              />

            </div>

            {/* ACTION */}

            <div className="form-actions">

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving
                  ? 'Menyimpan...'
                  : editingId
                    ? 'Simpan Perubahan'
                    : 'Tambah Obat'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Batal
                </button>
              )}

            </div>

          </form>

        </section>

        {/* ===================================
            TABLE
        =================================== */}

        <section className="data-obat-table-card">

          <div className="table-card-header">

            <div>

              <h3>
                Daftar Obat
              </h3>

              <p>
                {filteredObat.length} obat
              </p>

            </div>

            <div className="search-wrapper">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari obat..."
                aria-label="Cari obat"
              />

            </div>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="table-state">

              <p>
                Memuat data obat...
              </p>

            </div>

          ) : filteredObat.length === 0 ? (

            <div className="table-state">

              <p>
                Belum ada data obat.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="data-table">

                <thead>

                  <tr>
                    <th>No</th>
                    <th>Kode</th>
                    <th>Nama Obat</th>
                    <th>Kategori</th>
                    <th>Satuan</th>
                    <th>Harga Beli</th>
                    <th>Stok Minimum</th>
                    <th>Aksi</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredObat.map(
                    (item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.kode_obat}
                        </td>

                        <td>
                          <strong>
                            {item.nama_obat}
                          </strong>
                        </td>

                        <td>
                          {item.kategori
                            ?.nama_kategori || '-'}
                        </td>

                        <td>
                          {item.satuan}
                        </td>

                        <td>
                          {formatRupiah(
                            item.harga_beli
                          )}
                        </td>

                        <td>
                          {item.stok_minimum}
                        </td>

                        <td>

                          <div className="table-actions">

                            {/* DETAIL */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDetail(item)
                              }
                              className="btn-detail"
                              title="Detail obat"
                            >
                              <Eye
                                size={16}
                                strokeWidth={2}
                              />

                              <span>
                                Detail
                              </span>
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(item)
                              }
                              className="btn-edit"
                              title="Edit obat"
                            >
                              <Pencil
                                size={16}
                                strokeWidth={2}
                              />

                              <span>
                                Edit
                              </span>
                            </button>

                            {/* HAPUS */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              className="btn-delete"
                              title="Hapus obat"
                            >
                              <Trash2
                                size={16}
                                strokeWidth={2}
                              />

                              <span>
                                Hapus
                              </span>
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =====================================
          DETAIL MODAL
      ===================================== */}

      {selectedObat && (

        <div
          className="detail-modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeDetail()
            }

          }}
        >

          <div
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-obat-title"
          >

            {/* MODAL HEADER */}

            <div className="detail-modal-header">

              <div>

                <h3 id="detail-obat-title">
                  Detail Obat
                </h3>

                <p>
                  Informasi lengkap data obat.
                </p>

              </div>

              <button
                type="button"
                onClick={closeDetail}
                className="detail-modal-close"
                aria-label="Tutup detail"
              >
                <X
                  size={22}
                  strokeWidth={2}
                />
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="detail-modal-body">

              <div className="detail-info-grid">

                <div className="detail-info-item">

                  <span>
                    Kode Obat
                  </span>

                  <strong>
                    {selectedObat.kode_obat}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Nama Obat
                  </span>

                  <strong>
                    {selectedObat.nama_obat}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Kategori
                  </span>

                  <strong>
                    {selectedObat.kategori
                      ?.nama_kategori || '-'}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Satuan
                  </span>

                  <strong>
                    {selectedObat.satuan}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Harga Beli
                  </span>

                  <strong>
                    {formatRupiah(
                      selectedObat.harga_beli
                    )}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Stok Minimum
                  </span>

                  <strong>
                    {selectedObat.stok_minimum}
                  </strong>

                </div>

              </div>

              <div className="detail-description">

                <span>
                  Deskripsi
                </span>

                <p>
                  {selectedObat.deskripsi ||
                    'Tidak ada deskripsi obat.'}
                </p>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="detail-modal-footer">

              <button
                type="button"
                onClick={closeDetail}
                className="btn-secondary"
              >
                Tutup
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}