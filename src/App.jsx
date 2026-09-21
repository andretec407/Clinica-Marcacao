import React, { useState } from 'react';
import AgendamentoPage from './Pages/AgendamentoPage';
import ListagemPage from './Pages/ListagemPage';
import './App.css';

function App() {
  const [telaAtiva, setTelaAtiva] = useState('agendamento');

  return (
    <div>
      {/* Barra de navegação parecida com a do Laboratório Nabuco */}
      <nav className="navbar">
        <div className="logo-placeholder"><PerLabVida></PerLabVida> <span style={{fontWeight: '300'}}>Agendamentos</span></div>
        <div className="nav-links">
          <button 
            className={telaAtiva === 'agendamento' ? 'active' : ''} 
            onClick={() => setTelaAtiva('agendamento')}
          >
            Novo Agendamento
          </button>
          <button 
            className={telaAtiva === 'listagem' ? 'active' : ''} 
            onClick={() => setTelaAtiva('listagem')}
          >
            Lista de Atendimentos
          </button>
        </div>
      </nav>

      {/* Conteúdo dinâmico das páginas dentro do container */}
      <div className="container">
        {telaAtiva === 'agendamento' ? <AgendamentoPage /> : <ListagemPage />}
      </div>
    </div>
  );
}

export default App;
