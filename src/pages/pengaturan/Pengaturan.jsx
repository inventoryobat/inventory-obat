import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function Pengaturan() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [user, setUser] = useState(null)

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    fetchProfile()
  }, [])

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)

    setTimeout(() => {
      setMessage('')
    }, 3500)
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!currentUser) {
        navigate('/login', { replace: true })
        return
      }

      setUser(currentUser)
      setEmail(currentUser.email || '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nama, email, role')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      setNama(
        profile?.nama ||
        currentUser.user_metadata?.nama ||
        currentUser.user_metadata?.name ||
        ''
      )
    } catch (error) {
      console.error('Gagal mengambil data profil:', error)

      showMessage(
        'Gagal mengambil data akun. Silakan coba lagi.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!nama.trim()) {
      showMessage('Nama admin tidak boleh kosong.', 'error')
      return
    }

    if (!user) return

    try {
      setSavingProfile(true)

      const namaBaru = nama.trim()

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nama: namaBaru,
        })
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nama: namaBaru,
        },
      })

      if (authError) {
        console.warn(
          'Metadata Auth tidak berhasil diperbarui:',
          authError
        )
      }

      setNama(namaBaru)
      setIsEditingProfile(false)

      showMessage('Nama admin berhasil diperbarui.')
    } catch (error) {
      console.error('Gagal memperbarui profil:', error)

      showMessage(
        'Gagal memperbarui profil. Silakan coba lagi.',
        'error'
      )
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    if (user) {
      setNama(
        user.user_metadata?.nama ||
        user.user_metadata?.name ||
        nama
      )
    }

    fetchProfile()
    setIsEditingProfile(false)
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    if (!password) {
      showMessage('Password baru wajib diisi.', 'error')
      return
    }

    if (password.length < 6) {
      showMessage(
        'Password baru minimal 6 karakter.',
        'error'
      )
      return
    }

    if (!confirmPassword) {
      showMessage(
        'Konfirmasi password wajib diisi.',
        'error'
      )
      return
    }

    if (password !== confirmPassword) {
      showMessage(
        'Konfirmasi password tidak cocok.',
        'error'
      )
      return
    }

    try {
      setSavingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setPassword('')
      setConfirmPassword('')

      showMessage('Password berhasil diperbarui.')
    } catch (error) {
      console.error('Gagal mengubah password:', error)

      showMessage(
        error.message || 'Gagal mengubah password.',
        'error'
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Gagal logout:', error)

      showMessage(
        'Gagal keluar dari sistem. Silakan coba lagi.',
        'error'
      )

      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="pengaturan-page">
        <div className="pengaturan-loading">
          <div className="pengaturan-loading-spinner" />
          <p>Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pengaturan-page">

      {/* HEADER */}
      <div className="pengaturan-header">

        <div className="pengaturan-header-left">

          

          <div>
            <h1>Pengaturan</h1>
            <p>
              Kelola informasi akun dan keamanan sistem
            </p>
          </div>

        </div>

      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`pengaturan-message ${
            messageType === 'error'
              ? 'pengaturan-message-error'
              : 'pengaturan-message-success'
          }`}
        >
          <div className="pengaturan-message-icon">
            {messageType === 'error' ? (
              <X size={18} />
            ) : (
              <Check size={18} />
            )}
          </div>

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Tutup pesan"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="pengaturan-content">

        {/* PROFIL */}
        <section className="pengaturan-card">

          <div className="pengaturan-card-header">

            <div className="pengaturan-card-icon blue">
              <User size={20} />
            </div>

            <div>
              <h2>Profil Akun</h2>
              <p>
                Informasi akun administrator sistem
              </p>
            </div>

          </div>

          <div className="pengaturan-card-body">

            <div className="pengaturan-profile">

              <div className="pengaturan-avatar">
                {nama
                  ? nama.charAt(0).toUpperCase()
                  : 'A'}
              </div>

              <div className="pengaturan-profile-info">
                <strong>
                  {nama || 'Administrator'}
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

            <div className="pengaturan-form-grid">

              <div className="pengaturan-field">

                <label htmlFor="nama">
                  Nama Admin
                </label>

                <div className="pengaturan-input-wrapper">

                  <User size={17} />

                  <input
                    id="nama"
                    type="text"
                    value={nama}
                    onChange={(e) =>
                      setNama(e.target.value)
                    }
                    disabled={!isEditingProfile}
                    placeholder="Masukkan nama admin"
                  />

                </div>

              </div>

              <div className="pengaturan-field">

                <label htmlFor="email">
                  Email
                </label>

                <div className="pengaturan-input-wrapper">

                  <Mail size={17} />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                  />

                </div>

                <small>
                  Email digunakan untuk login ke sistem.
                </small>

              </div>

            </div>

            <div className="pengaturan-card-actions">

              {!isEditingProfile ? (
                <button
                  type="button"
                  className="pengaturan-button pengaturan-button-primary"
                  onClick={() =>
                    setIsEditingProfile(true)
                  }
                >
                  <Pencil size={16} />
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="pengaturan-button pengaturan-button-secondary"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    <X size={16} />
                    Batal
                  </button>

                  <button
                    type="button"
                    className="pengaturan-button pengaturan-button-primary"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    <Save size={16} />

                    {savingProfile
                      ? 'Menyimpan...'
                      : 'Simpan Perubahan'}
                  </button>
                </>
              )}

            </div>

          </div>

        </section>

        {/* KEAMANAN */}
        <section className="pengaturan-card">

          <div className="pengaturan-card-header">

            <div className="pengaturan-card-icon purple">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Keamanan Akun</h2>
              <p>
                Perbarui password untuk menjaga keamanan akun
              </p>
            </div>

          </div>

          <div className="pengaturan-card-body">

            <form
              className="pengaturan-password-form"
              onSubmit={handleChangePassword}
            >

              <div className="pengaturan-form-grid">

                <div className="pengaturan-field">

                  <label htmlFor="password">
                    Password Baru
                  </label>

                  <div className="pengaturan-input-wrapper">

                    <KeyRound size={17} />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Masukkan password baru"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="pengaturan-password-toggle"
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

                  <small>
                    Gunakan minimal 6 karakter.
                  </small>

                </div>

                <div className="pengaturan-field">

                  <label htmlFor="confirmPassword">
                    Konfirmasi Password
                  </label>

                  <div className="pengaturan-input-wrapper">

                    <KeyRound size={17} />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Ulangi password baru"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="pengaturan-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

              </div>

              <div className="pengaturan-card-actions">

                <button
                  type="submit"
                  className="pengaturan-button pengaturan-button-primary"
                  disabled={savingPassword}
                >
                  <KeyRound size={16} />

                  {savingPassword
                    ? 'Memperbarui...'
                    : 'Ubah Password'}
                </button>

              </div>

            </form>

          </div>

        </section>

        {/* INFORMASI SISTEM */}
        <section className="pengaturan-card">

          <div className="pengaturan-card-header">

            <div className="pengaturan-card-icon green">
              <Info size={20} />
            </div>

            <div>
              <h2>Informasi Sistem</h2>
              <p>
                Informasi mengenai aplikasi inventory
              </p>
            </div>

          </div>

          <div className="pengaturan-card-body">

            <div className="pengaturan-system-grid">

              <div className="pengaturan-system-item">

                <span className="pengaturan-system-label">
                  Nama Aplikasi
                </span>

                <strong>
                  Inventory Obat
                </strong>

              </div>

              <div className="pengaturan-system-item">

                <span className="pengaturan-system-label">
                  Versi
                </span>

                <strong>
                  1.0.0
                </strong>

              </div>

              <div className="pengaturan-system-item">

                <span className="pengaturan-system-label">
                  Hak Akses
                </span>

                <strong>
                  Administrator
                </strong>

              </div>

              <div className="pengaturan-system-item">

                <span className="pengaturan-system-label">
                  Sistem
                </span>

                <strong>
                  Web Based
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* LOGOUT */}
        <section className="pengaturan-logout-card">

          <div className="pengaturan-logout-content">

            <div className="pengaturan-logout-icon">
              <LogOut size={20} />
            </div>

            <div>
              <h2>Keluar dari Sistem</h2>
              <p>
                Akhiri sesi administrator pada perangkat ini.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="pengaturan-button pengaturan-button-danger"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={16} />

            {loggingOut
              ? 'Keluar...'
              : 'Logout'}
          </button>

        </section>

      </div>
    </div>
  )
}