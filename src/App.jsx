import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

import { Home } from './pages/Home'
import { Agendamentos } from './pages/Agendamentos'
import { Atendimento } from './pages/Atendimento'
import { Dashboard } from './pages/Dashboard'
import { Convenios } from './pages/Convenios'
import { Relatorios } from './pages/Relatorios'
import { NotFound } from './pages/NotFound'

import { useAuth } from './context/AuthContext'

export default function App() {
  const { role } = useAuth()

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agendamentos" element={<Agendamentos />} />

          {/* Rotas restritas para o perfil Atendente */}
          <Route
            path="/atendimento"
            element={role === 'atendente' ? <Atendimento /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard"
            element={role === 'atendente' ? <Dashboard /> : <Navigate to="/" />}
          />
          <Route
            path="/convenios"
            element={role === 'atendente' ? <Convenios /> : <Navigate to="/" />}
          />
          <Route
            path="/relatorios"
            element={role === 'atendente' ? <Relatorios /> : <Navigate to="/" />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}