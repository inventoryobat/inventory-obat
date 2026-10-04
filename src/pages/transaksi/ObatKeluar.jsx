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

const ALASAN_OPTIONS = [
  'Rusak',
  'Expired',
  'Retur',
  'Pemakaian Internal',
  'Lainnya',
]

export default function ObatKeluar() {
  const navigate = useNavigate()

  const [obatList, setObatList] = useState([])
  const [batchList, setBatchList] = useState([])
  const [transaksiList, setTransaksiList] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [selectedTransaksi, setSelectedTransaksi] = useState(null)

  const [form, setForm] = useState({
    obat_id: '',
    nomor_batch: '',
    jumlah: '',
    alasan: '',
    keterangan: '',
    tanggal_keluar: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (!form.obat_id) {
      setBatchList([])
      return
    }

    fetchBatches(form.obat_id)
  }, [form.obat_id])

  const fetchAll = async () => {
    setLoading(true)
    setError('')

    const [obatResult, transaksiResult] =
      await Promise.all([
        supabase
          .from('obat')
          .select(`
            id,
            kode_obat,
            nama_obat,
            satuan,
            stok_minimum
          `)
          .order('nama_obat'),

        supabase
          .from('obat_keluar')
          .select(`
            id,
            obat_id,
            nomor_batch,
            jumlah,
            alasan,
            keterangan,
            tanggal_keluar,
            created_at,
            obat (
              id,
              kode_obat,
              nama_obat,
              satuan
            )
          `)
          .order('tanggal_keluar', {
            ascending: false,
          })
          .order('id', {
            ascending: false,
          }),
      ])

    if (obatResult.error) {
      setError(obatResult.error.message)
    } else {
      setObatList(obatResult.data || [])
    }

    if (transaksiResult.error) {
      setError(transaksiResult.error.message)
    } else {
      setTransaksiList(
        transaksiResult.data || []
      )
    }

    setLoading(false)
  }

  const fetchBatches = async (obatId) => {
    const { data, error: fetchError } =
      await supabase
        .from('obat_masuk')
        .select(`
          id,
          obat_id,
          nomor_batch,
          tanggal_expired,
          jumlah,
          tanggal_masuk
        `)
        .eq('obat_id', Number(obatId))
        .order('tanggal_expired', {
          ascending: true,
        })

    if (fetchError) {
      setError(fetchError.message)
      setBatchList([])
      return
    }

    /*
     * Hitung total obat keluar untuk setiap batch.
     */
    const { data: keluarData, error: keluarError } =
      await supabase
        .from('obat_keluar')
        .select(`
          id,
          obat_id,
          nomor_batch,
          jumlah
        `)
        .eq('obat_id', Number(obatId))

    if (keluarError) {
      setError(keluarError.message)
      setBatchList([])
      return
    }

    const batches = (data || []).map(
      (batch) => {
        const totalKeluar = (
          keluarData || []
        )
          .filter(
            (item) =>
              item.nomor_batch ===
              batch.nomor_batch
          )
          .reduce(
            (total, item) =>
              total + Number(item.jumlah),
            0
          )

        return {
          ...batch,
          totalKeluar,
          stokTersedia:
            Number(batch.jumlah) -
            totalKeluar,
        }
      }
    )

    /*
     * Gabungkan batch dengan nomor yang sama.
     */
    const grouped = []

    batches.forEach((batch) => {
      const existing = grouped.find(
        (item) =>
          item.nomor_batch ===
          batch.nomor_batch
      )

      if (existing) {
        existing.totalMasuk +=
          Number(batch.jumlah)

        existing.stokTersedia +=
          Number(batch.jumlah)
      } else {
        grouped.push({
          ...batch,
          totalMasuk: Number(batch.jumlah),
        })
      }
    })

    /*
     * Hanya tampilkan batch yang masih memiliki stok.
     */
    setBatchList(
      grouped.filter(
        (batch) =>
          batch.stokTersedia > 0
      )
    )
  }

  const getBatchStock = async (
    obatId,
    nomorBatch,
    excludeTransactionId = null
  ) => {
    const { data: masukData, error: masukError } =
      await supabase
        .from('obat_masuk')
        .select('id, jumlah')
        .eq('obat_id', Number(obatId))
        .eq('nomor_batch', nomorBatch)

    if (masukError) {
      throw new Error(masukError.message)
    }

    const totalMasuk = (
      masukData || []
    ).reduce(
      (total, item) =>
        total + Number(item.jumlah),
      0
    )

    let keluarQuery = supabase
      .from('obat_keluar')
      .select('id, jumlah')
      .eq('obat_id', Number(obatId))
      .eq('nomor_batch', nomorBatch)

    if (excludeTransactionId) {
      keluarQuery = keluarQuery.neq(
        'id',
        excludeTransactionId
      )
    }

    const {
      data: keluarData,
      error: keluarError,
    } = await keluarQuery

    if (keluarError) {
      throw new Error(keluarError.message)
    }

    const totalKeluar = (
      keluarData || []
    ).reduce(
      (total, item) =>
        total + Number(item.jumlah),
      0
    )

    return (
      totalMasuk - totalKeluar
    )
  }

  const resetForm = () => {
    setForm({
      obat_id: '',
      nomor_batch: '',
      jumlah: '',
      alasan: '',
      keterangan: '',
      tanggal_keluar: '',
    })

    setEditingId(null)
    setBatchList([])
    setError('')
  }

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'obat_id') {
      setForm((prev) => ({
        ...prev,
        obat_id: value,
        nomor_batch: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!form.obat_id) {
      setError('Silakan pilih obat.')
      return
    }

    if (!form.nomor_batch) {
      setError(
        'Silakan pilih nomor batch.'
      )
      return
    }

    if (
      !form.jumlah ||
      Number(form.jumlah) <= 0
    ) {
      setError(
        'Jumlah obat harus lebih dari 0.'
      )
      return
    }

    if (!form.alasan) {
      setError(
        'Silakan pilih alasan obat keluar.'
      )
      return
    }

    if (!form.tanggal_keluar) {
      setError(
        'Tanggal keluar wajib diisi.'
      )
      return
    }

    setSaving(true)

    try {
      const jumlahBaru =
        Number(form.jumlah)

      /*
       * Tambah transaksi
       */
      if (!editingId) {
        const stokTersedia =
          await getBatchStock(
            form.obat_id,
            form.nomor_batch
          )

        if (
          jumlahBaru >
          stokTersedia
        ) {
          throw new Error(
            `Stok tidak mencukupi. Stok tersedia untuk batch ${form.nomor_batch}: ${stokTersedia}.`
          )
        }

        const { error: insertError } =
          await supabase
            .from('obat_keluar')
            .insert({
              obat_id:
                Number(form.obat_id),
              nomor_batch:
                form.nomor_batch,
              jumlah: jumlahBaru,
              alasan:
                form.alasan,
              keterangan:
                form.keterangan.trim() ||
                null,
              tanggal_keluar:
                form.tanggal_keluar,
            })

        if (insertError) {
          throw new Error(
            insertError.message
          )
        }

        setSuccess(
          'Transaksi obat keluar berhasil ditambahkan.'
        )
      }

      /*
       * Edit transaksi
       */
      else {
        const oldTransaction =
          transaksiList.find(
            (item) =>
              item.id === editingId
          )

        if (!oldTransaction) {
          throw new Error(
            'Data transaksi yang akan diedit tidak ditemukan.'
          )
        }

        /*
         * Karena transaksi lama dikecualikan,
         * stok yang diperoleh adalah stok
         * sebelum transaksi lama.
         */
        const stokTersedia =
          await getBatchStock(
            form.obat_id,
            form.nomor_batch,
            editingId
          )

        if (
          jumlahBaru >
          stokTersedia
        ) {
          throw new Error(
            `Stok tidak mencukupi. Stok tersedia: ${stokTersedia}.`
          )
        }

        const { error: updateError } =
          await supabase
            .from('obat_keluar')
            .update({
              obat_id:
                Number(form.obat_id),
              nomor_batch:
                form.nomor_batch,
              jumlah: jumlahBaru,
              alasan:
                form.alasan,
              keterangan:
                form.keterangan.trim() ||
                null,
              tanggal_keluar:
                form.tanggal_keluar,
            })
            .eq('id', editingId)

        if (updateError) {
          throw new Error(
            updateError.message
          )
        }

        setSuccess(
          'Transaksi obat keluar berhasil diperbarui.'
        )
      }

      resetForm()
      await fetchAll()
    } catch (err) {
      setError(
        err.message ||
          'Terjadi kesalahan.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (item) => {
    setError('')
    setSuccess('')

    setEditingId(item.id)

    setForm({
      obat_id: String(item.obat_id),
      nomor_batch:
        item.nomor_batch || '',
      jumlah:
        String(item.jumlah || ''),
      alasan:
        item.alasan || '',
      keterangan:
        item.keterangan || '',
      tanggal_keluar:
        item.tanggal_keluar || '',
    })

    await fetchBatches(
      item.obat_id
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleDelete = async (item) => {
    setError('')
    setSuccess('')

    const confirmed =
      window.confirm(
        `Apakah Anda yakin ingin menghapus transaksi obat keluar "${item.obat?.nama_obat}" dengan batch "${item.nomor_batch}"?`
      )

    if (!confirmed) return

    try {
      setSaving(true)

      const {
        error: deleteError,
      } = await supabase
        .from('obat_keluar')
        .delete()
        .eq('id', item.id)

      if (deleteError) {
        throw new Error(
          deleteError.message
        )
      }

      setSuccess(
        'Transaksi obat keluar berhasil dihapus.'
      )

      if (editingId === item.id) {
        resetForm()
      }

      await fetchAll()

      if (form.obat_id) {
        await fetchBatches(
          form.obat_id
        )
      }
    } catch (err) {
      setError(
        err.message ||
          'Gagal menghapus transaksi.'
      )
    } finally {
      setSaving(false)
    }
  }

  const filteredTransaksi =
    useMemo(() => {
      const keyword =
        search
          .toLowerCase()
          .trim()

      if (!keyword) {
        return transaksiList
      }

      return transaksiList.filter(
        (item) => {
          const namaObat =
            item.obat?.nama_obat?.toLowerCase() ||
            ''

          const kodeObat =
            item.obat?.kode_obat?.toLowerCase() ||
            ''

          const batch =
            item.nomor_batch?.toLowerCase() ||
            ''

          const alasan =
            item.alasan?.toLowerCase() ||
            ''

          return (
            namaObat.includes(
              keyword
            ) ||
            kodeObat.includes(
              keyword
            ) ||
            batch.includes(
              keyword
            ) ||
            alasan.includes(
              keyword
            )
          )
        }
      )
    }, [transaksiList, search])

  const formatTanggal = (
    tanggal
  ) => {
    if (!tanggal) return '-'

    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )
  }

  const getSelectedBatch = () => {
    return batchList.find(
      (batch) =>
        batch.nomor_batch ===
        form.nomor_batch
    )
  }

  const selectedBatch =
    getSelectedBatch()

  return (
    <div className="obat-keluar-page">

      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate('/transaksi')
            }
            title="Kembali"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h2>Obat Keluar</h2>

            <p>
              Kelola transaksi obat yang
              keluar dari inventory.
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
            onClick={() =>
              setError('')
            }
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
            onClick={() =>
              setSuccess('')
            }
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* FORM */}
      <section className="card obat-keluar-form-card">
        <div className="card-heading">
          <div className="card-heading-icon">
            <Plus size={20} />
          </div>

          <div>
            <h3>
              {editingId
                ? 'Edit Obat Keluar'
                : 'Tambah Obat Keluar'}
            </h3>

            <p>
              {editingId
                ? 'Perbarui data transaksi obat keluar.'
                : 'Catat obat yang keluar dari inventory.'}
            </p>
          </div>
        </div>

        <form
          className="obat-keluar-form"
          onSubmit={handleSubmit}
        >
          <div className="obat-keluar-form-grid">

            {/* OBAT */}
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

                {obatList.map(
                  (obat) => (
                    <option
                      key={obat.id}
                      value={obat.id}
                    >
                      {obat.kode_obat} -{' '}
                      {obat.nama_obat}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BATCH */}
            <div className="form-group">
              <label>
                Nomor Batch <span>*</span>
              </label>

              <select
                name="nomor_batch"
                value={form.nomor_batch}
                onChange={handleChange}
                disabled={
                  saving ||
                  !form.obat_id
                }
              >
                <option value="">
                  {!form.obat_id
                    ? 'Pilih obat terlebih dahulu'
                    : batchList.length ===
                        0
                      ? 'Tidak ada batch tersedia'
                      : 'Pilih batch'}
                </option>

                {batchList.map(
                  (batch) => (
                    <option
                      key={`${batch.nomor_batch}-${batch.id}`}
                      value={
                        batch.nomor_batch
                      }
                    >
                      {batch.nomor_batch}
                      {' — '}
                      Stok:{' '}
                      {
                        batch.stokTersedia
                      }
                      {' — Exp: '}
                      {formatTanggal(
                        batch.tanggal_expired
                      )}
                    </option>
                  )
                )}
              </select>

              {selectedBatch && (
                <div className="batch-stock-info">
                  Stok tersedia:{' '}
                  <strong>
                    {
                      selectedBatch.stokTersedia
                    }{' '}
                    {
                      obatList.find(
                        (obat) =>
                          Number(
                            obat.id
                          ) ===
                          Number(
                            form.obat_id
                          )
                      )?.satuan
                    }
                  </strong>
                </div>
              )}
            </div>

            {/* JUMLAH */}
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

              {selectedBatch &&
                form.jumlah && (
                  <div
                    className={
                      Number(
                        form.jumlah
                      ) >
                      selectedBatch.stokTersedia
                        ? 'stock-warning'
                        : 'stock-ok'
                    }
                  >
                    {Number(
                      form.jumlah
                    ) >
                    selectedBatch.stokTersedia
                      ? 'Jumlah melebihi stok tersedia.'
                      : 'Jumlah tersedia untuk dikeluarkan.'}
                  </div>
                )}
            </div>

            {/* ALASAN */}
            <div className="form-group">
              <label>
                Alasan <span>*</span>
              </label>

              <select
                name="alasan"
                value={form.alasan}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Pilih alasan
                </option>

                {ALASAN_OPTIONS.map(
                  (alasan) => (
                    <option
                      key={alasan}
                      value={alasan}
                    >
                      {alasan}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TANGGAL */}
            <div className="form-group">
              <label>
                Tanggal Keluar{' '}
                <span>*</span>
              </label>

              <input
                type="date"
                name="tanggal_keluar"
                value={
                  form.tanggal_keluar
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* KETERANGAN */}
            <div className="form-group form-group-full">
              <label>
                Keterangan
              </label>

              <textarea
                name="keterangan"
                value={
                  form.keterangan
                }
                onChange={handleChange}
                placeholder="Tambahkan keterangan jika diperlukan..."
                rows="4"
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
                  : 'Tambah Obat Keluar'}
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
      <section className="card obat-keluar-table-card">

        <div className="card-heading table-heading">
          <div>
            <h3>
              Data Obat Keluar
            </h3>

            <p>
              Daftar seluruh transaksi obat
              keluar.
            </p>
          </div>

          <div className="table-count">
            {filteredTransaksi.length}{' '}
            transaksi
          </div>
        </div>

        <div className="search-wrapper">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Cari obat, batch, atau alasan..."
          />
        </div>

        {loading ? (
          <div className="table-empty">
            Memuat data...
          </div>
        ) : filteredTransaksi.length ===
          0 ? (
          <div className="table-empty">
            <div className="empty-icon">
              <Plus size={24} />
            </div>

            <strong>
              Belum ada transaksi
              obat keluar
            </strong>

            <p>
              Silakan tambahkan transaksi
              melalui form di atas.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="obat-keluar-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Obat</th>
                  <th>Batch</th>
                  <th>Jumlah</th>
                  <th>Alasan</th>
                  <th>Tanggal Keluar</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransaksi.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={item.id}
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <div className="table-primary-text">
                          {
                            item.obat
                              ?.nama_obat
                          }
                        </div>

                        <div className="table-secondary-text">
                          {
                            item.obat
                              ?.kode_obat
                          }
                        </div>
                      </td>

                      <td>
                        <span className="batch-badge">
                          {
                            item.nomor_batch
                          }
                        </span>
                      </td>

                      <td>
                        <strong>
                          {
                            item.jumlah
                          }{' '}
                          {
                            item.obat
                              ?.satuan
                          }
                        </strong>
                      </td>

                      <td>
                        <span className="reason-badge">
                          {
                            item.alasan
                          }
                        </span>
                      </td>

                      <td>
                        {formatTanggal(
                          item.tanggal_keluar
                        )}
                      </td>

                      <td>
                        <div className="table-description">
                          {item.keterangan ||
                            '-'}
                        </div>
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
                            <Eye
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className="icon-button edit"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            title="Edit"
                            disabled={
                              saving
                            }
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className="icon-button delete"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            title="Hapus"
                            disabled={
                              saving
                            }
                          >
                            <Trash2
                              size={17}
                            />
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

      {/* DETAIL MODAL */}
      {selectedTransaksi && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedTransaksi(
              null
            )
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
                  Detail Obat Keluar
                </h3>

                <p>
                  Informasi lengkap
                  transaksi.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedTransaksi(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-grid">

              <div className="detail-item">
                <span>
                  Nama Obat
                </span>

                <strong>
                  {
                    selectedTransaksi
                      .obat
                      ?.nama_obat
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Kode Obat
                </span>

                <strong>
                  {
                    selectedTransaksi
                      .obat
                      ?.kode_obat
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Nomor Batch
                </span>

                <strong>
                  {
                    selectedTransaksi
                      .nomor_batch
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Jumlah
                </span>

                <strong>
                  {
                    selectedTransaksi
                      .jumlah
                  }{' '}
                  {
                    selectedTransaksi
                      .obat
                      ?.satuan
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Alasan
                </span>

                <strong>
                  {
                    selectedTransaksi
                      .alasan
                  }
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Tanggal Keluar
                </span>

                <strong>
                  {formatTanggal(
                    selectedTransaksi
                      .tanggal_keluar
                  )}
                </strong>
              </div>

              <div className="detail-item detail-item-full">
                <span>
                  Keterangan
                </span>

                <strong>
                  {
                    selectedTransaksi
                      .keterangan ||
                    '-'
                  }
                </strong>
              </div>

            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  setSelectedTransaksi(
                    null
                  )
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

                  setSelectedTransaksi(
                    null
                  )
                }}
              >
                <Pencil
                  size={17}
                />
                Edit Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}