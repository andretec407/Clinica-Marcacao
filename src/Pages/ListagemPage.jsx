import React, { useState, useEffect } from 'react';
import { storageService } from '../Services/storageService';

function ListagemPage() {
  const [agendamentos, setAgendamentos] = useState([]);

  // Carrega os dados salvos do localStorage assim que o componente entra na tela
  useEffect(() => {
    const dadosSalvos = storageService.getAgendamentos();
    setAgendamentos(dadosSalvos);
  }, []);

  // Função para exportar os dados reais como Relatório (formato CSV)
  const gerarRelatorioCSV = () => {
    if (agendamentos.length === 0) {
      alert("Não há dados para exportar no momento.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data/Hora;Paciente;Exame;Medico\n"; 

    agendamentos.forEach((item) => {
      csvContent += `${item.dataHora};${item.paciente};${item.exame};${item.medico}\n`;
  });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_atendimentos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="header-actions">
        <h2>Atendimentos e Exames Agendados</h2>
        <button className="btn-report" onClick={gerarRelatorioCSV}>
          📊 Gerar Relatório (CSV)
        </button>
      </div>

      <div className="table-responsive">
        {agendamentos.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Nenhum exame agendado até o momento.
          </p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Paciente</th>
                <th>Exame</th>
                <th>Médico</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((item) => (
                <tr key={item.id}>
                  <td>{item.dataHora}</td>
                  <td>{item.paciente}</td>
                  <td>{item.exame}</td>
                  <td>{item.medico}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ListagemPage;
