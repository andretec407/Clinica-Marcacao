import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { demoAccounts } from '../services/demoApi'
import './Login.css'

const roleLabels = {
  PACIENTE: 'Paciente',
  ATENDENTE: 'Atendente',
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function enter(userEmail, userPassword) {
    setError('')
    setBusy(true)

    try {
      await login(userEmail, userPassword)
      const role = JSON.parse(localStorage.getItem('nassau_user'))?.role
      navigate(role === 'PACIENTE' ? '/paciente' : '/fluxo')
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    await enter(email, password)
  }

  return (
    <div className="container narrow">
      <div className="login-layout">
        <form className="panel form" onSubmit={submit}>
          <span className="eyebrow">ACESSO AO LABORATÓRIO</span>
          <h1>Entrar na sua conta</h1>
          <p>Paciente ou atendente.</p>

          {error && <div className="alert error">{error}</div>}

          <label>
            E-mail
            <input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="username" required />
          </label>

          <label>
            Senha
            <input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>

          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="login-register">
            É paciente novo? <Link to="/cadastro-paciente">Criar cadastro</Link>
          </p>
        </form>

        <section className="demo-access" aria-labelledby="demo-access-title">
          <span className="eyebrow">SEM BANCO DE DADOS</span>
          <h2 id="demo-access-title">Acessos de demonstração</h2>
          <p>Essas contas usam dados locais de exemplo. As alterações ficam salvas neste navegador.</p>

          {demoAccounts.map(account => (
            <button
              key={account.user.role}
              className="demo-account"
              type="button"
              disabled={busy}
              onClick={() => enter(account.email, account.password)}
            >
              <span>
                <strong>Entrar como {roleLabels[account.user.role]}</strong>
                <small>{account.email}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}

          <details>
            <summary>Ver credenciais</summary>
            <ul>
              {demoAccounts.map(account => (
                <li key={account.email}>
                  <strong>{roleLabels[account.user.role]}:</strong> {account.email} / {account.password}
                </li>
              ))}
            </ul>
          </details>
        </section>
      </div>
    </div>
  )
}
