import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { CadastroPaciente } from './pages/CadastroPaciente'
import { PortalPaciente } from './pages/PortalPaciente'
import { Totem } from './pages/Totem'
import { Painel } from './pages/Painel'
import { Atendimento } from './pages/Atendimento'
import { Relatorios } from './pages/Relatorios'
import { Usuarios } from './pages/Usuarios'


export default function App() {
  return <div className="app"><Header /><main><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
    <Route path="/paciente" element={<ProtectedRoute roles={['PACIENTE']}><PortalPaciente /></ProtectedRoute>} />
    <Route path="/totem" element={<Totem />} />
    <Route path="/painel" element={<Painel />} />
    <Route path="/fluxo" element={<ProtectedRoute roles={['ATENDENTE']}><Atendimento /></ProtectedRoute>} />
    <Route path="/atendimento" element={<ProtectedRoute roles={['ATENDENTE']}><Atendimento /></ProtectedRoute>} />
    <Route path="/relatorios" element={<ProtectedRoute roles={['ATENDENTE']}><Relatorios /></ProtectedRoute>} />
    <Route path="/usuarios" element={<ProtectedRoute roles={['ATENDENTE']}><Usuarios /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></main><Footer /></div>
}
