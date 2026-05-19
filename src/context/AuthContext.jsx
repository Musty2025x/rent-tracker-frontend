import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => JSON.parse(localStorage.getItem('rt_user') || 'null'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('rt_token')
    if (!token) { setLoading(false); return }
    api.get('/api/auth/me')
      .then(r => { setUser(r.data.user); localStorage.setItem('rt_user', JSON.stringify(r.data.user)) })
      .catch(() => { localStorage.removeItem('rt_token'); localStorage.removeItem('rt_user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  function login(token, userData) {
    localStorage.setItem('rt_token', token)
    localStorage.setItem('rt_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('rt_token')
    localStorage.removeItem('rt_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
