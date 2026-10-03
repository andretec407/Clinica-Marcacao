import { useState } from 'react'
import { api } from '../services/api'

const typeLabel = {
  SP: 'Prioritária',
  SE: 'Retirada de Exames',
  SG: 'Geral',
}

export function Totem() {
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')

  async function emit(type) {
    setError('')

    try {
      const data = await api.emitTicket(type)
      setTicket(data.ticket)
    } catch (problem) {
      setError(problem.message)
    }
  }

  return (
    <div className="container page totem">
      <div className="section-head">
        <div>
          <span className="eyebrow">AUTOATENDIMENTO</span>
          <h1>Retire sua senha</h1>
          <p>Escolha o tipo de atendimento. Não é necessário informar seus dados.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {ticket ? (
        <div className="ticket">
          <span>Senha emitida</span>
          <strong>{ticket.number}</strong>
          <p>Tipo: {typeLabel[ticket.type] || ticket.type}</p>
          <small>Aguarde o painel. Guarde sua senha.</small>
          <button className="btn ghost" onClick={() => setTicket(null)}>
            Emitir outra
          </button>
        </div>
      ) : (
        <div className="ticket-options">
          <button onClick={() => emit('SP')}>
            <b>SP</b>
            <span>Senha Prioritária</span>
            <small>Atendimento prioritário</small>
          </button>

          <button onClick={() => emit('SE')}>
            <b>SE</b>
            <span>Retirada de Exames</span>
            <small>Atendimento operacional especial</small>
          </button>

          <button onClick={() => emit('SG')}>
            <b>SG</b>
            <span>Senha Geral</span>
            <small>Atendimento geral</small>
          </button>
        </div>
      )}
    </div>
  )
}
