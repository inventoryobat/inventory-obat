import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FileText,
  PackageCheck,
  Printer,
  Search,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function LaporanObatMasuk() {
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
      .from('obat_masuk')
      .select(`
        id,
        obat_id,
        supplier_id,
        nomor_batch,
        jumlah,
        tanggal_masuk,
        tanggal_expired,
        obat (
          id,
          nama_obat
        ),
        supplier (
          id,
          nama_supplier
        )
      `)
      .order('tanggal_masuk', { ascending: false })

    if (error) {
      console.error('Gagal mengambil laporan obat masuk:', error)
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
      const namaSupplier = item.supplier?.nama_supplier || ''
      const nomorBatch = item.nomor_batch || ''

      const matchSearch =
        !keyword ||
        namaObat.toLowerCase().includes(keyword) ||
        namaSupplier.toLowerCase().includes(keyword) ||
        nomorBatch.toLowerCase().includes(keyword)

      const tanggal = item.tanggal_masuk || ''

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
            <h1>Laporan Obat Masuk</h1>
            <p>
              Riwayat transaksi obat masuk
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
          <div className="laporan-summary-icon blue">
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
          <div className="laporan-summary-icon green">
            <PackageCheck size={19} />
          </div>

          <div className="laporan-summary-label">
            Total Obat Masuk
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
            <label htmlFor="search-obat-masuk">
              Cari
            </label>

            <div className="laporan-search-wrapper">
              <Search size={16} />

              <input
                id="search-obat-masuk"
                type="text"
                className="laporan-input laporan-search-input"
                placeholder="Cari nama obat, supplier, atau batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="laporan-field">
            <label htmlFor="tanggal-mulai">
              Tanggal Mulai
            </label>

            <div className="laporan-date-wrapper">
              <CalendarDays size={15} />

              <input
                id="tanggal-mulai"
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
            <label htmlFor="tanggal-selesai">
              Tanggal Selesai
            </label>

            <div className="laporan-date-wrapper">
              <CalendarDays size={15} />

              <input
                id="tanggal-selesai"
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
            <h2>Data Obat Masuk</h2>
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
              Belum ada data obat masuk yang sesuai
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
                  <th>Supplier</th>
                  <th>No. Batch</th>
                  <th>Jumlah</th>
                  <th>Tanggal Masuk</th>
                  <th>Tanggal Expired</th>
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
                      {item.supplier?.nama_supplier || '-'}
                    </td>

                    <td>
                      {item.nomor_batch || '-'}
                    </td>

                    <td>
                      {Number(item.jumlah || 0)}
                    </td>

                    <td>
                      {formatDate(item.tanggal_masuk)}
                    </td>

                    <td>
                      {formatDate(item.tanggal_expired)}
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

      {/* PRINT ONLY - HANYA TABEL */}
      <div className="laporan-print-area">
        <table className="laporan-print-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Obat</th>
              <th>Supplier</th>
              <th>No. Batch</th>
              <th>Jumlah</th>
              <th>Tanggal Masuk</th>
              <th>Tanggal Expired</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.obat?.nama_obat || '-'}</td>
                <td>{item.supplier?.nama_supplier || '-'}</td>
                <td>{item.nomor_batch || '-'}</td>
                <td>{Number(item.jumlah || 0)}</td>
                <td>{formatDate(item.tanggal_masuk)}</td>
                <td>{formatDate(item.tanggal_expired)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETAIL */}
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
              <h3>Detail Obat Masuk</h3>

              <button
                type="button"
                className="laporan-modal-close"
                onClick={() => setSelectedData(null)}
                title="Tutup"
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
                    Supplier
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.supplier?.nama_supplier || '-'}
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
                    Tanggal Masuk
                  </span>

                  <span className="laporan-detail-value">
                    {formatDate(selectedData.tanggal_masuk)}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Tanggal Expired
                  </span>

                  <span className="laporan-detail-value">
                    {formatDate(
                      selectedData.tanggal_expired
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