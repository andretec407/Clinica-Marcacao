import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { StatusBadge } from '../components/StatusBadge'

export function Relatorios() {
  const [summary, setSummary] = useState(null)
  const [tickets, setTickets] = useState([])
  const [audit, setAudit] = useState([])
  const [tab, setTab] = useState('clinica')
  const [period, setPeriod] = useState('day')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [clinic, ticketRows, auditRows] = await Promise.all([
          api.clinicReport(period),
          api.tickets(''),
          api.audit(),
        ])

        setSummary(clinic)
        setTickets(ticketRows.tickets)
        setAudit(auditRows.audit)
        setError('')
      } catch (problem) {
        setError(problem.message)
      }
    }

    load()
  }, [period])

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <span className="eyebrow">ADMINISTRAÇÃO</span>
          <h1>Relatórios e auditoria</h1>
          <p>Indicadores do fluxo clínico e das senhas de atendimento.</p>
        </div>

        <label>
          Período
          <select value={period} onChange={event => setPeriod(event.target.value)}>
            <option value="day">Hoje</option>
            <option value="month">Este mês</option>
          </select>
        </label>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="tabs">
        <button className={tab === 'clinica' ? 'active' : ''} onClick={() => setTab('clinica')}>
          Fluxo clínico
        </button>
        <button className={tab === 'tickets' ? 'active' : ''} onClick={() => setTab('tickets')}>
          Senhas
        </button>
        <button className={tab === 'audit' ? 'active' : ''} onClick={() => setTab('audit')}>
          Auditoria
        </button>
      </div>

      {tab === 'clinica' && summary && (
        <>
          <div className="stats">
            <div><b>{summary.current_flow?.arrived || 0}</b><span>Chegadas</span></div>
            <div><b>{summary.current_flow?.waiting || 0}</b><span>Aguardando</span></div>
            <div><b>{summary.current_flow?.in_service || 0}</b><span>Em atendimento</span></div>
            <div><b>{summary.current_flow?.in_collection || 0}</b><span>Em coleta</span></div>
            <div><b>{summary.current_flow?.exited || 0}</b><span>Saídas</span></div>
          </div>

          <div className="stats">
            <div><b>{summary.completed || 0}</b><span>Concluídos no período</span></div>
            <div><b>{summary.exams_completed || 0}</b><span>Exames realizados</span></div>
            <div><b>{summary.no_show || 0}</b><span>Faltas</span></div>
            <div><b>{summary.cancelled || 0}</b><span>Cancelamentos</span></div>
          </div>

          <div className="stats">
            <div><b>{Number(summary.average_wait_minutes || 0).toFixed(1)} min</b><span>Espera média</span></div>
            <div><b>{Number(summary.average_service_minutes || 0).toFixed(1)} min</b><span>Atendimento médio</span></div>
            <div><b>{Number(summary.average_stay_minutes || 0).toFixed(1)} min</b><span>Permanência média</span></div>
          </div>

          <div className="panel">
            <h2>Atendimentos por funcionário</h2>
            {summary.by_attendant?.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Atendimentos concluídos</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_attendant.map(row => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nenhum atendimento concluído neste período.</p>
            )}
          </div>
        </>
      )}

      {tab === 'tickets' && (
        <div className="panel">
          <h2>Histórico de senhas</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Senha</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Emitida</th>
                  <th>Guichê</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>{ticket.number}</td>
                    <td>{ticket.type}</td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td>{new Date(ticket.issued_at).toLocaleString('pt-BR')}</td>
                    <td>{ticket.counter || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="panel">
          <h2>Eventos de atendimento</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Senha</th>
                  <th>Atendente</th>
                  <th>Guichê</th>
                  <th>Chamada</th>
                  <th>Início</th>
                  <th>Finalização</th>
                </tr>
              </thead>
              <tbody>
                {audit.map(item => (
                  <tr key={item.id}>
                    <td>{item.ticket_number}</td>
                    <td>{item.attendant_name || '—'}</td>
                    <td>{item.counter || '—'}</td>
                    <td>{item.first_call_at ? new Date(item.first_call_at).toLocaleString('pt-BR') : '—'}</td>
                    <td>{item.started_at ? new Date(item.started_at).toLocaleString('pt-BR') : '—'}</td>
                    <td>{item.finished_at ? new Date(item.finished_at).toLocaleString('pt-BR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
