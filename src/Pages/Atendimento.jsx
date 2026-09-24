import { useState, useEffect } from 'react'
import { getStorageData, setStorageData, STORAGE_KEYS } from '../utils/storage'
import initialData from '../data/initialData.json'

export function Atendimento() {
  const [agendamentos, setAgendamentos] = useState([])

  useEffect(() => {
    setAgendamentos(getStorageData(STORAGE_KEYS.AGENDAMENTOS, initialData.agendamentos))
  }, [])

  function atualizarStatus(id, novoStatus) {
    const listaAtualizada = agendamentos.map((item) =>
      item.id === id ? { ...item, status: novoStatus } : item
    )
    setAgendamentos(listaAtualizada)
    setStorageData(STORAGE_KEYS.AGENDAMENTOS, listaAtualizada)
  }

  return (
    <div className="page container">
      <h2>🩺 Painel de Recepção e Atendimento</h2>
      <p>Gerencie o fluxo de coleta e recepção dos pacientes em tempo real.</p>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Horário</th>
              <th>Paciente</th>
              <th>Exame</th>
              <th>Convênio</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.map((item) => (
              <tr key={item.id}>
                <td>{item.data} - {item.hora}</td>
                <td><strong>{item.paciente}</strong><br/><small>CPF: {item.cpf}</small></td>
                <td>{item.exame}</td>
                <td>{item.convenio}</td>
                <td>
                  <span className={`badge badge-${item.status.toLowerCase().replace(' ', '-')}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === 'Agendado' && (
                    <button className="btn-sm btn-action" onClick={() => atualizarStatus(item.id, 'Em Atendimento')}>
                      Iniciar Atendimento
                    </button>
                  )}
                  {item.status === 'Em Atendimento' && (
                    <button className="btn-sm btn-success" onClick={() => atualizarStatus(item.id, 'Concluído')}>
                      Concluir Coleta
                    </button>
                  )}
                  {item.status === 'Concluído' && <small>✓ Finalizado</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}