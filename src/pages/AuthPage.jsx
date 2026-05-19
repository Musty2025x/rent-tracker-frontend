import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../utils/api'

export default function AuthPage() {
  const [mode, setMode]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name: '', email: '', password: '', phone: '' })
  const { login }  = useAuth()
  const toast      = useToast()
  const navigate   = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload  = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone }
      const res = await api.post(endpoint, payload)
      login(res.data.token, res.data.user)
      toast(`Welcome${mode === 'register' ? ', ' + res.data.user.name : ' back'}!`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#185FA5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <i className="ti ti-building" style={{ fontSize: 30, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>Rent Tracker</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.75rem 1.5rem',
        }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {mode === 'register' && (
              <div className="field">
                <label>Full name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ajibola Sodiq" required autoComplete="name" />
              </div>
            )}

            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@email.com" required autoComplete="email"
                inputMode="email" />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>

            {mode === 'register' && (
              <div className="field">
                <label>Phone number</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+234 801 234 5678" inputMode="tel" />
              </div>
            )}

            {error && (
              <div style={{
                fontSize: 13, color: 'var(--red)', padding: '8px 12px',
                background: 'var(--red-bg)', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 46, fontSize: 15, marginTop: 4 }}
              disabled={loading}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }} /> Please wait…</>
                : mode === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-2)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
