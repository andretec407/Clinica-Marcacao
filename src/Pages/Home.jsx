import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Home() {
  const { role } = useAuth()

  return (
    <div className="page container">
      <section className="hero-banner">
        <h1>Inovação e Agilidade no Atendimento Laboratorial</h1>
        <p>Agende exames rapidamente, acompanhe atendimentos em tempo real e consulte relatórios em um só lugar.</p>
        
        <div className="hero-actions">
          {role === 'paciente' ? (
            <Link to="/agendamentos" className="btn btn-primary">Agendar Meu Exame Agora</Link>
          ) : (
            <Link to="/atendimento" className="btn btn-primary">Acessar Fila de Atendimento</Link>
          )}
        </div>
      </section>

      <section className="features-grid">
        <div className="card-feature">
          <h3>⏱️ Atendimento Rápido</h3>
          <p>Triagem inteligente e chamadas por senha para otimizar o fluxo da recepção.</p>
        </div>
        <div className="card-feature">
          <h3>📊 Gestão de Indicadores</h3>
          <p>Painéis em tempo real do volume de exames e performance laboratorial.</p>
        </div>
        <div className="card-feature">
          <h3>🛡️ Operação Contínua</h3>
          <p>Arquitetura resiliente com suporte a operação degradada e salvamento local automático.</p>
        </div>
      </section>
    </div>
  )
}