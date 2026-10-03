import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // Perfis possíveis: 'paciente' ou 'atendente'
  const [role, setRole] = useState('atendente')

  function toggleRole() {
    setRole((prevRole) => (prevRole === 'atendente' ? 'paciente' : 'atendente'))
  }

  return (
    <AuthContext.Provider value={{ role, setRole, toggleRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}