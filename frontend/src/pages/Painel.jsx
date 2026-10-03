import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function Painel() {
  const [data, setData] = useState({ current: null, history: [] })
  const [error, setError] = useState('')

  async function load() {
    try {
      setData(await api.queue())
      setError('')
    } catch (error) {
      setError('Painel indisponível. Verifique a conexão com o servidor.')
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="container page panel-page">
      <div className="section-head">
        <div>
          <span className="eyebrow">PAINEL DE CHAMADAS</span>
          <h1>Acompanhe sua senha</h1>
        </div>

        <span className="live">
          <i /> Atualização automática
        </span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <section className="display-card">
        <span>Última chamada</span>
        <strong>{data.current?.number || '—'}</strong>
        <p>{data.current ? `Dirija-se ao guichê ${data.current.counter}` : 'Aguardando próxima chamada'}</p>
      </section>

      <div className="panel-list">
        <h2>Últimas 5 chamadas</h2>

        {data.history?.length ? (
          data.history.map(ticket => (
            <div className="history-row" key={ticket.id}>
              <strong>{ticket.number}</strong>
              <span>Guichê {ticket.counter}</span>
              <time>
                {new Date(ticket.called_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          ))
        ) : (
          <p className="muted">Nenhuma senha chamada ainda.</p>
        )}
      </div>
    </div>
  )
}
