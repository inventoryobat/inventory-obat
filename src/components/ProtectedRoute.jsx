import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (mounted) {
        setSession(session)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return

      // Session benar-benar berubah
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        setSession(newSession)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Masih memeriksa session
  if (session === undefined) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          color: '#374151',
        }}
      >
        Memeriksa sesi login...
      </div>
    )
  }

  // Tidak ada session
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Session tersedia
  return children
}