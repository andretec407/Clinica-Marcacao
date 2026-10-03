import { useEffect, useState } from 'react'
import { api } from '../services/api'

const examOptions = ['Hemograma', 'Glicemia', 'TSH', 'Colesterol', 'Urina', 'PCR']

export function PortalPaciente() {
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedExams, setSelectedExams] = useState([])
  const [form, setForm] = useState({
    desiredDate: new Date().toISOString().slice(0, 10),
    desiredTime: '09:00',
    notes: ''
  })

  async function load() {
    try {
      const [appointmentData, notificationData] = await Promise.all([
        api.appointments(),
        api.notifications(),
      ])
      setAppointments(appointmentData.appointments || [])
      setNotifications(notificationData.notifications || [])
      setError('')
    } catch (problem) {
      setError(problem.message)
    }
  }

  useEffect(() => { load() }, [])

  function toggleExam(exam) {
    setSelectedExams(current =>
      current.includes(exam)
        ? current.filter(item => item !== exam)
        : [...current, exam]
    )
  }

  async function submitRequest(event) {
    event.preventDefault()
    if (!selectedExams.length) {
      setError('Selecione pelo menos um exame para solicitar.')
      return
    }

    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const user = JSON.parse(localStorage.getItem('nassau_user') || '{}')
      const values = {
        fullName: user.name || 'Paciente Demo',
        cpf: user.cpf || '12345678909',
        birthDate: user.birthDate || '1995-01-01',
        email: user.email || 'paciente@demo.local',
        phone: user.phone || '(11) 99999-0000',
        paymentType: user.paymentType || 'PARTICULAR',
        exams: selectedExams,
        desiredDate: form.desiredDate,
        desiredTime: form.desiredTime,
        notes: form.notes
      }

      const result = await api.createAppointment({ values })
      setSuccess(result.message || 'Solicitação criada com sucesso.')
      setSelectedExams([])
      setForm({ desiredDate: new Date().toISOString().slice(0, 10), desiredTime: '09:00', notes: '' })
      await load()
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
          <span className="eyebrow">ÁREA DO PACIENTE</span>
          <h1>Minha área</h1>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="panel" style={{ marginBottom: '18px' }}>
        <h2>Solicitar exames</h2>
        <form className="form" onSubmit={submitRequest}>
          <div>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Exames</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {examOptions.map(exam => (
                <label key={exam} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                  <input
                    type="checkbox"
                    checked={selectedExams.includes(exam)}
                    onChange={() => toggleExam(exam)}
                  />
                  {exam}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Data desejada
              <input type="date" value={form.desiredDate} onChange={event => setForm(current => ({ ...current, desiredDate: event.target.value }))} required />
            </label>
            <label>
              Hora desejada
              <input type="time" value={form.desiredTime} onChange={event => setForm(current => ({ ...current, desiredTime: event.target.value }))} required />
            </label>
          </div>

          <label>
            Observações
            <textarea
              rows={4}
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
              placeholder="Se necessário, descreva alguma observação"
            />
          </label>

          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Solicitar exames'}
          </button>
        </form>
      </div>

      <div className="panel" style={{ marginBottom: '18px' }}>
        <h2>Notificações</h2>
        {notifications.length ? notifications.map(item => (
          <div key={item.id} className="notification-item" style={{ padding: '10px 0', borderBottom: '1px solid #dce8e5' }}>
            <strong>{item.title}</strong>
            <p>{item.message}</p>
          </div>
        )) : <p>Nenhuma notificação.</p>}
      </div>

      <div className="panel">
        <h2>Meus exames e solicitações</h2>
        {appointments.length ? appointments.map(item => (
          <div key={item.id} className="appointment-row" style={{ padding: '14px 0', borderBottom: '1px solid #dce8e5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{item.ticket_number || 'Solicitação sem código'}</strong>
              <span className={`status ${String(item.status || '').toLowerCase()}`}>{item.status || 'PENDENTE'}</span>
            </div>
            <div style={{ marginTop: '8px', color: '#476660', lineHeight: 1.7 }}>
              <div><strong>Exames:</strong> {(item.exams || []).join(', ') || '—'}</div>
              <div><strong>Data desejada:</strong> {item.desired_date ? new Date(`${item.desired_date}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</div>
              <div><strong>Horário:</strong> {item.desired_time || '—'}</div>
              <div><strong>Observações:</strong> {item.notes || 'Sem observações.'}</div>
            </div>
          </div>
        )) : <p>Nenhum exame cadastrado.</p>}
      </div>
    </div>
  )
}
