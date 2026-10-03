import {Navigate} from 'react-router-dom';import {useAuth} from '../context/AuthContext'
export function ProtectedRoute({children,roles}){const {user}=useAuth();if(!user)return <Navigate to="/login" replace/>;if(roles&&!roles.includes(user.role)&&!(roles.includes('GESTOR')&&user.role==='ADMINISTRADOR'))return <Navigate to={user.role==='PACIENTE'?'/paciente':'/fluxo'} replace/>;return children}
