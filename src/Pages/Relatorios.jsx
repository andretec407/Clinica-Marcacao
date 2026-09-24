import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getStorageData, STORAGE_KEYS } from '../utils/storage'
import initialData from '../data/initialData.json'

export function Relatorios() {
  const [agendamentos, setAgendamentos] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    setAgendamentos(getStorageData(STORAGE_KEYS.AGENDAMENTOS, initialData.agendamentos))
  }, [])

  // Filtragem dos dados exibidos e exportados
  const filtrados = agendamentos.filter((item) => {
    const atendeStatus = filtroStatus === 'Todos' || item.status === filtroStatus
    const atendeBusca =
      item.paciente.toLowerCase().includes(busca.toLowerCase()) ||
      item.exame.toLowerCase().includes(busca.toLowerCase()) ||
      item.cpf.includes(busca)
    return atendeStatus && atendeBusca
  })

  // 1. Exportação para CSV (Nativo, sem bibliotecas externas)
  function exportToCSV() {
    if (filtrados.length === 0) return alert('Nenhum dado para exportar!')

    // Cabeçalho das colunas do CSV
    const headers = ['Data', 'Hora', 'Paciente', 'CPF', 'Exame', 'Convenio', 'Status']
    
    // Mapeamento das linhas
    const rows = filtrados.map((item) => [
      item.data,
      item.hora,
      `"${item.paciente}"`,
      `"${item.cpf}"`,
      `"${item.exame}"`,
      `"${item.convenio}"`,
      item.status,
    ])

    // Monta o conteúdo com quebra de linha
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    // Cria o Blob e força o download no navegador
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_atendimentos_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. Exportação para PDF (Usando jsPDF + autoTable)
  function exportToPDF() {
    if (filtrados.length === 0) return alert('Nenhum dado para exportar!')

    const doc = new jsPDF()

    // Título do documento
    doc.setFontSize(16)
    doc.text('LabiControl — Relatório de Atendimentos', 14, 15)

    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22)
    doc.text(`Filtro Status: ${filtroStatus} | Total de registros: ${filtrados.length}`, 14, 28)

    // Colunas e Dados da tabela PDF
    const tableHeaders = [['Data/Hora', 'Paciente', 'CPF', 'Exame', 'Convênio', 'Status']]
    const tableRows = filtrados.map((item) => [
      `${item.data} ${item.hora}`,
      item.paciente,
      item.cpf,
      item.exame,
      item.convenio,
      item.status,
    ])

    // Renderiza a tabela no PDF
    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] }, // Cor var(--primary) do projeto
      styles: { fontSize: 8 },
    })

    // Salva o arquivo PDF
    doc.save(`relatorio_atendimentos_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📋 Histórico e Relatórios de Atendimento</h2>
          <p>Filtre e exporte informações do histórico de atendimentos.</p>
        </div>

        {/* Botões de Ação para Exportação */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            📥 Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={exportToPDF}>
            📄 Exportar PDF
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar por Paciente, Exame ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="Todos">Todos os Status</option>
          <option value="Agendado">Agendados</option>
          <option value="Em Atendimento">Em Atendimento</option>
          <option value="Concluído">Concluídos</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Paciente</th>
              <th>Exame</th>
              <th>Convênio</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.data} {item.hora}</td>
                  <td>{item.paciente} <small>({item.cpf})</small></td>
                  <td>{item.exame}</td>
                  <td>{item.convenio}</td>
                  <td>
                    <span className={`badge badge-${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  Nenhum histórico encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}