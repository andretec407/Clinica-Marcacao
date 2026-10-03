import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export function CadastroPaciente() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', cpf: '', birthDate: '', email: '', phone: '', password: '', paymentType: 'PARTICULAR' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (field, value) => setForm(previous => ({ ...previous, [field]: value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const data = await api.registerPatient(form)
      localStorage.setItem('nassau_token', data.token)
      localStorage.setItem('nassau_user', JSON.stringify(data.user))
      navigate('/paciente')
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <span className="eyebrow">CADASTRO</span>
          <h1>Cadastro do paciente</h1>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="panel form" onSubmit={submit}>
        <label>Nome completo<input value={form.fullName} onChange={e => change('fullName', e.target.value)} required /></label>
        <label>CPF<input value={form.cpf} onChange={e => change('cpf', e.target.value)} required /></label>
        <label>Data de nascimento<input type="date" value={form.birthDate} onChange={e => change('birthDate', e.target.value)} required /></label>
        <label>E-mail<input type="email" value={form.email} onChange={e => change('email', e.target.value)} required /></label>
        <label>Telefone<input value={form.phone} onChange={e => change('phone', e.target.value)} required /></label>
        <label>Senha<input type="password" value={form.password} onChange={e => change('password', e.target.value)} required minLength={8} /></label>
        <label>Tipo de pagamento
          <select value={form.paymentType} onChange={e => change('paymentType', e.target.value)}>
            <option value="PARTICULAR">Particular</option>
            <option value="CONVENIO">Convênio</option>
          </select>
        </label>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Cadastrando…' : 'Cadastrar'}</button>
      </form>
    </div>
  )
}
