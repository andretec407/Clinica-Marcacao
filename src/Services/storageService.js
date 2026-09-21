import inicialData from '../data/inicialData.json';

const STORAGE_KEY = 'PerLabVida_agendamentos';

export const storageService = {
  // Busca todos os agendamentos salvos
  getAgendamentos: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Adiciona um novo agendamento à lista existente
  salvarAgendamento: (novoAgendamento) => {
    const agendamentosAtuais = storageService.getAgendamentos();
    
    // Cria um ID único usando o timestamp atual e insere na lista
    const agendamentoComId = { 
      ...novoAgendamento, 
      id: Date.now() 
    };
    
    const novaLista = [...agendamentosAtuais, agendamentoComId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    return novaLista;
  }
};
