import React, { useState } from 'react'
import LoginForm from './components/LoginForm.jsx'
import Filters from './components/Filters.jsx'
import DataTable from './components/DataTable.jsx'
import { getToken, getRole, getEmail, setAuth, clearAuth } from './lib/auth.js'

export default function App() {
  const [auth, setAuthState] = useState({ token: getToken(), role: getRole(), email: getEmail() })
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isLogged = !!auth.token

  async function login(email, password) {
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha no login')
      setAuth(data.token, data.role, data.email)
      setAuthState({ token: data.token, role: data.role, email: data.email })
    } catch (e) {
      setError(e.message)
    }
  }

  function logout() {
    clearAuth()
    setAuthState({ token: null, role: null, email: null })
    setColumns([]); setRows([])
  }

  async function fetchMetrics(params) {
    setLoading(true); setError('')
    const usp = new URLSearchParams()
    if (params?.start) usp.append('start', params.start)
    if (params?.end) usp.append('end', params.end)
    if (params?.sort) usp.append('sort', params.sort)
    if (params?.order) usp.append('order', params.order)

    try {
      const res = await fetch('/api/metrics?' + usp.toString(), {
        headers: { 'Authorization': 'Bearer ' + auth.token }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || ('Erro ' + res.status))
      setColumns(data.columns); setRows(data.rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wrap">
      <header className="topbar">
        <h1>Marketing Performance</h1>
        {isLogged && (
          <div className="userbox">
            <span>{auth.email} <em>({auth.role})</em></span>
            <button className="btn ghost" onClick={logout}>Sair</button>
          </div>
        )}
      </header>

      <main>
        {!isLogged ? (
          <section className="card">
            <h2>Login</h2>
            <LoginForm onSubmit={login} error={error} />
          </section>
        ) : (
          <>
            <section className="card">
              <h2>Filtros</h2>
              <Filters columns={columns} onSubmit={fetchMetrics} loading={loading} />
            </section>

            <section className="card">
              <h2>Resultados</h2>
              {error && <div className="error">{error}</div>}
              <DataTable columns={columns} rows={rows} role={auth.role} loading={loading} />
            </section>
          </>
        )}
      </main>

      <footer className="footer">
      </footer>
    </div>
  )
}
