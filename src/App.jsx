import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout       from './components/Layout'
import AuthPage     from './pages/AuthPage'
import Dashboard    from './pages/Dashboard'
import PropertiesPage from './pages/PropertiesPage'
import PaymentsPage   from './pages/PaymentsPage'
import RemindersPage  from './pages/RemindersPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}>
      <i className="ti ti-loader-2" style={{ fontSize:32,color:'var(--navy)',animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index         element={<Dashboard />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="payments"   element={<PaymentsPage />} />
              <Route path="reminders"  element={<RemindersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
