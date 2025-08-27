import React, { useState } from 'react'

export default function LoginForm({ onSubmit, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handle(e) {
    e.preventDefault()
    onSubmit(email.trim(), password)
  }

  return (
    <form className="grid" onSubmit={handle}>
      <label>E-mail
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user1@example.com" required />
      </label>
      <label>Senha
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
      </label>
      <button className="btn" type="submit">Entrar</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
