import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const initialForm = {
  nama_kategori: '',
}

export default function Kategori() {
  const navigate = useNavigate()

  const [kategori, setKategori] = useState([])
  const [form, setForm] = useState(initialForm)

  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')

  // =========================
  // LOAD DATA
  // =========================

  const fetchKategori = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('kategori')
      .select('*')
      .order('nama_kategori', {
        ascending: true,
      })

    if (error) {
      console.error(error)
      setMessage(error.message)
    } else {
      setKategori(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchKategori()
  }, [])

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nama_kategori.trim()) {
      setMessage('Nama kategori wajib diisi.')
      return
    }

    setSaving(true)
    setMessage('')

    if (editingId) {
      const { error } = await supabase
        .from('kategori')
        .update({
          nama_kategori: form.nama_kategori.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)

      if (error) {
        console.error(error)
        setMessage(error.message)
      } else {
        setMessage('Kategori berhasil diperbarui.')
        resetForm()
        await fetchKategori()
      }
    } else {
      const { error } = await supabase
        .from('kategori')
        .insert({
          nama_kategori: form.nama_kategori.trim(),
        })

      if (error) {
        console.error(error)
        setMessage(error.message)
      } else {
        setMessage('Kategori berhasil ditambahkan.')
        resetForm()
        await fetchKategori()
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
      nama_kategori: item.nama_kategori || '',
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
      'Apakah Anda yakin ingin menghapus kategori ini?'
    )

    if (!confirmed) return

    setMessage('')

    const { error } = await supabase
      .from('kategori')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)

      setMessage(
        'Kategori tidak dapat dihapus. Pastikan kategori tersebut tidak sedang digunakan oleh data obat.'
      )
    } else {
      setMessage('Kategori berhasil dihapus.')
      await fetchKategori()
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

  const filteredKategori = kategori.filter((item) =>
    item.nama_kategori
      ?.toLowerCase()
      .includes(search.toLowerCase().trim())
  )

  return (
    <div className="kategori-page">

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
            <h2>Data Kategori</h2>

            <p>
              Kelola kategori obat yang digunakan
              dalam sistem.
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

      <div className="kategori-layout">

        {/* =========================
            FORM
        ========================== */}

        <section className="kategori-form-card">

          <div className="card-heading">

            <h3>
              {editingId
                ? 'Edit Kategori'
                : 'Tambah Kategori'}
            </h3>

            <p>
              Masukkan nama kategori obat yang ingin
              digunakan.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-field">

              <label htmlFor="nama_kategori">
                Nama Kategori
              </label>

              <input
                id="nama_kategori"
                type="text"
                value={form.nama_kategori}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nama_kategori: e.target.value,
                  })
                }
                placeholder="Contoh: Antibiotik"
                required
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
                    : 'Tambah Kategori'}
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

        <section className="kategori-table-card">

          <div className="table-card-header">

            <div>

              <h3>
                Daftar Kategori
              </h3>

              <p>
                {filteredKategori.length} kategori
              </p>

            </div>

            <div className="search-wrapper">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari kategori..."
                aria-label="Cari kategori"
              />

            </div>

          </div>

          {loading ? (

            <div className="table-state">

              <p>
                Memuat data kategori...
              </p>

            </div>

          ) : filteredKategori.length === 0 ? (

            <div className="table-state">

              <p>
                Belum ada data kategori.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="data-table kategori-table">

                <thead>

                  <tr>
                    <th>No</th>
                    <th>Nama Kategori</th>
                    <th>Aksi</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredKategori.map(
                    (item, index) => (

                      <tr key={item.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <strong>
                            {item.nama_kategori}
                          </strong>
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