import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import Dashboard from './pages/dashboard/Dashboard'

import MasterData from './pages/master-data/MasterData'
import DataObat from './pages/master-data/DataObat'
import Kategori from './pages/master-data/Kategori'
import Supplier from './pages/master-data/Supplier'

import Transaksi from './pages/transaksi/Transaksi'
import ObatMasuk from './pages/transaksi/ObatMasuk'
import ObatKeluar from './pages/transaksi/ObatKeluar'

import Monitoring from './pages/monitoring/Monitoring'
import MonitoringStok from './pages/monitoring/MonitoringStok'
import MonitoringStokMinimum from './pages/monitoring/MonitoringStokMinimum'
import MonitoringExpired from './pages/monitoring/MonitoringExpired'

import Laporan from './pages/laporan/Laporan'
import LaporanObatMasuk from './pages/laporan/LaporanObatMasuk'
import LaporanObatKeluar from './pages/laporan/LaporanObatKeluar'
import LaporanStok from './pages/laporan/LaporanStok'

import Pengaturan from './pages/pengaturan/Pengaturan'

import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================================
            PUBLIC ROUTES
        ======================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ========================================
            PROTECTED ROUTES
        ======================================== */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          {/* ======================================
              DASHBOARD
          ====================================== */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* ======================================
              MASTER DATA
          ====================================== */}

          <Route
            path="/master-data"
            element={<MasterData />}
          />

          <Route
            path="/master-data/obat"
            element={<DataObat />}
          />

          <Route
            path="/master-data/kategori"
            element={<Kategori />}
          />

          <Route
            path="/master-data/supplier"
            element={<Supplier />}
          />

          {/* ======================================
              TRANSAKSI
          ====================================== */}

          <Route
          path="/transaksi"
          element={<Transaksi />}
          />

          <Route
            path="/transaksi/obat-masuk"
            element={<ObatMasuk />}
          />
          <Route
            path="/transaksi/obat-keluar"
            element={<ObatKeluar />}
          />



          {/* ======================================
              MONITORING
          ====================================== */}

          <Route
            path="/monitoring"
            element={<Monitoring />}
          />
          <Route
            path="/monitoring/stok"
            element={<MonitoringStok />}
          />
          <Route
            path="/monitoring/stok-minimum"
            element={<MonitoringStokMinimum />}
          />
          <Route
            path="/monitoring/expired"
            element={<MonitoringExpired />}
          />

          {/* ======================================
              LAPORAN
          ====================================== */}

          <Route path="/laporan" element={<Laporan />} />
          <Route path="/laporan/obat-masuk" element={<LaporanObatMasuk />} />
          <Route path="/laporan/obat-keluar" element={<LaporanObatKeluar />} />
          <Route path="/laporan/stok" element={<LaporanStok />} />

          {/* ======================================
              PENGATURAN
          ====================================== */}

          <Route
            path="/pengaturan"
            element={<Pengaturan />}
              
          />

        </Route>

        {/* ========================================
            UNKNOWN ROUTE
        ======================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App