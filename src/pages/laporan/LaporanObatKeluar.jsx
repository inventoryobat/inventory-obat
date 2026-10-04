import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FileText,
  PackageOpen,
  Printer,
  Search,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function LaporanObatKeluar() {
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')

  const [selectedData, setSelectedData] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const { data: rows, error } = await supabase
      .from('obat_keluar')
      .select(`
        id,
        obat_id,
        nomor_batch,
        jumlah,
        tanggal_keluar,
        obat (
          id,
          nama_obat
        )
      `)
      .order('tanggal_keluar', { ascending: false })

    if (error) {
      console.error('Gagal mengambil laporan obat keluar:', error)
      setData([])
    } else {
      setData(rows || [])
    }

    setLoading(false)
  }

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return data.filter((item) => {
      const namaObat = item.obat?.nama_obat || ''
      const nomorBatch = item.nomor_batch || ''

      const matchSearch =
        !keyword ||
        namaObat.toLowerCase().includes(keyword) ||
        nomorBatch.toLowerCase().includes(keyword)

      const tanggal = item.tanggal_keluar || ''

      const matchMulai =
        !tanggalMulai || tanggal >= tanggalMulai

      const matchSelesai =
        !tanggalSelesai || tanggal <= tanggalSelesai

      return (
        matchSearch &&
        matchMulai &&
        matchSelesai
      )
    })
  }, [
    data,
    search,
    tanggalMulai,
    tanggalSelesai,
  ])

  const totalTransaksi = filteredData.length

  const totalJumlah = filteredData.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  )

  function formatDate(date) {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function handlePrint() {
    window.print()
  }

  function resetFilter() {
    setSearch('')
    setTanggalMulai('')
    setTanggalSelesai('')
  }

  return (
    <div className="laporan-page">
      {/* HEADER */}
      <div className="laporan-header laporan-screen-only">
        <div className="laporan-header-left">
          <button
            type="button"
            className="laporan-back-button"
            onClick={() => navigate('/laporan')}
            title="Kembali"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="laporan-title-wrapper">
            <h1>Laporan Obat Keluar</h1>
            <p>
              Riwayat transaksi obat keluar
            </p>
          </div>
        </div>

        <div className="laporan-actions">
          <button
            type="button"
            className="laporan-button laporan-button-primary"
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="laporan-summary-grid laporan-screen-only">
        <div className="laporan-summary-card">
          <div className="laporan-summary-icon orange">
            <FileText size={19} />
          </div>

          <div className="laporan-summary-label">
            Total Transaksi
          </div>

          <div className="laporan-summary-value">
            {totalTransaksi}
          </div>
        </div>

        <div className="laporan-summary-card">
          <div className="laporan-summary-icon red">
            <PackageOpen size={19} />
          </div>

          <div className="laporan-summary-label">
            Total Obat Keluar
          </div>

          <div className="laporan-summary-value">
            {totalJumlah}
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="laporan-filter-card laporan-screen-only">
        <div className="laporan-filter-grid">
          <div className="laporan-field laporan-filter-full">
            <label htmlFor="search-obat-keluar">
              Cari
            </label>

            <div className="laporan-search-wrapper">
              <Search size={16} />

              <input
                id="search-obat-keluar"
                type="text"
                className="laporan-input laporan-search-input"
                placeholder="Cari nama obat atau nomor batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="laporan-field">
            <label htmlFor="tanggal-mulai-keluar">
              Tanggal Mulai
            </label>

            <div className="laporan-date-wrapper">
              <CalendarDays size={15} />

              <input
                id="tanggal-mulai-keluar"
                type="date"
                className="laporan-input"
                value={tanggalMulai}
                onChange={(e) =>
                  setTanggalMulai(e.target.value)
                }
              />
            </div>
          </div>

          <div className="laporan-field">
            <label htmlFor="tanggal-selesai-keluar">
              Tanggal Selesai
            </label>

            <div className="laporan-date-wrapper">
              <CalendarDays size={15} />

              <input
                id="tanggal-selesai-keluar"
                type="date"
                className="laporan-input"
                value={tanggalSelesai}
                onChange={(e) =>
                  setTanggalSelesai(e.target.value)
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="laporan-filter-button"
            onClick={resetFilter}
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE SCREEN */}
      <div className="laporan-table-card laporan-screen-only">
        <div className="laporan-table-header">
          <div>
            <h2>Data Obat Keluar</h2>
            <p>
              {filteredData.length} data ditemukan
            </p>
          </div>
        </div>

        {loading ? (
          <div className="laporan-loading">
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="laporan-empty">
            <div className="laporan-empty-icon">
              <FileText size={23} />
            </div>

            <h3>Data tidak ditemukan</h3>

            <p>
              Belum ada data obat keluar yang sesuai
              dengan filter.
            </p>
          </div>
        ) : (
          <div className="laporan-table-wrapper">
            <table className="laporan-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Obat</th>
                  <th>No. Batch</th>
                  <th>Jumlah</th>
                  <th>Tanggal Keluar</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {item.obat?.nama_obat || '-'}
                      </strong>
                    </td>

                    <td>
                      {item.nomor_batch || '-'}
                    </td>

                    <td>
                      {Number(item.jumlah || 0)}
                    </td>

                    <td>
                      {formatDate(item.tanggal_keluar)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="laporan-table-action"
                        onClick={() =>
                          setSelectedData(item)
                        }
                        title="Lihat detail"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINT ONLY */}
      <div className="laporan-print-area">
        <table className="laporan-print-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Obat</th>
              <th>No. Batch</th>
              <th>Jumlah</th>
              <th>Tanggal Keluar</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.obat?.nama_obat || '-'}</td>
                <td>{item.nomor_batch || '-'}</td>
                <td>{Number(item.jumlah || 0)}</td>
                <td>{formatDate(item.tanggal_keluar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedData && (
        <div
          className="laporan-modal-overlay laporan-screen-only"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedData(null)
            }
          }}
        >
          <div className="laporan-modal">
            <div className="laporan-modal-header">
              <h3>Detail Obat Keluar</h3>

              <button
                type="button"
                className="laporan-modal-close"
                onClick={() => setSelectedData(null)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="laporan-modal-body">
              <div className="laporan-detail-grid">
                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Nama Obat
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.obat?.nama_obat || '-'}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Nomor Batch
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.nomor_batch || '-'}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Jumlah
                  </span>

                  <span className="laporan-detail-value">
                    {Number(selectedData.jumlah || 0)}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Tanggal Keluar
                  </span>

                  <span className="laporan-detail-value">
                    {formatDate(
                      selectedData.tanggal_keluar
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="laporan-modal-footer">
              <button
                type="button"
                className="laporan-button laporan-button-secondary"
                onClick={() => setSelectedData(null)}
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