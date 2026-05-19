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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: '#185FA5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px'
          }}>
            <i className="ti ti-building" style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Rent Tracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {mode === 'register' && (
              <div className="field">
                <label>Full name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ajibola Sodiq" required />
              </div>
            )}

            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@email.com" required />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'} required />
            </div>

            {mode === 'register' && (
              <div className="field">
                <label>Phone number</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+2348012345678" />
              </div>
            )}

            {error && <p className="error-msg"><i className="ti ti-alert-circle" style={{ fontSize: 13, marginRight: 4 }} />{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4, height: 40 }} disabled={loading}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ fontSize: 15, animation: 'spin 1s linear infinite' }} /> Please wait…</>
                : mode === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>

          <hr className="divider" style={{ margin: '1.25rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
