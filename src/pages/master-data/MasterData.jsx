import { useNavigate } from 'react-router-dom'

import {
  Package,
  Tags,
  Truck,
  ChevronRight,
} from 'lucide-react'

const menus = [
  {
    title: 'Data Obat',
    description:
      'Kelola data master obat, kategori, satuan, harga beli, dan stok minimum.',
    path: '/master-data/obat',
    icon: Package,
  },
  {
    title: 'Kategori',
    description:
      'Kelola kategori obat yang digunakan dalam sistem inventory.',
    path: '/master-data/kategori',
    icon: Tags,
  },
  {
    title: 'Supplier',
    description:
      'Kelola data supplier atau pemasok obat.',
    path: '/master-data/supplier',
    icon: Truck,
  },
]

export default function MasterData() {
  const navigate = useNavigate()

  return (
    <div className="master-data-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Master Data</h2>
          <p>
            Kelola data dasar yang digunakan dalam sistem
            inventory obat.
          </p>
        </div>
      </div>

      {/* MENU MASTER DATA */}
      <div className="master-data-menu-grid">
        {menus.map((menu) => {
          const Icon = menu.icon

          return (
            <button
              key={menu.path}
              type="button"
              className="master-data-menu-card"
              onClick={() => navigate(menu.path)}
            >
              {/* ICON */}
              {/* ICON */}
<div
  className={`master-data-menu-icon ${
    menu.title === 'Data Obat'
      ? 'obat'
      : menu.title === 'Kategori'
        ? 'kategori'
        : 'supplier'
  }`}
>
  <Icon
    size={26}
    strokeWidth={2}
  />
</div>

              {/* TEXT */}
              <div className="master-data-menu-content">
                <h3>{menu.title}</h3>

                <p>{menu.description}</p>
              </div>

              {/* ARROW */}
              <ChevronRight
                size={20}
                className="master-data-menu-arrow"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}