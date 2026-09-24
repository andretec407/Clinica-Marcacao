import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFailoverActive, resetStorageToDefaults } from '../utils/storage'

export function Header() {
  const { role, toggleRole } = useAuth()
  const failover = isFailoverActive()

  return (
    <header className="app-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          🧪 <span>Labi<strong>Control</strong></span>
        </Link>

        <nav className="nav-menu">
          <NavLink to="/" end>Início</NavLink>

          {role === 'paciente' ? (
            <NavLink to="/agendamentos">Agendar Exame</NavLink>
          ) : (
            <>
              <NavLink to="/atendimento">Painel Atendimento</NavLink>
              <NavLink to="/dashboard">Indicadores</NavLink>
              <NavLink to="/convenios">Convênios</NavLink>
              <NavLink to="/relatorios">Relatórios</NavLink>
            </>
          )}
        </nav>

        <div className="header-actions">
          <button className="role-btn" onClick={toggleRole}>
            Perfil: <strong>{role === 'atendente' ? '👨‍⚕️ Atendente' : '👤 Paciente'}</strong>
          </button>

          {failover && (
            <button className="failover-btn" onClick={resetStorageToDefaults} title="Sistema em modo de recuperação. Clique para restaurar os dados padrões.">
              ⚠️ Restaurar Dados
            </button>
          )}
        </div>
      </div>
    </header>
  )
}