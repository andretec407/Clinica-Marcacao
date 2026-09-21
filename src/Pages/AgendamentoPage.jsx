import React, { useState } from 'react';
import { storageService } from '../Services/storageService'; // Certifique-se de ajustar o caminho se necessário

function AgendamentoPage() {
  const [formData, setFormData] = useState({
    nome: '', 
    cpf: '', 
    exame: '', 
    medico: 'Dra. Ana Silva - Hematologia', 
    dataHora: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Formata a data de 'AAAA-MM-DDTHH:MM' para o formato legível 'DD/MM/AAAA, HH:MM:SS'
    const dataFormatada = new Date(formData.dataHora).toLocaleString('pt-BR');

    const novoAgendamento = {
      paciente: formData.nome,
      cpf: formData.cpf,
      exame: formData.exame,
      medico: formData.medico.split(' - ')[0], // Salva apenas o nome do médico
      dataHora: dataFormatada
    };

    // Salva no localStorage através do serviço
    storageService.salvarAgendamento(novoAgendamento);
    
    alert('Exame agendado com sucesso!');
    
    // Limpa o formulário após salvar
    setFormData({
      nome: '', cpf: '', exame: '', medico: 'Dra. Ana Silva - Hematologia', dataHora: ''
    });
  };

  return (
    <div className="card">
      <h2>Novo Agendamento de Exame</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome do Paciente *</label>
          <input 
            type="text" className="form-control" placeholder="Digite o nome completo" required
            value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>CPF *</label>
          <input 
            type="text" className="form-control" placeholder="000.000.000-00" required
            value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Exame Solicitado *</label>
          <input 
            type="text" className="form-control" placeholder="Ex: Hemograma, Glicemia, Colesterol" required
            value={formData.exame} onChange={e => setFormData({...formData, exame: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Médico Responsável *</label>
          <select 
            className="form-control"
            value={formData.medico} onChange={e => setFormData({...formData, medico: e.target.value})}
          >
            <option>Dra. Ana Silva - Hematologia</option>
            <option>Dr. Carlos Souza - Cardiologia</option>
          </select>
        </div>

        <div className="form-group">
          <label>Data e Hora do Exame *</label>
          <input 
            type="datetime-local" className="form-control" required
            value={formData.dataHora} onChange={e => setFormData({...formData, dataHora: e.target.value})}
          />
        </div>

        <button type="submit" className="btn-primary">Confirmar Marcação</button>
      </form>
    </div>
  );
}

export default AgendamentoPage;
