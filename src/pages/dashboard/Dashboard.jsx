import { useEffect, useState } from 'react'

import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  const [totalObat, setTotalObat] = useState(0)
  const [stokMenipis, setStokMenipis] = useState(0)
  const [obatExpired, setObatExpired] = useState(0)
  const [obatSegeraExpired, setObatSegeraExpired] = useState(0)
  const [totalObatMasuk, setTotalObatMasuk] = useState(0)
  const [totalObatKeluar, setTotalObatKeluar] = useState(0)

  const [expiredBatches, setExpiredBatches] = useState([])
  const [segeraExpiredBatches, setSegeraExpiredBatches] = useState([])

  const [selectedExpiryType, setSelectedExpiryType] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      // =========================
      // USER
      // =========================
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(user)

      // =========================
      // DATA OBAT
      // =========================
      const {
        data: obatData,
        error: obatError,
      } = await supabase
        .from('obat')
        .select('id, nama_obat, stok_minimum')

      if (obatError) {
        throw obatError
      }

      // =========================
      // OBAT MASUK
      // =========================
      const {
        data: obatMasukData,
        error: obatMasukError,
      } = await supabase
        .from('obat_masuk')
        .select(
          'obat_id, nomor_batch, tanggal_expired, jumlah'
        )

      if (obatMasukError) {
        throw obatMasukError
      }

      // =========================
      // OBAT KELUAR
      // =========================
      const {
        data: obatKeluarData,
        error: obatKeluarError,
      } = await supabase
        .from('obat_keluar')
        .select(
          'obat_id, nomor_batch, jumlah'
        )

      if (obatKeluarError) {
        throw obatKeluarError
      }

      // =========================
      // TOTAL OBAT
      // =========================
      setTotalObat(
        obatData?.length || 0
      )

      // =========================
      // TOTAL TRANSAKSI
      // =========================
      setTotalObatMasuk(
        obatMasukData?.length || 0
      )

      setTotalObatKeluar(
        obatKeluarData?.length || 0
      )

      // =========================
      // HITUNG STOK PER OBAT
      // =========================
      const stokMap = {}

      obatData?.forEach((obat) => {
        stokMap[obat.id] = {
          namaObat:
            obat.nama_obat || 'Obat',
          stok: 0,
          stokMinimum: Number(
            obat.stok_minimum || 0
          ),
        }
      })

      // Tambahkan stok obat masuk
      obatMasukData?.forEach((item) => {
        if (stokMap[item.obat_id]) {
          stokMap[item.obat_id].stok +=
            Number(item.jumlah || 0)
        }
      })

      // Kurangi stok obat keluar
      obatKeluarData?.forEach((item) => {
        if (stokMap[item.obat_id]) {
          stokMap[item.obat_id].stok -=
            Number(item.jumlah || 0)
        }
      })

      // =========================
      // STOK MENIPIS
      // =========================
      const jumlahStokMenipis =
        Object.values(stokMap).filter(
          (item) =>
            item.stok <= item.stokMinimum
        ).length

      setStokMenipis(
        jumlahStokMenipis
      )

      // =========================
      // HITUNG STOK PER BATCH
      // =========================
      const batchMap = {}

      // Obat masuk
      obatMasukData?.forEach((item) => {
        const key = `${item.obat_id}-${item.nomor_batch}`

        if (!batchMap[key]) {
          batchMap[key] = {
            obatId: item.obat_id,
            namaObat:
              stokMap[item.obat_id]
                ?.namaObat || 'Obat',
            nomorBatch:
              item.nomor_batch || '-',
            tanggalExpired:
              item.tanggal_expired,
            stok: 0,
          }
        }

        batchMap[key].stok +=
          Number(item.jumlah || 0)
      })

      // Obat keluar
      obatKeluarData?.forEach((item) => {
        const key = `${item.obat_id}-${item.nomor_batch}`

        if (batchMap[key]) {
          batchMap[key].stok -=
            Number(item.jumlah || 0)
        }
      })

      // =========================
      // MONITORING EXPIRED
      // =========================
      const today = new Date()

      today.setHours(0, 0, 0, 0)

      const expiredList = []
      const segeraExpiredList = []

      Object.values(batchMap).forEach(
        (batch) => {
          // Batch yang sudah tidak memiliki
          // stok tidak dihitung
          if (batch.stok <= 0) {
            return
          }

          // Tidak ada tanggal expired
          if (!batch.tanggalExpired) {
            return
          }

          const expiredDate = new Date(
            `${batch.tanggalExpired}T00:00:00`
          )

          if (Number.isNaN(
            expiredDate.getTime()
          )) {
            return
          }

          const difference =
            expiredDate.getTime() -
            today.getTime()

          const sisaHari = Math.ceil(
            difference /
              (1000 * 60 * 60 * 24)
          )

          const detailBatch = {
            ...batch,
            sisaHari,
          }

          // =========================
          // EXPIRED
          // =========================
          if (sisaHari < 0) {
            expiredList.push(
              detailBatch
            )
          }

          // =========================
          // SEGERA EXPIRED
          // =========================
          else if (sisaHari <= 30) {
            segeraExpiredList.push(
              detailBatch
            )
          }
        }
      )

      // Urutkan berdasarkan tanggal expired
      expiredList.sort(
        (a, b) =>
          new Date(
            a.tanggalExpired
          ) -
          new Date(
            b.tanggalExpired
          )
      )

      segeraExpiredList.sort(
        (a, b) =>
          new Date(
            a.tanggalExpired
          ) -
          new Date(
            b.tanggalExpired
          )
      )

      // Simpan data detail
      setExpiredBatches(
        expiredList
      )

      setSegeraExpiredBatches(
        segeraExpiredList
      )

      // Simpan jumlah
      setObatExpired(
        expiredList.length
      )

      setObatSegeraExpired(
        segeraExpiredList.length
      )
    } catch (err) {
      console.error(
        'Dashboard error:',
        err
      )

      setError(
        'Gagal mengambil data dashboard.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // MODAL DETAIL
  // =========================
  const closeExpiryModal = () => {
    setSelectedExpiryType(null)
  }

  const selectedBatches =
    selectedExpiryType === 'expired'
      ? expiredBatches
      : selectedExpiryType === 'segera'
        ? segeraExpiredBatches
        : []

  const modalTitle =
    selectedExpiryType === 'expired'
      ? 'Detail Obat Expired'
      : 'Detail Obat Segera Expired'

  const formatDate = (date) => {
    if (!date) {
      return '-'
    }

    const parsedDate = new Date(
      `${date}T00:00:00`
    )

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date
    }

    return parsedDate.toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    )
  }

  const getExpiryText = (sisaHari) => {
    if (sisaHari < 0) {
      return `Expired ${Math.abs(
        sisaHari
      )} hari yang lalu`
    }

    if (sisaHari === 0) {
      return 'Expired hari ini'
    }

    return `Expired dalam ${sisaHari} hari`
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>
          Memuat data inventory...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-page">

        {/* =========================
            HEADER
        ========================== */}
        <div className="page-header">
          <div>
            <h2>Dashboard</h2>

            <p>
              Selamat datang kembali,{' '}
              <strong>
                {user?.user_metadata?.nama ||
                  user?.email ||
                  'Administrator'}
              </strong>
              .
            </p>
          </div>
        </div>

        {/* =========================
            ERROR
        ========================== */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* =========================
            STATISTICS
        ========================== */}
        <div className="dashboard-statistics">

          {/* Total Obat */}
          <div className="dashboard-stat-card">
            <p>Total Obat</p>

            <h3>
              {totalObat}
            </h3>
          </div>

          {/* Stok Menipis */}
          <div className="dashboard-stat-card dashboard-stat-warning">
            <p>Stok Menipis</p>

            <h3>
              {stokMenipis}
            </h3>
          </div>

          {/* Obat Expired */}
          <button
            type="button"
            className="dashboard-stat-card dashboard-stat-danger dashboard-stat-clickable"
            onClick={() =>
              setSelectedExpiryType(
                'expired'
              )
            }
            disabled={
              obatExpired === 0
            }
          >
            <p>Obat Expired</p>

            <h3>
              {obatExpired}
            </h3>

            {obatExpired > 0 && (
              <span>
                Klik untuk melihat
                detail batch
              </span>
            )}
          </button>

          {/* Segera Expired */}
          <button
            type="button"
            className="dashboard-stat-card dashboard-stat-warning dashboard-stat-clickable"
            onClick={() =>
              setSelectedExpiryType(
                'segera'
              )
            }
            disabled={
              obatSegeraExpired === 0
            }
          >
            <p>Segera Expired</p>

            <h3>
              {obatSegeraExpired}
            </h3>

            {obatSegeraExpired > 0 && (
              <span>
                Klik untuk melihat
                detail batch
              </span>
            )}
          </button>

          {/* Obat Masuk */}
          <div className="dashboard-stat-card dashboard-stat-success">
            <p>Obat Masuk</p>

            <h3>
              {totalObatMasuk}
            </h3>
          </div>

          {/* Obat Keluar */}
          <div className="dashboard-stat-card dashboard-stat-info">
            <p>Obat Keluar</p>

            <h3>
              {totalObatKeluar}
            </h3>
          </div>

        </div>

        {/* =========================
            PERINGATAN EXPIRED
        ========================== */}
        {(obatExpired > 0 ||
          obatSegeraExpired > 0) && (
          <div className="dashboard-expiry-alert">

            <div className="dashboard-expiry-alert-content">

              <div>
                <h3>
                  Perhatian Inventory
                </h3>

                <p>
                  Terdapat batch obat
                  yang membutuhkan
                  perhatian.
                </p>
              </div>

              <div className="dashboard-expiry-alert-stats">

                {/* Batch Expired */}
                {obatExpired > 0 && (
                  <button
                    type="button"
                    className="dashboard-expiry-danger dashboard-expiry-clickable"
                    onClick={() =>
                      setSelectedExpiryType(
                        'expired'
                      )
                    }
                  >
                    <strong>
                      {obatExpired}
                    </strong>

                    <span>
                      Batch Expired
                    </span>
                  </button>
                )}

                {/* Segera Expired */}
                {obatSegeraExpired > 0 && (
                  <button
                    type="button"
                    className="dashboard-expiry-warning dashboard-expiry-clickable"
                    onClick={() =>
                      setSelectedExpiryType(
                        'segera'
                      )
                    }
                  >
                    <strong>
                      {obatSegeraExpired}
                    </strong>

                    <span>
                      Segera Expired
                    </span>
                  </button>
                )}

              </div>

            </div>

          </div>
        )}

      </div>

      {/* =========================
          MODAL DETAIL BATCH
      ========================== */}
      {selectedExpiryType && (
        <div
          className="dashboard-expiry-modal-overlay"
          onClick={closeExpiryModal}
        >
          <div
            className="dashboard-expiry-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Modal Header */}
            <div className="dashboard-expiry-modal-header">

              <div>
                <h3>
                  {modalTitle}
                </h3>

                <p>
                  {selectedBatches.length}{' '}
                  batch ditemukan
                </p>
              </div>

              <button
                type="button"
                className="dashboard-expiry-modal-close"
                onClick={
                  closeExpiryModal
                }
                aria-label="Tutup"
              >
                ×
              </button>

            </div>

            {/* Modal Content */}
            <div className="dashboard-expiry-modal-body">

              {selectedBatches.length ===
                0 ? (
                <div className="dashboard-expiry-empty">
                  <p>
                    Tidak ada batch
                    yang perlu
                    ditampilkan.
                  </p>
                </div>
              ) : (
                <div className="dashboard-expiry-batch-list">

                  {selectedBatches.map(
                    (batch) => (
                      <div
                        key={`${batch.obatId}-${batch.nomorBatch}-${batch.tanggalExpired}`}
                        className="dashboard-expiry-batch-card"
                      >

                        <div className="dashboard-expiry-batch-main">

                          <div>
                            <h4>
                              {batch.namaObat}
                            </h4>

                            <p>
                              Batch:{' '}
                              <strong>
                                {
                                  batch.nomorBatch
                                }
                              </strong>
                            </p>
                          </div>

                          <span
                            className={
                              batch.sisaHari <
                              0
                                ? 'dashboard-expiry-status dashboard-expiry-status-danger'
                                : 'dashboard-expiry-status dashboard-expiry-status-warning'
                            }
                          >
                            {batch.sisaHari <
                            0
                              ? 'Expired'
                              : 'Segera Expired'}
                          </span>

                        </div>

                        <div className="dashboard-expiry-batch-info">

                          <div>
                            <span>
                              Stok
                            </span>

                            <strong>
                              {batch.stok}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Tanggal Expired
                            </span>

                            <strong>
                              {formatDate(
                                batch.tanggalExpired
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Keterangan
                            </span>

                            <strong>
                              {getExpiryText(
                                batch.sisaHari
                              )}
                            </strong>
                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="dashboard-expiry-modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  closeExpiryModal
                }
              >
                Tutup
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  )
}