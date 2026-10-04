import { useNavigate } from 'react-router-dom'

import {
  Package,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
} from 'lucide-react'

const monitoringMenus = [
  {
    title: 'Monitoring Stok',
    description:
      'Melihat jumlah stok setiap obat masuk & keluar dan stok berdasarkan batch.',
    path: '/monitoring/stok',
    icon: Package,
    className: 'stok',
  },
  {
    title: 'Monitoring Stok Minimum',
    description:
      'Memantau obat yang aman, menipis, atau sudah habis berdasarkan stok minimum.',
    path: '/monitoring/stok-minimum',
    icon: AlertTriangle,
    className: 'stok-minimum',
  },
  {
    title: 'Monitoring Expired',
    description:
      'Memantau obat yang aman, segera expired, dan sudah expired berdasarkan batch.',
    path: '/monitoring/expired',
    icon: CalendarClock,
    className: 'expired',
  },
]

export default function Monitoring() {
  const navigate = useNavigate()

  return (
    <div className="monitoring-page">
      <div className="page-header">
        <div>
          <h2>Monitoring Inventory</h2>
          <p>
            Pantau kondisi stok dan masa berlaku
            obat dalam sistem inventory.
          </p>
        </div>
      </div>

      <div className="monitoring-menu-grid">
        {monitoringMenus.map((menu) => {
          const Icon = menu.icon

          return (
            <button
              key={menu.path}
              type="button"
              className={`monitoring-menu-card monitoring-${menu.className}`}
              onClick={() => navigate(menu.path)}
            >
              <div className="monitoring-menu-icon">
                <Icon
                  size={26}
                  strokeWidth={2}
                />
              </div>

              <div className="monitoring-menu-content">
                <h3>{menu.title}</h3>
                <p>{menu.description}</p>
              </div>

              <ChevronRight
                size={20}
                className="monitoring-menu-arrow"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}