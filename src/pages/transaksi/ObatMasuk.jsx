import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ObatMasuk() {
  const navigate = useNavigate()

  const [obatList, setObatList] = useState([])
  const [supplierList, setSupplierList] = useState([])
  const [transaksiList, setTransaksiList] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [selectedTransaksi, setSelectedTransaksi] = useState(null)

  const [form, setForm] = useState({
    obat_id: '',
    supplier_id: '',
    nomor_batch: '',
    tanggal_expired: '',
    jumlah: '',
    tanggal_masuk: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError('')

    const [obatResult, supplierResult, transaksiResult] =
      await Promise.all([
        supabase
          .from('obat')
          .select('id, kode_obat, nama_obat, satuan')
          .order('nama_obat'),

        supabase
          .from('supplier')
          .select('id, kode_supplier, nama_supplier')
          .order('nama_supplier'),

        supabase
          .from('obat_masuk')
          .select(`
            id,
            obat_id,
            supplier_id,
            nomor_batch,
            tanggal_expired,
            jumlah,
            tanggal_masuk,
            created_at,
            obat (
              id,
              kode_obat,
              nama_obat,
              satuan
            ),
            supplier (
              id,
              kode_supplier,
              nama_supplier
            )
          `)
          .order('tanggal_masuk', { ascending: false })
          .order('id', { ascending: false }),
      ])

    if (obatResult.error) {
      setError(obatResult.error.message)
    } else {
      setObatList(obatResult.data || [])
    }

    if (supplierResult.error) {
      setError(supplierResult.error.message)
    } else {
      setSupplierList(supplierResult.data || [])
    }

    if (transaksiResult.error) {
      setError(transaksiResult.error.message)
    } else {
      setTransaksiList(transaksiResult.data || [])
    }

    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      obat_id: '',
      supplier_id: '',
      nomor_batch: '',
      tanggal_expired: '',
      jumlah: '',
      tanggal_masuk: '',
    })

    setEditingId(null)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!form.obat_id) {
      setError('Silakan pilih obat.')
      return
    }

    if (!form.supplier_id) {
      setError('Silakan pilih supplier.')
      return
    }

    if (!form.nomor_batch.trim()) {
      setError('Nomor batch wajib diisi.')
      return
    }

    if (!form.tanggal_expired) {
      setError('Tanggal expired wajib diisi.')
      return
    }

    if (!form.jumlah || Number(form.jumlah) <= 0) {
      setError('Jumlah obat harus lebih dari 0.')
      return
    }

    if (!form.tanggal_masuk) {
      setError('Tanggal masuk wajib diisi.')
      return
    }

    if (form.tanggal_expired < form.tanggal_masuk) {
      setError(
        'Tanggal expired tidak boleh lebih awal dari tanggal masuk.'
      )
      return
    }

    setSaving(true)

    try {
      if (!editingId) {
        const { error: insertError } = await supabase
          .from('obat_masuk')
          .insert({
            obat_id: Number(form.obat_id),
            supplier_id: Number(form.supplier_id),
            nomor_batch: form.nomor_batch.trim(),
            tanggal_expired: form.tanggal_expired,
            jumlah: Number(form.jumlah),
            tanggal_masuk: form.tanggal_masuk,
          })

        if (insertError) {
          throw new Error(insertError.message)
        }

        setSuccess('Transaksi obat masuk berhasil ditambahkan.')
      } else {
        /*
         * Saat edit, kita harus memastikan perubahan transaksi
         * tidak menyebabkan stok batch menjadi negatif.
         */

        const oldTransaction = transaksiList.find(
          (item) => item.id === editingId
        )

        if (!oldTransaction) {
          throw new Error(
            'Data transaksi yang akan diedit tidak ditemukan.'
          )
        }

        const oldObatId = Number(oldTransaction.obat_id)
        const oldBatch = oldTransaction.nomor_batch

        const newObatId = Number(form.obat_id)
        const newBatch = form.nomor_batch.trim()
        const newJumlah = Number(form.jumlah)

        /*
         * Ambil seluruh transaksi obat keluar
         * untuk batch lama dan batch baru.
         */
        const { data: keluarData, error: keluarError } =
          await supabase
            .from('obat_keluar')
            .select('obat_id, nomor_batch, jumlah')
            .or(
              `obat_id.eq.${oldObatId},obat_id.eq.${newObatId}`
            )

        if (keluarError) {
          throw new Error(keluarError.message)
        }

        const oldOutgoing = (keluarData || [])
          .filter(
            (item) =>
              Number(item.obat_id) === oldObatId &&
              item.nomor_batch === oldBatch
          )
          .reduce(
            (total, item) => total + Number(item.jumlah),
            0
          )

        const newOutgoing = (keluarData || [])
          .filter(
            (item) =>
              Number(item.obat_id) === newObatId &&
              item.nomor_batch === newBatch
          )
          .reduce(
            (total, item) => total + Number(item.jumlah),
            0
          )

        /*
         * Ambil transaksi masuk lain selain transaksi
         * yang sedang diedit.
         */
        const { data: incomingData, error: incomingError } =
          await supabase
            .from('obat_masuk')
            .select(
              'id, obat_id, nomor_batch, jumlah'
            )
            .neq('id', editingId)

        if (incomingError) {
          throw new Error(incomingError.message)
        }

        /*
         * Stok batch lama setelah transaksi ini
         * dikurangi/dipindahkan.
         */
        const oldIncomingOther = (incomingData || [])
          .filter(
            (item) =>
              Number(item.obat_id) === oldObatId &&
              item.nomor_batch === oldBatch
          )
          .reduce(
            (total, item) => total + Number(item.jumlah),
            0
          )

        const oldRemaining =
          oldIncomingOther - oldOutgoing

        if (oldRemaining < 0) {
          throw new Error(
            'Transaksi tidak dapat diedit karena stok pada batch lama sudah digunakan pada transaksi obat keluar.'
          )
        }

        /*
         * Jika batch/obat baru berbeda, cek stok akhir
         * pada batch baru.
         */
        const newIncomingOther = (incomingData || [])
          .filter(
            (item) =>
              Number(item.obat_id) === newObatId &&
              item.nomor_batch === newBatch
          )
          .reduce(
            (total, item) => total + Number(item.jumlah),
            0
          )

        const newRemaining =
          newIncomingOther +
          newJumlah -
          newOutgoing

        if (newRemaining < 0) {
          throw new Error(
            'Jumlah tidak dapat disimpan karena akan menyebabkan stok batch menjadi negatif.'
          )
        }

        const { error: updateError } = await supabase
          .from('obat_masuk')
          .update({
            obat_id: newObatId,
            supplier_id: Number(form.supplier_id),
            nomor_batch: newBatch,
            tanggal_expired: form.tanggal_expired,
            jumlah: newJumlah,
            tanggal_masuk: form.tanggal_masuk,
          })
          .eq('id', editingId)

        if (updateError) {
          throw new Error(updateError.message)
        }

        setSuccess('Transaksi obat masuk berhasil diperbarui.')
      }

      resetForm()
      await fetchAll()
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setError('')
    setSuccess('')

    setEditingId(item.id)

    setForm({
      obat_id: String(item.obat_id),
      supplier_id: item.supplier_id
        ? String(item.supplier_id)
        : '',
      nomor_batch: item.nomor_batch || '',
      tanggal_expired: item.tanggal_expired || '',
      jumlah: String(item.jumlah || ''),
      tanggal_masuk: item.tanggal_masuk || '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleDelete = async (item) => {
    setError('')
    setSuccess('')

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus transaksi obat masuk "${item.obat?.nama_obat}" dengan batch "${item.nomor_batch}"?`
    )

    if (!confirmed) return

    try {
      setSaving(true)

      /*
       * Cek apakah batch ini sudah digunakan
       * pada transaksi obat keluar.
       */
      const { data: keluarData, error: keluarError } =
        await supabase
          .from('obat_keluar')
          .select('jumlah')
          .eq('obat_id', item.obat_id)
          .eq('nomor_batch', item.nomor_batch)

      if (keluarError) {
        throw new Error(keluarError.message)
      }

      const totalKeluar = (keluarData || []).reduce(
        (total, row) => total + Number(row.jumlah),
        0
      )

      /*
       * Ambil transaksi masuk lain pada batch yang sama.
       */
      const { data: incomingData, error: incomingError } =
        await supabase
          .from('obat_masuk')
          .select('id, jumlah')
          .eq('obat_id', item.obat_id)
          .eq('nomor_batch', item.nomor_batch)
          .neq('id', item.id)

      if (incomingError) {
        throw new Error(incomingError.message)
      }

      const totalMasukLain = (incomingData || []).reduce(
        (total, row) => total + Number(row.jumlah),
        0
      )

      const stokSetelahHapus =
        totalMasukLain - totalKeluar

      if (stokSetelahHapus < 0) {
        throw new Error(
          'Transaksi tidak dapat dihapus karena jumlah obat pada batch ini sudah digunakan pada transaksi obat keluar.'
        )
      }

      const { error: deleteError } = await supabase
        .from('obat_masuk')
        .delete()
        .eq('id', item.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Transaksi obat masuk berhasil dihapus.')

      if (editingId === item.id) {
        resetForm()
      }

      await fetchAll()
    } catch (err) {
      setError(err.message || 'Gagal menghapus transaksi.')
    } finally {
      setSaving(false)
    }
  }

  const filteredTransaksi = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) {
      return transaksiList
    }

    return transaksiList.filter((item) => {
      const namaObat =
        item.obat?.nama_obat?.toLowerCase() || ''

      const kodeObat =
        item.obat?.kode_obat?.toLowerCase() || ''

      const namaSupplier =
        item.supplier?.nama_supplier?.toLowerCase() || ''

      const kodeSupplier =
        item.supplier?.kode_supplier?.toLowerCase() || ''

      const batch =
        item.nomor_batch?.toLowerCase() || ''

      return (
        namaObat.includes(keyword) ||
        kodeObat.includes(keyword) ||
        namaSupplier.includes(keyword) ||
        kodeSupplier.includes(keyword) ||
        batch.includes(keyword)
      )
    })
  }, [transaksiList, search])

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '-'

    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getExpiryStatus = (tanggal) => {
    if (!tanggal) {
      return {
        label: '-',
        className: '',
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiry = new Date(
      `${tanggal}T00:00:00`
    )

    const diffTime =
      expiry.getTime() - today.getTime()

    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    )

    if (diffDays < 0) {
      return {
        label: 'Expired',
        className: 'status-danger',
      }
    }

    if (diffDays <= 30) {
      return {
        label: 'Segera Expired',
        className: 'status-warning',
      }
    }

    return {
      label: 'Aman',
      className: 'status-success',
    }
  }

  return (
    <div className="obat-masuk-page">

      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/transaksi')}
            title="Kembali"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h2>Obat Masuk</h2>
            <p>
              Kelola transaksi obat yang masuk ke inventory.
            </p>
          </div>
        </div>
      </div>

      {/* ALERT */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess('')}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* FORM */}
      <section className="card obat-masuk-form-card">
        <div className="card-heading">
          <div className="card-heading-icon">
            <Plus size={20} />
          </div>

          <div>
            <h3>
              {editingId
                ? 'Edit Obat Masuk'
                : 'Tambah Obat Masuk'}
            </h3>

            <p>
              {editingId
                ? 'Perbarui data transaksi obat masuk.'
                : 'Masukkan data obat yang diterima.'}
            </p>
          </div>
        </div>

        <form
          className="obat-masuk-form"
          onSubmit={handleSubmit}
        >
          <div className="obat-masuk-form-grid">

            <div className="form-group">
              <label>
                Obat <span>*</span>
              </label>

              <select
                name="obat_id"
                value={form.obat_id}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Pilih obat
                </option>

                {obatList.map((obat) => (
                  <option
                    key={obat.id}
                    value={obat.id}
                  >
                    {obat.kode_obat} - {obat.nama_obat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Supplier <span>*</span>
              </label>

              <select
                name="supplier_id"
                value={form.supplier_id}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Pilih supplier
                </option>

                {supplierList.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.kode_supplier} -{' '}
                    {supplier.nama_supplier}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Nomor Batch <span>*</span>
              </label>

              <input
                type="text"
                name="nomor_batch"
                value={form.nomor_batch}
                onChange={handleChange}
                placeholder="Contoh: BTH-001"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>
                Jumlah <span>*</span>
              </label>

              <input
                type="number"
                name="jumlah"
                min="1"
                value={form.jumlah}
                onChange={handleChange}
                placeholder="Masukkan jumlah"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>
                Tanggal Masuk <span>*</span>
              </label>

              <input
                type="date"
                name="tanggal_masuk"
                value={form.tanggal_masuk}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>
                Tanggal Expired <span>*</span>
              </label>

              <input
                type="date"
                name="tanggal_expired"
                value={form.tanggal_expired}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

          </div>

          <div className="button-group form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={saving}
            >
              <Plus size={18} />

              {saving
                ? 'Menyimpan...'
                : editingId
                  ? 'Simpan Perubahan'
                  : 'Tambah Obat Masuk'}
            </button>

            {editingId && (
              <button
                type="button"
                className="button button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                <X size={18} />
                Batal Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* TABLE */}
      <section className="card obat-masuk-table-card">
        <div className="card-heading table-heading">
          <div>
            <h3>Data Obat Masuk</h3>

            <p>
              Daftar seluruh transaksi obat masuk.
            </p>
          </div>

          <div className="table-count">
            {filteredTransaksi.length} transaksi
          </div>
        </div>

        <div className="search-wrapper">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Cari obat, supplier, atau batch..."
          />
        </div>

        {loading ? (
          <div className="table-empty">
            Memuat data...
          </div>
        ) : filteredTransaksi.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">
              <Plus size={24} />
            </div>

            <strong>
              Belum ada transaksi obat masuk
            </strong>

            <p>
              Silakan tambahkan transaksi obat masuk
              melalui form di atas.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="obat-masuk-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Obat</th>
                  <th>Supplier</th>
                  <th>Batch</th>
                  <th>Jumlah</th>
                  <th>Tanggal Masuk</th>
                  <th>Expired</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransaksi.map(
                  (item, index) => {
                    const expiryStatus =
                      getExpiryStatus(
                        item.tanggal_expired
                      )

                    return (
                      <tr key={item.id}>
                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <div className="table-primary-text">
                            {item.obat?.nama_obat ||
                              '-'}
                          </div>

                          <div className="table-secondary-text">
                            {item.obat?.kode_obat ||
                              '-'}
                          </div>
                        </td>

                        <td>
                          <div className="table-primary-text">
                            {item.supplier
                              ?.nama_supplier ||
                              '-'}
                          </div>

                          <div className="table-secondary-text">
                            {item.supplier
                              ?.kode_supplier ||
                              '-'}
                          </div>
                        </td>

                        <td>
                          <span className="batch-badge">
                            {item.nomor_batch}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {item.jumlah}{' '}
                            {item.obat?.satuan ||
                              ''}
                          </strong>
                        </td>

                        <td>
                          {formatTanggal(
                            item.tanggal_masuk
                          )}
                        </td>

                        <td>
                          {formatTanggal(
                            item.tanggal_expired
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${expiryStatus.className}`}
                          >
                            {expiryStatus.label}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">

                            <button
                              type="button"
                              className="icon-button detail"
                              onClick={() =>
                                setSelectedTransaksi(
                                  item
                                )
                              }
                              title="Detail"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              className="icon-button edit"
                              onClick={() =>
                                handleEdit(item)
                              }
                              title="Edit"
                              disabled={saving}
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              className="icon-button delete"
                              onClick={() =>
                                handleDelete(item)
                              }
                              title="Hapus"
                              disabled={saving}
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DETAIL MODAL */}
      {selectedTransaksi && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedTransaksi(null)
          }
        >
          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h3>
                  Detail Obat Masuk
                </h3>

                <p>
                  Informasi lengkap transaksi.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedTransaksi(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-grid">

              <div className="detail-item">
                <span>Nama Obat</span>
                <strong>
                  {selectedTransaksi.obat
                    ?.nama_obat || '-'}
                </strong>
              </div>

              <div className="detail-item">
                <span>Kode Obat</span>
                <strong>
                  {selectedTransaksi.obat
                    ?.kode_obat || '-'}
                </strong>
              </div>

              <div className="detail-item">
                <span>Supplier</span>
                <strong>
                  {selectedTransaksi.supplier
                    ?.nama_supplier || '-'}
                </strong>
              </div>

              <div className="detail-item">
                <span>Kode Supplier</span>
                <strong>
                  {selectedTransaksi.supplier
                    ?.kode_supplier || '-'}
                </strong>
              </div>

              <div className="detail-item">
                <span>Nomor Batch</span>
                <strong>
                  {selectedTransaksi.nomor_batch}
                </strong>
              </div>

              <div className="detail-item">
                <span>Jumlah</span>
                <strong>
                  {selectedTransaksi.jumlah}{' '}
                  {selectedTransaksi.obat
                    ?.satuan || ''}
                </strong>
              </div>

              <div className="detail-item">
                <span>Tanggal Masuk</span>
                <strong>
                  {formatTanggal(
                    selectedTransaksi.tanggal_masuk
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Tanggal Expired</span>
                <strong>
                  {formatTanggal(
                    selectedTransaksi.tanggal_expired
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Status Expired</span>
                <strong>
                  {
                    getExpiryStatus(
                      selectedTransaksi.tanggal_expired
                    ).label
                  }
                </strong>
              </div>

            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  setSelectedTransaksi(null)
                }
              >
                Tutup
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  handleEdit(
                    selectedTransaksi
                  )

                  setSelectedTransaksi(null)
                }}
              >
                <Pencil size={17} />
                Edit Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}