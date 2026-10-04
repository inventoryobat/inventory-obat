import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const initialForm = {
  kode_supplier: '',
  nama_supplier: '',
  alamat: '',
  nomor_telepon: '',
  kontak: '',
}

export default function Supplier() {
  const navigate = useNavigate()

  const [supplier, setSupplier] = useState([])
  const [form, setForm] = useState(initialForm)

  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // =========================
  // LOAD DATA
  // =========================

  const fetchSupplier = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('supplier')
      .select('*')
      .order('nama_supplier', {
        ascending: true,
      })

    if (error) {
      console.error(error)

      setMessage(
        `Gagal mengambil data supplier: ${error.message}`
      )
    } else {
      setSupplier(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchSupplier()
  }, [])

  // =========================
  // INPUT FORM
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.kode_supplier.trim()) {
      setMessage('Kode supplier wajib diisi.')
      return
    }

    if (!form.nama_supplier.trim()) {
      setMessage('Nama supplier wajib diisi.')
      return
    }

    setSaving(true)
    setMessage('')

    const payload = {
      kode_supplier: form.kode_supplier.trim(),
      nama_supplier: form.nama_supplier.trim(),
      alamat: form.alamat.trim() || null,
      nomor_telepon:
        form.nomor_telepon.trim() || null,
      kontak: form.kontak.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      const { error } = await supabase
        .from('supplier')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error(error)

        setMessage(
          `Gagal memperbarui supplier: ${error.message}`
        )
      } else {
        setMessage(
          'Data supplier berhasil diperbarui.'
        )

        resetForm()
        await fetchSupplier()
      }
    } else {
      const { error } = await supabase
        .from('supplier')
        .insert(payload)

      if (error) {
        console.error(error)

        setMessage(
          `Gagal menambahkan supplier: ${error.message}`
        )
      } else {
        setMessage(
          'Data supplier berhasil ditambahkan.'
        )

        resetForm()
        await fetchSupplier()
      }
    }

    setSaving(false)
  }

  // =========================
  // EDIT
  // =========================

  const handleEdit = (item) => {
    setEditingId(item.id)

    setForm({
      kode_supplier: item.kode_supplier || '',
      nama_supplier: item.nama_supplier || '',
      alamat: item.alamat || '',
      nomor_telepon: item.nomor_telepon || '',
      kontak: item.kontak || '',
    })

    setMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus supplier ini?'
    )

    if (!confirmed) return

    setMessage('')

    const { error } = await supabase
      .from('supplier')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)

      setMessage(
        'Supplier tidak dapat dihapus karena kemungkinan masih digunakan pada transaksi obat masuk.'
      )
    } else {
      setMessage(
        'Data supplier berhasil dihapus.'
      )

      await fetchSupplier()
    }
  }

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  // =========================
  // SEARCH
  // =========================

  const filteredSupplier = supplier.filter(
    (item) => {
      const keyword = search
        .toLowerCase()
        .trim()

      return (
        item.kode_supplier
          ?.toLowerCase()
          .includes(keyword) ||
        item.nama_supplier
          ?.toLowerCase()
          .includes(keyword) ||
        item.nomor_telepon
          ?.toLowerCase()
          .includes(keyword) ||
        item.kontak
          ?.toLowerCase()
          .includes(keyword)
      )
    }
  )

  return (
    <div className="supplier-page">

      {/* =========================
          HEADER
      ========================== */}

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
            <h2>Data Supplier</h2>

            <p>
              Kelola data supplier atau pemasok obat
              dalam sistem inventory.
            </p>
          </div>

        </div>

      </div>

      {/* =========================
          MESSAGE
      ========================== */}

      {message && (
        <div className="alert-success">
          {message}
        </div>
      )}

      {/* =========================
          CONTENT
      ========================== */}

      <div className="supplier-layout">

        {/* =========================
            FORM
        ========================== */}

        <section className="supplier-form-card">

          <div className="card-heading">

            <h3>
              {editingId
                ? 'Edit Supplier'
                : 'Tambah Supplier'}
            </h3>

            <p>
              Masukkan informasi supplier dengan
              lengkap.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            {/* KODE SUPPLIER */}

            <div className="form-field">

              <label htmlFor="kode_supplier">
                Kode Supplier
              </label>

              <input
                id="kode_supplier"
                type="text"
                name="kode_supplier"
                value={form.kode_supplier}
                onChange={handleChange}
                placeholder="Contoh: SUP-001"
                required
              />

            </div>

            {/* NAMA SUPPLIER */}

            <div className="form-field">

              <label htmlFor="nama_supplier">
                Nama Supplier
              </label>

              <input
                id="nama_supplier"
                type="text"
                name="nama_supplier"
                value={form.nama_supplier}
                onChange={handleChange}
                placeholder="Contoh: PT Sehat Farma"
                required
              />

            </div>

            {/* ALAMAT */}

            <div className="form-field">

              <label htmlFor="alamat">
                Alamat
              </label>

              <textarea
                id="alamat"
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder="Alamat supplier..."
                rows="3"
              />

            </div>

            {/* NOMOR TELEPON */}

            <div className="form-field">

              <label htmlFor="nomor_telepon">
                Nomor Telepon
              </label>

              <input
                id="nomor_telepon"
                type="tel"
                name="nomor_telepon"
                value={form.nomor_telepon}
                onChange={handleChange}
                placeholder="Contoh: 081234567890"
              />

            </div>

            {/* KONTAK */}

            <div className="form-field">

              <label htmlFor="kontak">
                Kontak Supplier
              </label>

              <input
                id="kontak"
                type="text"
                name="kontak"
                value={form.kontak}
                onChange={handleChange}
                placeholder="Contoh: Budi"
              />

            </div>

            {/* BUTTON */}

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
                    : 'Tambah Supplier'}
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

        {/* =========================
            TABLE
        ========================== */}

        <section className="supplier-table-card">

          <div className="table-card-header">

            <div>

              <h3>
                Daftar Supplier
              </h3>

              <p>
                {filteredSupplier.length} supplier
              </p>

            </div>

            <div className="search-wrapper">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari supplier..."
                aria-label="Cari supplier"
              />

            </div>

          </div>

          {loading ? (

            <div className="table-state">

              <p>
                Memuat data supplier...
              </p>

            </div>

          ) : filteredSupplier.length === 0 ? (

            <div className="table-state">

              <p>
                Belum ada data supplier.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="data-table supplier-table">

                <thead>

                  <tr>
                    <th>No</th>
                    <th>Kode</th>
                    <th>Nama Supplier</th>
                    <th>Alamat</th>
                    <th>Nomor Telepon</th>
                    <th>Kontak</th>
                    <th>Aksi</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredSupplier.map(
                    (item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {item.kode_supplier}
                        </td>

                        <td>
                          <strong>
                            {item.nama_supplier}
                          </strong>
                        </td>

                        <td>
                          {item.alamat || '-'}
                        </td>

                        <td>
                          {item.nomor_telepon ||
                            '-'}
                        </td>

                        <td>
                          {item.kontak || '-'}
                        </td>

                        <td>

                          <div className="table-actions">

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(item)
                              }
                              className="btn-edit"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              className="btn-delete"
                            >
                              Hapus
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

    </div>
  )
}