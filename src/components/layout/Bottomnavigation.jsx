import { NavLink } from 'react-router-dom'

import {
  LayoutDashboard,
  Database,
  ArrowLeftRight,
  Activity,
  FileText,
  Settings,
} from 'lucide-react'

const menus = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Master Data',
    path: '/master-data',
    icon: Database,
  },
  {
    label: 'Transaksi',
    path: '/transaksi',
    icon: ArrowLeftRight,
  },
  {
    label: 'Monitoring',
    path: '/monitoring',
    icon: Activity,
  },
  {
    label: 'Laporan',
    path: '/laporan',
    icon: FileText,
  },
  {
    label: 'Pengaturan',
    path: '/pengaturan',
    icon: Settings,
  },
]

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation">
      {menus.map((menu) => {
        const Icon = menu.icon

        return (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `nav-item ${
                isActive ? 'active' : ''
              }`
            }
          >
            <Icon
              size={20}
              strokeWidth={2}
            />

            <span>{menu.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}