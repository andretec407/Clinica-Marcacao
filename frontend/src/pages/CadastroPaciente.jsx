import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Clinic.css'

const initial = {
  fullName: '',
  cpf: '',
  birthDate: '',
  email: '',
  phone: '',
  paymentType: 'PARTICULAR',
  password: '',
}

export function CadastroPaciente() {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { registerPatient } = useAuth()
  const navigate = useNavigate()

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await registerPatient({ ...form, cpf: form.cpf.replace(/\D/g, '') })
      navigate('/paciente')
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page clinic-page">
      <form className="clinic-form clinic-form-narrow" onSubmit={submit}>
        <span className="eyebrow">ÁREA DO PACIENTE</span>
        <h1>Criar cadastro</h1>
        <p>Use seus dados para acompanhar solicitações e atualizações do laboratório.</p>

        {error && <div className="alert error">{error}</div>}

        <label>
          Nome completo
          <input name="fullName" value={form.fullName} onChange={change} autoComplete="name" required maxLength="160" />
        </label>

        <div className="clinic-form-row">
          <label>
            CPF
            <input name="cpf" value={form.cpf} onChange={change} inputMode="numeric" minLength="11" maxLength="14" required />
          </label>

          <label>
            Data de nascimento
            <input name="birthDate" type="date" value={form.birthDate} onChange={change} required />
          </label>
        </div>

        <label>
          E-mail
          <input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required />
        </label>

        <div className="clinic-form-row">
          <label>
            Telefone
            <input name="phone" type="tel" value={form.phone} onChange={change} autoComplete="tel" required />
          </label>

          <label>
            Pagamento
            <select name="paymentType" value={form.paymentType} onChange={change}>
              <option value="PARTICULAR">Particular</option>
              <option value="CONVENIO">Convênio</option>
            </select>
          </label>
        </div>

        <label>
          Senha
          <input name="password" type="password" value={form.password} onChange={change} minLength="8" autoComplete="new-password" required />
          <small>Use ao menos 8 caracteres.</small>
        </label>

        <button className="btn primary" disabled={busy}>
          {busy ? 'Criando cadastro…' : 'Criar cadastro'}
        </button>

        <Link to="/login">Já tenho uma conta</Link>
      </form>
    </div>
  )
}
