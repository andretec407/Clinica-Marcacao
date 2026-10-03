import { createContext, useContext, useMemo, useState } from 'react'
import { api } from '../services/api'
const AuthContext=createContext(null)
export function AuthProvider({children}){const [user,setUser]=useState(()=>{const raw=localStorage.getItem('nassau_user');return raw?JSON.parse(raw):null});function persist(data){localStorage.setItem('nassau_token',data.token);localStorage.setItem('nassau_user',JSON.stringify(data.user));setUser(data.user)}async function login(email,password){persist(await api.login(email,password))}async function registerPatient(profile){persist(await api.registerPatient(profile))}function logout(){localStorage.removeItem('nassau_token');localStorage.removeItem('nassau_user');setUser(null)}const value=useMemo(()=>({user,login,registerPatient,logout,isAuthenticated:!!user}),[user]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){return useContext(AuthContext)}
