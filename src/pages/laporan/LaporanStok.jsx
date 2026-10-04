import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  FileText,
  Package,
  Printer,
  Search,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function LaporanStok() {
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')

  const [selectedData, setSelectedData] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const [
      obatResult,
      masukResult,
      keluarResult,
    ] = await Promise.all([
      supabase
        .from('obat')
        .select(`
          id,
          nama_obat,
          stok_minimum,
          kategori_id,
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
          jumlah,
          tanggal_masuk,
          tanggal_expired
        `),

      supabase
        .from('obat_keluar')
        .select(`
          id,
          obat_id,
          nomor_batch,
          jumlah,
          tanggal_keluar
        `),
    ])

    if (obatResult.error) {
      console.error(
        'Gagal mengambil data obat:',
        obatResult.error
      )
    }

    if (masukResult.error) {
      console.error(
        'Gagal mengambil obat masuk:',
        masukResult.error
      )
    }

    if (keluarResult.error) {
      console.error(
        'Gagal mengambil obat keluar:',
        keluarResult.error
      )
    }

    const obatData = obatResult.data || []
    const masukData = masukResult.data || []
    const keluarData = keluarResult.data || []

    const masukMap = {}
    const keluarMap = {}

    masukData.forEach((item) => {
      const obatId = item.obat_id

      if (!masukMap[obatId]) {
        masukMap[obatId] = 0
      }

      masukMap[obatId] += Number(item.jumlah || 0)
    })

    keluarData.forEach((item) => {
      const obatId = item.obat_id

      if (!keluarMap[obatId]) {
        keluarMap[obatId] = 0
      }

      keluarMap[obatId] += Number(item.jumlah || 0)
    })

    const result = obatData.map((obat) => {
      const totalMasuk = masukMap[obat.id] || 0
      const totalKeluar = keluarMap[obat.id] || 0

      const stok = Math.max(
        0,
        totalMasuk - totalKeluar
      )

      const stokMinimum = Number(
        obat.stok_minimum || 0
      )

      let status = 'Aman'

      if (stok === 0) {
        status = 'Habis'
      } else if (stok <= stokMinimum) {
        status = 'Menipis'
      }

      return {
        ...obat,
        totalMasuk,
        totalKeluar,
        stok,
        stokMinimum,
        status,
      }
    })

    setData(result)
    setLoading(false)
  }

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return data.filter((item) => {
      const namaObat = item.nama_obat || ''
      const kategori = item.kategori?.nama_kategori || ''

      const matchSearch =
        !keyword ||
        namaObat.toLowerCase().includes(keyword) ||
        kategori.toLowerCase().includes(keyword)

      const matchStatus =
        statusFilter === 'Semua' ||
        item.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [
    data,
    search,
    statusFilter,
  ])

  const totalObat = filteredData.length

  const totalStok = filteredData.reduce(
    (total, item) => total + item.stok,
    0
  )

  const stokAman = filteredData.filter(
    (item) => item.status === 'Aman'
  ).length

  const stokMenipis = filteredData.filter(
    (item) => item.status === 'Menipis'
  ).length

  const stokHabis = filteredData.filter(
    (item) => item.status === 'Habis'
  ).length

  function getStatusClass(status) {
    if (status === 'Aman') {
      return 'laporan-status laporan-status-aman'
    }

    if (status === 'Menipis') {
      return 'laporan-status laporan-status-menipis'
    }

    return 'laporan-status laporan-status-habis'
  }

  function handlePrint() {
    window.print()
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
            <h1>Laporan Kondisi Stok</h1>
            <p>
              Kondisi stok obat berdasarkan transaksi
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
            <Package size={19} />
          </div>

          <div className="laporan-summary-label">
            Total Obat
          </div>

          <div className="laporan-summary-value">
            {totalObat}
          </div>
        </div>

        <div className="laporan-summary-card">
          <div className="laporan-summary-icon green">
            <Package size={19} />
          </div>

          <div className="laporan-summary-label">
            Total Stok
          </div>

          <div className="laporan-summary-value">
            {totalStok}
          </div>
        </div>

        <div className="laporan-summary-card">
          <div className="laporan-summary-icon green">
            <Package size={19} />
          </div>

          <div className="laporan-summary-label">
            Stok Aman
          </div>

          <div className="laporan-summary-value">
            {stokAman}
          </div>
        </div>

        <div className="laporan-summary-card">
          <div className="laporan-summary-icon red">
            <Package size={19} />
          </div>

          <div className="laporan-summary-label">
            Menipis / Habis
          </div>

          <div className="laporan-summary-value">
            {stokMenipis + stokHabis}
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="laporan-filter-card laporan-screen-only">
        <div className="laporan-filter-grid">
          <div className="laporan-field laporan-filter-full">
            <label htmlFor="search-stok">
              Cari Obat
            </label>

            <div className="laporan-search-wrapper">
              <Search size={16} />

              <input
                id="search-stok"
                type="text"
                className="laporan-input laporan-search-input"
                placeholder="Cari nama obat atau kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="laporan-field laporan-status-filter-field">
  <label>Status Stok</label>

  <div className="laporan-status-filter">
    <button
      type="button"
      className={`laporan-status-filter-button ${
        statusFilter === 'Semua' ? 'active semua' : ''
      }`}
      onClick={() => setStatusFilter('Semua')}
    >
      <span className="laporan-status-filter-dot semua" />
      <span>Semua</span>
    </button>

    <button
      type="button"
      className={`laporan-status-filter-button ${
        statusFilter === 'Aman' ? 'active aman' : ''
      }`}
      onClick={() => setStatusFilter('Aman')}
    >
      <span className="laporan-status-filter-dot aman" />
      <span>Aman</span>
    </button>

    <button
      type="button"
      className={`laporan-status-filter-button ${
        statusFilter === 'Menipis' ? 'active menipis' : ''
      }`}
      onClick={() => setStatusFilter('Menipis')}
    >
      <span className="laporan-status-filter-dot menipis" />
      <span>Menipis</span>
    </button>

    <button
      type="button"
      className={`laporan-status-filter-button ${
        statusFilter === 'Habis' ? 'active habis' : ''
      }`}
      onClick={() => setStatusFilter('Habis')}
    >
      <span className="laporan-status-filter-dot habis" />
      <span>Habis</span>
    </button>
  </div>
</div>
        </div>
      </div>

      {/* TABLE SCREEN */}
      <div className="laporan-table-card laporan-screen-only">
        <div className="laporan-table-header">
          <div>
            <h2>Data Kondisi Stok</h2>
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
              Tidak ada data stok yang sesuai dengan
              pencarian atau filter.
            </p>
          </div>
        ) : (
          <div className="laporan-table-wrapper">
            <table className="laporan-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Obat</th>
                  <th>Kategori</th>
                  <th>Total Masuk</th>
                  <th>Total Keluar</th>
                  <th>Stok Saat Ini</th>
                  <th>Stok Minimum</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {item.nama_obat}
                      </strong>
                    </td>

                    <td>
                      {item.kategori?.nama_kategori || '-'}
                    </td>

                    <td>{item.totalMasuk}</td>

                    <td>{item.totalKeluar}</td>

                    <td>
                      <strong>{item.stok}</strong>
                    </td>

                    <td>{item.stokMinimum}</td>

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
              <th>Kategori</th>
              <th>Total Masuk</th>
              <th>Total Keluar</th>
              <th>Stok Saat Ini</th>
              <th>Stok Minimum</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.nama_obat}</td>
                <td>
                  {item.kategori?.nama_kategori || '-'}
                </td>
                <td>{item.totalMasuk}</td>
                <td>{item.totalKeluar}</td>
                <td>{item.stok}</td>
                <td>{item.stokMinimum}</td>
                <td>{item.status}</td>
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
              <h3>Detail Kondisi Stok</h3>

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
                    {selectedData.nama_obat}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Kategori
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.kategori?.nama_kategori ||
                      '-'}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Total Obat Masuk
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.totalMasuk}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Total Obat Keluar
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.totalKeluar}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Stok Saat Ini
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.stok}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Stok Minimum
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.stokMinimum}
                  </span>
                </div>

                <div className="laporan-detail-item">
                  <span className="laporan-detail-label">
                    Status
                  </span>

                  <span className="laporan-detail-value">
                    {selectedData.status}
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