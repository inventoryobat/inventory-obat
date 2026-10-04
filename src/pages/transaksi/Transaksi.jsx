import { useNavigate } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
} from 'lucide-react'

const menus = [
  {
    title: 'Obat Masuk',
    description:
      'Catat obat yang masuk ke inventory beserta supplier, batch, tanggal expired, dan jumlah.',
    path: '/transaksi/obat-masuk',
    icon: ArrowDownToLine,
  },
  {
    title: 'Obat Keluar',
    description:
      'Catat obat yang keluar dari inventory berdasarkan batch, jumlah, alasan, dan keterangan.',
    path: '/transaksi/obat-keluar',
    icon: ArrowUpFromLine,
  },
]

export default function Transaksi() {
  const navigate = useNavigate()

  return (
    <div className="transaksi-page">
      <div className="page-header">
        <div>
          <h2>Transaksi</h2>
          <p>
            Kelola transaksi obat masuk dan obat keluar
            dalam sistem inventory.
          </p>
        </div>
      </div>

      <div className="transaksi-menu-grid">
        {menus.map((menu) => {
          const Icon = menu.icon

          return (
            <button
              key={menu.path}
              type="button"
              className="transaksi-menu-card"
              onClick={() => navigate(menu.path)}
            >
              <div
  className={`transaksi-menu-icon ${
    menu.title === 'Obat Masuk'
      ? 'obat-masuk'
      : 'obat-keluar'
  }`}
>
  <Icon
    size={26}
    strokeWidth={2}
  />
</div>

              <div className="transaksi-menu-content">
                <h3>{menu.title}</h3>

                <p>{menu.description}</p>
              </div>

              <ChevronRight
                size={20}
                className="transaksi-menu-arrow"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}