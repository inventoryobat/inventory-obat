import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-logo">
            <img
              src="/logo-inventory-obat.png"
              alt="Logo Inventory Obat"
            />
          </div>

          {/* Header */}
          <div className="auth-header">
            <h1>Selamat Datang</h1>

            <p>
              Masuk untuk mengakses sistem
              manajemen inventory obat
            </p>
          </div>

          {/* Form */}
          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            {/* Email */}
            <div className="auth-form-group">
              <label htmlFor="login-email">
                Email
              </label>

              <div className="auth-input-wrapper">
                <Mail size={18} />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="auth-input-wrapper auth-password-wrapper">
                <Lock size={18} />

                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  className="auth-input"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {message && (
              <div className="auth-message error">
                <AlertCircle size={17} />
                <span>{message}</span>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-button-loading" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Masuk ke Sistem
                </>
              )}
            </button>
          </form>

          {/* Register */}
          <div className="auth-switch">
            Belum memiliki akun?

            <button
              type="button"
              onClick={() => navigate('/register')}
            >
              Daftar sekarang
            </button>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <strong>Inventory Obat</strong>
            {' '}• Sistem Manajemen Persediaan Obat
          </div>

        </div>
      </div>
    </div>
  )
}