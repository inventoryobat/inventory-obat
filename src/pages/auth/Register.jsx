import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function Register() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama,
        },
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        'Registrasi berhasil. Silakan cek email jika konfirmasi email diaktifkan.'
      )

      setNama('')
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  const isSuccess =
    message.toLowerCase().includes('berhasil')

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
            <h1>Buat Akun Admin</h1>

            <p>
              Daftarkan akun untuk mengakses sistem
              manajemen inventory obat
            </p>
          </div>

          {/* Form */}
          <form
            className="auth-form"
            onSubmit={handleRegister}
          >

            {/* Nama */}
            <div className="auth-form-group">
              <label htmlFor="nama">
                Nama
              </label>

              <div className="auth-input-wrapper">
                <UserRound size={18} />

                <input
                  id="nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama"
                  required
                  autoComplete="name"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-form-group">
              <label htmlFor="register-email">
                Email
              </label>

              <div className="auth-input-wrapper">
                <Mail size={18} />

                <input
                  id="register-email"
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
              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input-wrapper auth-password-wrapper">
                <Lock size={18} />

                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  minLength={6}
                  autoComplete="new-password"
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

              <span className="auth-password-hint">
                Password minimal 6 karakter.
              </span>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`auth-message ${
                  isSuccess ? 'success' : 'error'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}

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
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Buat Akun
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="auth-switch">
            Sudah memiliki akun?

            <Link to="/login">
              Masuk sekarang
            </Link>
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