import { useNavigate } from 'react-router-dom'

import {
  PackageCheck,
  PackageOpen,
  ClipboardList,
  ChevronRight,
} from 'lucide-react'

const laporanMenus = [
  {
    title: 'Laporan Obat Masuk',
    description:
      'Menampilkan riwayat obat yang masuk ke dalam inventory berdasarkan tanggal transaksi.',
    path: '/laporan/obat-masuk',
    icon: PackageCheck,
    className: 'obat-masuk',
  },
  {
    title: 'Laporan Obat Keluar',
    description:
      'Menampilkan riwayat obat yang keluar dari inventory berdasarkan tanggal transaksi.',
    path: '/laporan/obat-keluar',
    icon: PackageOpen,
    className: 'obat-keluar',
  },
  {
    title: 'Laporan Kondisi Stok',
    description:
      'Menampilkan kondisi stok obat saat ini, stok minimum, serta status ketersediaan.',
    path: '/laporan/stok',
    icon: ClipboardList,
    className: 'stok',
  },
]

export default function Laporan() {
  const navigate = useNavigate()

  return (
    <div className="laporan-page">
      <div className="page-header">
        <div>
          <h2>Laporan</h2>
          <p>
            Kelola dan lihat laporan inventory obat.
          </p>
        </div>
      </div>

      <div className="laporan-menu-grid">
        {laporanMenus.map((menu) => {
          const Icon = menu.icon

          return (
            <button
              key={menu.path}
              type="button"
              className={`laporan-menu-card laporan-${menu.className}`}
              onClick={() => navigate(menu.path)}
            >
              <div className="laporan-menu-icon">
                <Icon
                  size={26}
                  strokeWidth={2}
                />
              </div>

              <div className="laporan-menu-content">
                <h3>{menu.title}</h3>
                <p>{menu.description}</p>
              </div>

              <ChevronRight
                size={20}
                className="laporan-menu-arrow"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}