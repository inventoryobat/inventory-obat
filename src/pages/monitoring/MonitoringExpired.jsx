import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Search,
  Eye,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Clock3,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

const getToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const calculateDaysRemaining = (expiredDate) => {
  const today = getToday()
  const expiry = new Date(`${expiredDate}T00:00:00`)
  const difference = expiry.getTime() - today.getTime()

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  )
}

const getExpiryStatus = (daysRemaining) => {
  if (daysRemaining < 0) {
    return {
      label: 'Expired',
      className: 'status-danger',
      icon: XCircle,
    }
  }

  if (daysRemaining <= 30) {
    return {
      label: 'Segera Expired',
      className: 'status-warning',
      icon: AlertTriangle,
    }
  }

  return {
    label: 'Aman',
    className: 'status-success',
    icon: CheckCircle2,
  }
}

const formatDate = (date) => {
  if (!date) return '-'

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getRemainingText = (days) => {
  if (days < 0) {
    return `Lewat ${Math.abs(days)} hari`
  }

  if (days === 0) {
    return 'Expired hari ini'
  }

  if (days === 1) {
    return '1 hari lagi'
  }

  return `${days} hari lagi`
}

export default function MonitoringExpired() {
  const navigate = useNavigate()

  const [obat, setObat] = useState([])
  const [obatMasuk, setObatMasuk] = useState([])
  const [obatKeluar, setObatKeluar] = useState([])

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    const [
      { data: obatData, error: obatError },
      { data: masukData, error: masukError },
      { data: keluarData, error: keluarError },
    ] = await Promise.all([
      supabase
        .from('obat')
        .select(`
          id,
          kode_obat,
          nama_obat,
          satuan
        `)
        .order('nama_obat', {
          ascending: true,
        }),

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
        .order('tanggal_expired', {
          ascending: true,
        }),

      supabase
        .from('obat_keluar')
        .select(`
          id,
          obat_id,
          nomor_batch,
          jumlah,
          tanggal_keluar,
          alasan,
          keterangan
        `)
        .order('tanggal_keluar', {
          ascending: false,
        }),
    ])

    if (obatError || masukError || keluarError) {
      console.error({
        obatError,
        masukError,
        keluarError,
      })

      setError(
        'Gagal mengambil data monitoring expired.'
      )

      setLoading(false)
      return
    }

    setObat(obatData || [])
    setObatMasuk(masukData || [])
    setObatKeluar(keluarData || [])
    setLoading(false)
  }

  const batchData = useMemo(() => {
    const result = []

    obatMasuk.forEach((masuk) => {
      const obatItem = obat.find(
        (item) => item.id === masuk.obat_id
      )

      if (!obatItem) return

      const existing = result.find(
        (item) =>
          item.obat_id === masuk.obat_id &&
          item.nomor_batch === masuk.nomor_batch &&
          item.tanggal_expired === masuk.tanggal_expired
      )

      if (existing) {
        existing.jumlahMasuk += Number(
          masuk.jumlah || 0
        )

        existing.transaksiMasuk.push(masuk)
      } else {
        result.push({
          obat_id: masuk.obat_id,
          kode_obat: obatItem.kode_obat,
          nama_obat: obatItem.nama_obat,
          satuan: obatItem.satuan,
          nomor_batch: masuk.nomor_batch,
          tanggal_expired: masuk.tanggal_expired,
          jumlahMasuk: Number(masuk.jumlah || 0),
          jumlahKeluar: 0,
          transaksiMasuk: [masuk],
        })
      }
    })

    result.forEach((batch) => {
      const totalKeluar = obatKeluar
        .filter(
          (keluar) =>
            keluar.obat_id === batch.obat_id &&
            keluar.nomor_batch === batch.nomor_batch
        )
        .reduce(
          (total, keluar) =>
            total + Number(keluar.jumlah || 0),
          0
        )

      batch.jumlahKeluar = totalKeluar

      batch.stok = Math.max(
        batch.jumlahMasuk - batch.jumlahKeluar,
        0
      )

      batch.sisaHari = calculateDaysRemaining(
        batch.tanggal_expired
      )

      batch.status = getExpiryStatus(
        batch.sisaHari
      )
    })

    /*
     * Hanya batch yang masih memiliki stok
     * yang ditampilkan pada monitoring expired.
     */
    return result.filter(
      (batch) => batch.stok > 0
    )
  }, [obat, obatMasuk, obatKeluar])

  const filteredBatches = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase()

    if (!keyword) {
      return batchData
    }

    return batchData.filter((batch) =>
      [
        batch.kode_obat,
        batch.nama_obat,
        batch.nomor_batch,
        batch.tanggal_expired,
        batch.status.label,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    )
  }, [batchData, search])

  const summary = useMemo(() => {
    return {
      total: batchData.length,

      aman: batchData.filter(
        (batch) =>
          batch.status.label === 'Aman'
      ).length,

      segeraExpired: batchData.filter(
        (batch) =>
          batch.status.label ===
          'Segera Expired'
      ).length,

      expired: batchData.filter(
        (batch) =>
          batch.status.label === 'Expired'
      ).length,
    }
  }, [batchData])

  const attentionCount =
    summary.expired + summary.segeraExpired

  const getOutgoingHistory = (batch) => {
    return obatKeluar
      .filter(
        (keluar) =>
          keluar.obat_id === batch.obat_id &&
          keluar.nomor_batch === batch.nomor_batch
      )
      .sort(
        (a, b) =>
          new Date(b.tanggal_keluar) -
          new Date(a.tanggal_keluar)
      )
  }

  return (
    <div className="monitoring-expired-page">

      {/* HEADER */}
      <div className="page-header">

        <div className="page-header-left">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate('/monitoring')
            }
            aria-label="Kembali ke Monitoring"
            title="Kembali ke Monitoring"
          >
            <ArrowLeft
              size={18}
              strokeWidth={2}
            />
          </button>

          <div>
            <h2>Monitoring Expired</h2>

            <p>
              Pantau masa berlaku obat berdasarkan
              nomor batch dan kondisi stok.
            </p>
          </div>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="monitoring-expired-summary">

        <div className="monitoring-expired-summary-card total">
          <div className="monitoring-expired-summary-icon">
            <Package size={21} />
          </div>

          <div className="monitoring-expired-summary-info">
            <span>Total Batch Aktif</span>
            <strong>{summary.total}</strong>
            <small>Batch dengan stok tersedia</small>
          </div>
        </div>

        <div className="monitoring-expired-summary-card safe">
          <div className="monitoring-expired-summary-icon">
            <CheckCircle2 size={21} />
          </div>

          <div className="monitoring-expired-summary-info">
            <span>Aman</span>
            <strong>{summary.aman}</strong>
            <small>Masa berlaku &gt; 30 hari</small>
          </div>
        </div>

        <div className="monitoring-expired-summary-card warning">
          <div className="monitoring-expired-summary-icon">
            <AlertTriangle size={21} />
          </div>

          <div className="monitoring-expired-summary-info">
            <span>Segera Expired</span>
            <strong>{summary.segeraExpired}</strong>
            <small>Dalam 30 hari</small>
          </div>
        </div>

        <div className="monitoring-expired-summary-card danger">
          <div className="monitoring-expired-summary-icon">
            <XCircle size={21} />
          </div>

          <div className="monitoring-expired-summary-info">
            <span>Expired</span>
            <strong>{summary.expired}</strong>
            <small>Sudah melewati tanggal</small>
          </div>
        </div>

      </div>

      {/* ATTENTION PANEL */}
      {attentionCount > 0 && (
        <div
          className={`monitoring-expired-alert ${
            summary.expired > 0
              ? 'has-danger'
              : 'has-warning'
          }`}
        >

          <div className="monitoring-expired-alert-icon">
            {summary.expired > 0 ? (
              <XCircle size={22} />
            ) : (
              <AlertTriangle size={22} />
            )}
          </div>

          <div className="monitoring-expired-alert-content">

            <strong>
              {summary.expired > 0
                ? 'Perlu perhatian segera'
                : 'Ada obat yang akan segera expired'}
            </strong>

            <p>
              {summary.expired > 0 &&
                `${summary.expired} batch sudah expired.`}

              {summary.expired > 0 &&
                summary.segeraExpired > 0 &&
                ' '}

              {summary.segeraExpired > 0 &&
                `${summary.segeraExpired} batch akan expired dalam 30 hari.`}
            </p>

          </div>

          <div className="monitoring-expired-alert-count">
            <strong>{attentionCount}</strong>
            <span>batch perlu diperiksa</span>
          </div>

        </div>
      )}

      {/* ALL SAFE */}
      {!loading &&
        summary.total > 0 &&
        attentionCount === 0 && (
          <div className="monitoring-expired-safe-alert">

            <div className="monitoring-expired-safe-alert-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <strong>
                Semua batch dalam kondisi aman
              </strong>

              <p>
                Tidak ada batch yang expired atau
                akan expired dalam 30 hari ke depan.
              </p>
            </div>

          </div>
        )}

      {/* TABLE CARD */}
      <div className="monitoring-table-card">

        <div className="monitoring-table-header">

          <div className="monitoring-expired-table-title">

            <div>
              <h3>Daftar Monitoring Expired</h3>

              <p>
                Menampilkan kondisi masa berlaku
                setiap batch obat yang masih tersedia.
              </p>
            </div>

            <div className="monitoring-expired-legend">

              <span>
                <i className="safe" />
                Aman
              </span>

              <span>
                <i className="warning" />
                Segera Expired
              </span>

              <span>
                <i className="danger" />
                Expired
              </span>

            </div>

          </div>

          <div className="monitoring-stock-search">

            <div className="monitoring-stock-search-icon">
              <Search
                size={18}
                strokeWidth={2}
              />
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari obat atau batch..."
              aria-label="Cari obat atau batch"
            />

          </div>

        </div>

        {loading ? (
          <div className="monitoring-expired-loading">
            <div className="monitoring-expired-spinner" />
            <span>Memuat data monitoring...</span>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="empty-state">
            {search
              ? 'Tidak ada batch yang sesuai dengan pencarian.'
              : 'Tidak ada data monitoring expired.'}
          </div>
        ) : (
          <div className="table-responsive">

            <table className="monitoring-table">

              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Obat</th>
                  <th>Nama Obat</th>
                  <th>Batch</th>
                  <th>Tanggal Expired</th>
                  <th>Stok</th>
                  <th>Sisa Waktu</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>

                {filteredBatches.map(
                  (batch, index) => {
                    const StatusIcon =
                      batch.status.icon

                    return (
                      <tr
                        key={`${batch.obat_id}-${batch.nomor_batch}-${batch.tanggal_expired}`}
                        className={`monitoring-expired-row ${batch.status.className}`}
                      >

                        <td>
                          <span className="monitoring-expired-number">
                            {index + 1}
                          </span>
                        </td>

                        <td>
                          <span className="monitoring-expired-code">
                            {batch.kode_obat}
                          </span>
                        </td>

                        <td>
                          <div className="monitoring-expired-medicine">
                            <strong>
                              {batch.nama_obat}
                            </strong>

                            <span>
                              {batch.satuan}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="monitoring-expired-batch">
                            {batch.nomor_batch}
                          </span>
                        </td>

                        <td>
                          <div className="monitoring-expired-date">

                            <CalendarClock size={15} />

                            <span>
                              {formatDate(
                                batch.tanggal_expired
                              )}
                            </span>

                          </div>
                        </td>

                        <td>
                          <strong className="monitoring-expired-stock">
                            {batch.stok}{' '}
                            {batch.satuan}
                          </strong>
                        </td>

                        <td>
                          <div
                            className={`monitoring-expired-countdown ${batch.status.className}`}
                          >
                            <Clock3 size={14} />

                            <strong>
                              {getRemainingText(
                                batch.sisaHari
                              )}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${batch.status.className}`}
                          >
                            <StatusIcon size={14} />
                            {batch.status.label}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() =>
                              setSelectedBatch(batch)
                            }
                            aria-label="Lihat detail batch"
                            title="Lihat detail batch"
                          >
                            <Eye
                              size={17}
                              strokeWidth={2}
                            />
                          </button>
                        </td>

                      </tr>
                    )
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* DETAIL MODAL */}
      {selectedBatch && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedBatch(null)
          }
        >

          <div
            className="modal-content monitoring-expired-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h3>Detail Batch</h3>

                <p>
                  Informasi masa berlaku dan stok
                  batch obat.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedBatch(null)
                }
                aria-label="Tutup detail"
              >
                <X
                  size={20}
                  strokeWidth={2}
                />
              </button>

            </div>

            {/* STATUS DETAIL */}
            <div
              className={`monitoring-expired-detail-status ${selectedBatch.status.className}`}
            >

              <div className="monitoring-expired-detail-status-icon">
                {selectedBatch.status.label ===
                'Expired' ? (
                  <XCircle size={22} />
                ) : selectedBatch.status.label ===
                  'Segera Expired' ? (
                  <AlertTriangle size={22} />
                ) : (
                  <CheckCircle2 size={22} />
                )}
              </div>

              <div>

                <span>Status Masa Berlaku</span>

                <strong>
                  {selectedBatch.status.label}
                </strong>

                <small>
                  {getRemainingText(
                    selectedBatch.sisaHari
                  )}
                </small>

              </div>

            </div>

            <div className="detail-grid">

              <div className="detail-item">
                <span>Kode Obat</span>
                <strong>
                  {selectedBatch.kode_obat}
                </strong>
              </div>

              <div className="detail-item">
                <span>Nama Obat</span>
                <strong>
                  {selectedBatch.nama_obat}
                </strong>
              </div>

              <div className="detail-item">
                <span>Nomor Batch</span>
                <strong>
                  {selectedBatch.nomor_batch}
                </strong>
              </div>

              <div className="detail-item">
                <span>Satuan</span>
                <strong>
                  {selectedBatch.satuan}
                </strong>
              </div>

              <div className="detail-item">
                <span>Tanggal Expired</span>
                <strong>
                  {formatDate(
                    selectedBatch.tanggal_expired
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Sisa Waktu</span>
                <strong>
                  {getRemainingText(
                    selectedBatch.sisaHari
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Jumlah Masuk</span>
                <strong>
                  {selectedBatch.jumlahMasuk}{' '}
                  {selectedBatch.satuan}
                </strong>
              </div>

              <div className="detail-item">
                <span>Jumlah Keluar</span>
                <strong>
                  {selectedBatch.jumlahKeluar}{' '}
                  {selectedBatch.satuan}
                </strong>
              </div>

              <div className="detail-item">
                <span>Stok Saat Ini</span>
                <strong>
                  {selectedBatch.stok}{' '}
                  {selectedBatch.satuan}
                </strong>
              </div>

            </div>

            {/* RIWAYAT KELUAR */}
            <div className="detail-section">

              <h4>
                Riwayat Obat Keluar
              </h4>

              {getOutgoingHistory(
                selectedBatch
              ).length === 0 ? (
                <div className="empty-state">
                  Belum ada transaksi obat
                  keluar untuk batch ini.
                </div>
              ) : (
                <div className="table-responsive">

                  <table className="monitoring-table">

                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Jumlah</th>
                        <th>Alasan</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>

                    <tbody>

                      {getOutgoingHistory(
                        selectedBatch
                      ).map((item) => (
                        <tr key={item.id}>

                          <td>
                            {formatDate(
                              item.tanggal_keluar
                            )}
                          </td>

                          <td>
                            {item.jumlah}{' '}
                            {selectedBatch.satuan}
                          </td>

                          <td>
                            {item.alasan}
                          </td>

                          <td>
                            {item.keterangan || '-'}
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedBatch(null)
                }
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