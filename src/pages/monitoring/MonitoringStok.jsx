import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Eye,
  Package,
  Search,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function MonitoringStok() {
  const navigate = useNavigate()

  const [obat, setObat] = useState([])
  const [obatMasuk, setObatMasuk] = useState([])
  const [obatKeluar, setObatKeluar] = useState([])

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedObat, setSelectedObat] = useState(null)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    setLoading(true)
    setMessage('')

    const [
      obatResult,
      obatMasukResult,
      obatKeluarResult,
    ] = await Promise.all([
      supabase
        .from('obat')
        .select(`
          id,
          kode_obat,
          nama_obat,
          satuan,
          stok_minimum,
          kategori (
            id,
            nama_kategori
          )
        `)
        .order('nama_obat', { ascending: true }),

      supabase
        .from('obat_masuk')
        .select(`
          id,
          obat_id,
          nomor_batch,
          tanggal_expired,
          jumlah,
          tanggal_masuk
        `)
        .order('tanggal_masuk', {
          ascending: false,
        }),

      supabase
        .from('obat_keluar')
        .select(`
          id,
          obat_id,
          nomor_batch,
          jumlah,
          alasan,
          keterangan,
          tanggal_keluar
        `)
        .order('tanggal_keluar', {
          ascending: false,
        }),
    ])

    if (obatResult.error) {
      setMessageType('error')
      setMessage(
        `Gagal mengambil data obat: ${obatResult.error.message}`
      )
      setLoading(false)
      return
    }

    if (obatMasukResult.error) {
      setMessageType('error')
      setMessage(
        `Gagal mengambil data obat masuk: ${obatMasukResult.error.message}`
      )
      setLoading(false)
      return
    }

    if (obatKeluarResult.error) {
      setMessageType('error')
      setMessage(
        `Gagal mengambil data obat keluar: ${obatKeluarResult.error.message}`
      )
      setLoading(false)
      return
    }

    setObat(obatResult.data || [])
    setObatMasuk(obatMasukResult.data || [])
    setObatKeluar(obatKeluarResult.data || [])

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // =====================================================
  // HITUNG DATA STOK
  // =====================================================

  const stokObat = useMemo(() => {
    return obat.map((item) => {
      const transaksiMasuk = obatMasuk.filter(
        (transaksi) =>
          transaksi.obat_id === item.id
      )

      const transaksiKeluar = obatKeluar.filter(
        (transaksi) =>
          transaksi.obat_id === item.id
      )

      const totalMasuk = transaksiMasuk.reduce(
        (total, transaksi) =>
          total + Number(transaksi.jumlah || 0),
        0
      )

      const totalKeluar = transaksiKeluar.reduce(
        (total, transaksi) =>
          total + Number(transaksi.jumlah || 0),
        0
      )

      const totalStok =
        totalMasuk - totalKeluar

      let status = 'Aman'

      if (totalStok <= 0) {
        status = 'Habis'
      } else if (
        totalStok <= Number(item.stok_minimum || 0)
      ) {
        status = 'Menipis'
      }

      return {
        ...item,
        totalMasuk,
        totalKeluar,
        totalStok,
        status,
      }
    })
  }, [obat, obatMasuk, obatKeluar])

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredObat = useMemo(() => {
    const keyword = search
      .toLowerCase()
      .trim()

    if (!keyword) {
      return stokObat
    }

    return stokObat.filter((item) =>
      item.kode_obat
        ?.toLowerCase()
        .includes(keyword) ||
      item.nama_obat
        ?.toLowerCase()
        .includes(keyword) ||
      item.kategori?.nama_kategori
        ?.toLowerCase()
        .includes(keyword)
    )
  }, [stokObat, search])

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalJenisObat = stokObat.length

  const totalObatMasuk = stokObat.reduce(
    (total, item) =>
      total + item.totalMasuk,
    0
  )

  const totalObatKeluar = stokObat.reduce(
    (total, item) =>
      total + item.totalKeluar,
    0
  )

  const totalStokKeseluruhan =
    stokObat.reduce(
      (total, item) =>
        total + item.totalStok,
      0
    )

  // =====================================================
  // STATUS
  // =====================================================

  const getStatusClass = (status) => {
    if (status === 'Habis') {
      return 'stock-status stock-status-empty'
    }

    if (status === 'Menipis') {
      return 'stock-status stock-status-low'
    }

    return 'stock-status stock-status-safe'
  }

  // =====================================================
  // DETAIL
  // =====================================================

  const handleDetail = (item) => {
    setSelectedObat(item)
  }

  const closeDetail = () => {
    setSelectedObat(null)
  }

  // =====================================================
  // RINCIAN BATCH
  // =====================================================

  const getBatchDetails = (item) => {
    const incomingTransactions =
      obatMasuk.filter(
        (transaksi) =>
          transaksi.obat_id === item.id
      )

    const outgoingTransactions =
      obatKeluar.filter(
        (transaksi) =>
          transaksi.obat_id === item.id
      )

    /*
      Kelompokkan obat masuk berdasarkan nomor batch.
      Ini mencegah stok batch dihitung berulang
      jika satu batch memiliki lebih dari satu
      transaksi obat masuk.
    */

    const batchMap = new Map()

    incomingTransactions.forEach(
      (transaksi) => {
        const batch =
          transaksi.nomor_batch

        if (!batchMap.has(batch)) {
          batchMap.set(batch, {
            nomor_batch: batch,
            tanggal_expired:
              transaksi.tanggal_expired,
            jumlahMasuk: 0,
          })
        }

        const current =
          batchMap.get(batch)

        current.jumlahMasuk += Number(
          transaksi.jumlah || 0
        )
      }
    )

    return Array.from(
      batchMap.values()
    ).map((batch) => {
      const batchKeluar =
        outgoingTransactions.filter(
          (transaksi) =>
            transaksi.nomor_batch ===
            batch.nomor_batch
        )

      const jumlahKeluar =
        batchKeluar.reduce(
          (total, transaksi) =>
            total +
            Number(
              transaksi.jumlah || 0
            ),
          0
        )

      const stokBatch =
        batch.jumlahMasuk -
        jumlahKeluar

      return {
        ...batch,
        jumlahKeluar,
        stokBatch,
      }
    })
  }

  // =====================================================
  // RIWAYAT OBAT KELUAR
  // =====================================================

  const getOutgoingHistory = (item) => {
    return obatKeluar
      .filter(
        (transaksi) =>
          transaksi.obat_id === item.id
      )
      .sort(
        (a, b) =>
          new Date(
            b.tanggal_keluar
          ) -
          new Date(
            a.tanggal_keluar
          )
      )
  }

  // =====================================================
  // FORMAT TANGGAL
  // =====================================================

  const formatDate = (date) => {
    if (!date) return '-'

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    ).format(new Date(date))
  }

  return (
    <div className="monitoring-stok-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page-header">
  <div className="page-header-left">
    <button
      type="button"
      className="back-button"
      onClick={() => navigate('/monitoring')}
      aria-label="Kembali ke Monitoring"
      title="Kembali ke Monitoring"
    >
      <ArrowLeft size={18} strokeWidth={2} />
    </button>

    <div>
      <h2>Monitoring Stok</h2>
      <p>
        Melihat jumlah stok setiap obat dan stok berdasarkan batch.
      </p>
    </div>
  </div>
</div>

      {/* =================================================
          MESSAGE
      ================================================= */}

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

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="monitoring-stock-summary">

        <div className="monitoring-stock-summary-card">

          <div className="monitoring-stock-summary-icon">
            <Package
              size={22}
              strokeWidth={2}
            />
          </div>

          <div>
            <span>Total Jenis Obat</span>

            <strong>
              {totalJenisObat}
            </strong>
          </div>

        </div>

        <div className="monitoring-stock-summary-card">

          <div className="monitoring-stock-summary-icon">
            <Package
              size={22}
              strokeWidth={2}
            />
          </div>

          <div>
            <span>Total Obat Masuk</span>

            <strong>
              {totalObatMasuk}
            </strong>
          </div>

        </div>

        <div className="monitoring-stock-summary-card">

          <div className="monitoring-stock-summary-icon">
            <Package
              size={22}
              strokeWidth={2}
            />
          </div>

          <div>
            <span>Total Obat Keluar</span>

            <strong>
              {totalObatKeluar}
            </strong>
          </div>

        </div>

        <div className="monitoring-stock-summary-card">

          <div className="monitoring-stock-summary-icon">
            <Package
              size={22}
              strokeWidth={2}
            />
          </div>

          <div>
            <span>Total Stok Saat Ini</span>

            <strong>
              {totalStokKeseluruhan}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          TABLE STOK
      ================================================= */}

      <section className="monitoring-stock-table-card">

        <div className="table-card-header">

          <div>

            <h3>
              Daftar Stok Obat
            </h3>

            <p>
              {filteredObat.length}{' '}
              obat
            </p>

          </div>

          <div className="search-wrapper">

            <Search
              size={18}
              strokeWidth={2}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Cari obat..."
              aria-label="Cari obat"
            />

          </div>

        </div>

        {loading ? (

          <div className="table-state">
            <p>
              Memuat data stok...
            </p>
          </div>

        ) : filteredObat.length === 0 ? (

          <div className="table-state">
            <p>
              Belum ada data stok obat.
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

                  <th>Obat Masuk</th>

                  <th>Obat Keluar</th>

                  <th>Stok</th>

                  <th>Stok Minimum</th>

                  <th>Status</th>

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
                          ?.nama_kategori ||
                          '-'}
                      </td>

                      <td>
                        {item.satuan}
                      </td>

                      <td>
                        <strong className="stock-in-value">
                          {item.totalMasuk}
                        </strong>
                      </td>

                      <td>
                        <strong className="stock-out-value">
                          {item.totalKeluar}
                        </strong>
                      </td>

                      <td>
                        <strong className="stock-current-value">
                          {item.totalStok}
                        </strong>
                      </td>

                      <td>
                        {item.stok_minimum}
                      </td>

                      <td>

                        <span
                          className={getStatusClass(
                            item.status
                          )}
                        >
                          {item.status}
                        </span>

                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            className="btn-detail"
                            onClick={() =>
                              handleDetail(
                                item
                              )
                            }
                            title="Detail stok"
                          >

                            <Eye
                              size={16}
                              strokeWidth={2}
                            />

                            <span>
                              Detail
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

      {/* =================================================
          DETAIL MODAL
      ================================================= */}

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
          >

            {/* HEADER */}

            <div className="detail-modal-header">

              <div>

                <h3>
                  Detail Stok Obat
                </h3>

                <p>
                  {selectedObat.nama_obat}
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

            {/* BODY */}

            <div className="detail-modal-body">

              {/* =========================================
                  INFORMASI STOK
              ========================================= */}

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
                      ?.nama_kategori ||
                      '-'}
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
                    Total Obat Masuk
                  </span>

                  <strong className="stock-in-value">
                    {selectedObat.totalMasuk}{' '}
                    {selectedObat.satuan}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Total Obat Keluar
                  </span>

                  <strong className="stock-out-value">
                    {selectedObat.totalKeluar}{' '}
                    {selectedObat.satuan}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Stok Saat Ini
                  </span>

                  <strong className="stock-current-value">
                    {selectedObat.totalStok}{' '}
                    {selectedObat.satuan}
                  </strong>

                </div>

                <div className="detail-info-item">

                  <span>
                    Stok Minimum
                  </span>

                  <strong>
                    {selectedObat.stok_minimum}{' '}
                    {selectedObat.satuan}
                  </strong>

                </div>

              </div>

              {/* =========================================
                  RINCIAN BATCH
              ========================================= */}

              <div className="stock-batch-section">

                <div className="stock-batch-header">

                  <h4>
                    Rincian Stok Berdasarkan Batch
                  </h4>

                </div>

                {getBatchDetails(
                  selectedObat
                ).length === 0 ? (

                  <div className="table-state">

                    <p>
                      Belum ada transaksi
                      obat masuk untuk
                      obat ini.
                    </p>

                  </div>

                ) : (

                  <div className="table-responsive">

                    <table className="data-table">

                      <thead>

                        <tr>

                          <th>
                            Batch
                          </th>

                          <th>
                            Expired
                          </th>

                          <th>
                            Obat Masuk
                          </th>

                          <th>
                            Obat Keluar
                          </th>

                          <th>
                            Stok Saat Ini
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {getBatchDetails(
                          selectedObat
                        ).map(
                          (batch) => (

                            <tr
                              key={
                                batch.nomor_batch
                              }
                            >

                              <td>
                                {
                                  batch.nomor_batch
                                }
                              </td>

                              <td>
                                {formatDate(
                                  batch.tanggal_expired
                                )}
                              </td>

                              <td>
                                <strong className="stock-in-value">
                                  {
                                    batch.jumlahMasuk
                                  }{' '}
                                  {
                                    selectedObat.satuan
                                  }
                                </strong>
                              </td>

                              <td>
                                <strong className="stock-out-value">
                                  {
                                    batch.jumlahKeluar
                                  }{' '}
                                  {
                                    selectedObat.satuan
                                  }
                                </strong>
                              </td>

                              <td>
                                <strong className="stock-current-value">
                                  {
                                    batch.stokBatch
                                  }{' '}
                                  {
                                    selectedObat.satuan
                                  }
                                </strong>
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

              {/* =========================================
                  RIWAYAT OBAT KELUAR
              ========================================= */}

              <div className="stock-batch-section">

                <div className="stock-batch-header">

                  <h4>
                    Riwayat Obat Keluar
                  </h4>

                </div>

                {getOutgoingHistory(
                  selectedObat
                ).length === 0 ? (

                  <div className="table-state">

                    <p>
                      Belum ada transaksi
                      obat keluar untuk
                      obat ini.
                    </p>

                  </div>

                ) : (

                  <div className="table-responsive">

                    <table className="data-table">

                      <thead>

                        <tr>

                          <th>
                            Tanggal Keluar
                          </th>

                          <th>
                            Batch
                          </th>

                          <th>
                            Jumlah
                          </th>

                          <th>
                            Alasan
                          </th>

                          <th>
                            Keterangan
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {getOutgoingHistory(
                          selectedObat
                        ).map(
                          (transaksi) => (

                            <tr
                              key={
                                transaksi.id
                              }
                            >

                              <td>
                                {formatDate(
                                  transaksi.tanggal_keluar
                                )}
                              </td>

                              <td>
                                {
                                  transaksi.nomor_batch
                                }
                              </td>

                              <td>
                                <strong className="stock-out-value">
                                  {
                                    transaksi.jumlah
                                  }{' '}
                                  {
                                    selectedObat.satuan
                                  }
                                </strong>
                              </td>

                              <td>
                                <span className="reason-badge">
                                  {
                                    transaksi.alasan
                                  }
                                </span>
                              </td>

                              <td>
                                {
                                  transaksi.keterangan ||
                                  '-'
                                }
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

            {/* FOOTER */}

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