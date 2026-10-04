import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import BottomNavigation from './Bottomnavigation'

import { supabase } from '../../lib/supabase'

export default function Layout() {
  const navigate = useNavigate()

  const [namaAdmin, setNamaAdmin] = useState('Administrator')

  useEffect(() => {
    fetchAdminProfile()
  }, [])

  const fetchAdminProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nama')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Gagal mengambil profil admin:', error)
        return
      }

      const nama =
        profile?.nama ||
        user.user_metadata?.nama ||
        user.user_metadata?.name ||
        'Administrator'

      setNamaAdmin(nama)
    } catch (error) {
      console.error('Gagal mengambil profil admin:', error)
    }
  }

  const handleOpenPengaturan = () => {
    navigate('/pengaturan')
  }

  const hurufPertama =
    namaAdmin.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-brand">
          <img
            src="/logo-inventory-obat.png"
            alt="Logo Inventory Obat"
            className="app-brand-logo"
          />

          <div className="app-brand-text">
            <h1>Inventory Obat</h1>
            <p>Sistem Manajemen Persediaan Obat</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-avatar-button"
          onClick={handleOpenPengaturan}
          aria-label="Buka pengaturan akun"
          title="Pengaturan Akun"
        >
          <div className="admin-avatar">
            {hurufPertama}
          </div>
        </button>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  )
}