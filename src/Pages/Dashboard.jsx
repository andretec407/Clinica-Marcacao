import { useState, useEffect } from 'react'
import { getStorageData, STORAGE_KEYS } from '../utils/storage'
import initialData from '../data/initialData.json'

export function Dashboard() {
  const [agendamentos, setAgendamentos] = useState([])

  useEffect(() => {
    setAgendamentos(getStorageData(STORAGE_KEYS.AGENDAMENTOS, initialData.agendamentos))
  }, [])

  const totalAgendados = agendamentos.length
  const emAndamento = agendamentos.filter((a) => a.status === 'Em Atendimento').length
  const concluidos = agendamentos.filter((a) => a.status === 'Concluído').length
  const pendentes = agendamentos.filter((a) => a.status === 'Agendado').length

  return (
    <div className="page container">
      <h2>📊 Painel de Indicadores (Dashboard)</h2>
      <p>Métricas operacionais de atendimento do laboratório.</p>

      <div className="stats-grid">
        <div className="stat-card orange">
          <h3>{totalAgendados}</h3>
          <p>Total de Exames</p>
        </div>
        <div className="stat-card cyan">
          <h3>{pendentes}</h3>
          <p>Aguardando Recepção</p>
        </div>
        <div className="stat-card violet">
          <h3>{emAndamento}</h3>
          <p>Em Atendimento</p>
        </div>
        <div className="stat-card green">
          <h3>{concluidos}</h3>
          <p>Atendimentos Concluídos</p>
        </div>
      </div>
    </div>
  )
}