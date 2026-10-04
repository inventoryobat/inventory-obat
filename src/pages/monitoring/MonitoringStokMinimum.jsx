import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  PackageCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function MonitoringStokMinimum() {
  const navigate = useNavigate()

  const [obat, setObat] = useState([])
  const [obatMasuk, setObatMasuk] = useState([])
  const [obatKeluar, setObatKeluar] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [obatResult, masukResult, keluarResult] =
        await Promise.all([
          supabase
            .from('obat')
            .select(`
              id,
              kode_obat,
              nama_obat,
              satuan,
              stok_minimum,
              kategori (
                nama_kategori
              )
            `)
            .order('nama_obat', { ascending: true }),

          supabase
            .from('obat_masuk')
            .select('obat_id, jumlah'),

          supabase
            .from('obat_keluar')
            .select('obat_id, jumlah'),
        ])

      if (obatResult.error) throw obatResult.error
      if (masukResult.error) throw masukResult.error
      if (keluarResult.error) throw keluarResult.error

      setObat(obatResult.data || [])
      setObatMasuk(masukResult.data || [])
      setObatKeluar(keluarResult.data || [])
    } catch (err) {
      console.error(err)
      setError('Gagal memuat data monitoring stok minimum.')
    } finally {
      setLoading(false)
    }
  }

  const monitoringData = useMemo(() => {
    return obat.map((item) => {
      const totalMasuk = obatMasuk
        .filter((transaksi) => transaksi.obat_id === item.id)
        .reduce((total, transaksi) => {
          return total + Number(transaksi.jumlah || 0)
        }, 0)

      const totalKeluar = obatKeluar
        .filter((transaksi) => transaksi.obat_id === item.id)
        .reduce((total, transaksi) => {
          return total + Number(transaksi.jumlah || 0)
        }, 0)

      const totalStok = totalMasuk - totalKeluar
      const stokMinimum = Number(item.stok_minimum || 0)

      let status = 'Aman'

      if (totalStok <= 0) {
        status = 'Habis'
      } else if (totalStok <= stokMinimum) {
        status = 'Menipis'
      }

      return {
        ...item,
        totalMasuk,
        totalKeluar,
        totalStok,
        stokMinimum,
        status,
      }
    })
  }, [obat, obatMasuk, obatKeluar])

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) {
      return monitoringData
    }

    return monitoringData.filter((item) => {
      return (
        item.kode_obat?.toLowerCase().includes(keyword) ||
        item.nama_obat?.toLowerCase().includes(keyword) ||
        item.kategori?.nama_kategori
          ?.toLowerCase()
          .includes(keyword)
      )
    })
  }, [monitoringData, search])

  const totalAman = monitoringData.filter(
    (item) => item.status === 'Aman'
  ).length

  const totalMenipis = monitoringData.filter(
    (item) => item.status === 'Menipis'
  ).length

  const totalHabis = monitoringData.filter(
    (item) => item.status === 'Habis'
  ).length

  return (
    <div className="monitoring-minimum-page">
      {/* HEADER */}
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
      <h2>Monitoring Stok Minimum</h2>
      <p>
        Memantau kondisi stok obat berdasarkan batas stok minimum.
      </p>
    </div>
  </div>
</div>

      {/* SUMMARY */}
      <div className="monitoring-minimum-summary">
        {/* AMAN */}
        <div className="minimum-summary-card safe">
          <div className="minimum-summary-icon">
            <PackageCheck size={22} />
          </div>

          <div>
            <span>Aman</span>
            <strong>{totalAman}</strong>
          </div>
        </div>

        {/* MENIPIS */}
        <div className="minimum-summary-card warning">
          <div className="minimum-summary-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>Menipis</span>
            <strong>{totalMenipis}</strong>
          </div>
        </div>

        {/* HABIS */}
        <div className="minimum-summary-card danger">
          <div className="minimum-summary-icon">
            <XCircle size={22} />
          </div>

          <div>
            <span>Habis</span>
            <strong>{totalHabis}</strong>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="monitoring-minimum-table-card">
        <div className="card-heading">
          <div>
            <h3>Daftar Kondisi Stok</h3>

            <p>
              Status stok dihitung berdasarkan stok aktual
              dan stok minimum.
            </p>
          </div>

          {/* SEARCH */}
          <div className="monitoring-minimum-search">
            <div className="monitoring-minimum-search-icon">
              <Search size={18} strokeWidth={2} />
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari obat..."
              aria-label="Cari obat"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="empty-state">
            Memuat data monitoring...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            Tidak ada data obat yang ditemukan.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="monitoring-minimum-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Obat</th>
                  <th>Nama Obat</th>
                  <th>Kategori</th>
                  <th>Satuan</th>
                  <th>Stok</th>
                  <th>Stok Minimum</th>
                  <th>Selisih</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => {
                  const selisih =
                    item.totalStok - item.stokMinimum

                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <strong>{item.kode_obat}</strong>
                      </td>

                      <td>{item.nama_obat}</td>

                      <td>
                        {item.kategori?.nama_kategori || '-'}
                      </td>

                      <td>{item.satuan}</td>

                      <td>
                        <strong>{item.totalStok}</strong>
                      </td>

                      <td>{item.stokMinimum}</td>

                      <td>
                        {selisih > 0
                          ? `+${selisih}`
                          : selisih}
                      </td>

                      <td>
                        <span
                          className={`minimum-status-badge ${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}