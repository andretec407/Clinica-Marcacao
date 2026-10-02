import { createContext, useContext, useMemo, useState } from 'react'
import { api } from '../services/api'
const AuthContext=createContext(null)
export function AuthProvider({children}){const [user,setUser]=useState(()=>{const raw=localStorage.getItem('nassau_user');return raw?JSON.parse(raw):null});async function login(email,password){const data=await api.login(email,password);localStorage.setItem('nassau_token',data.token);localStorage.setItem('nassau_user',JSON.stringify(data.user));setUser(data.user)}function logout(){localStorage.removeItem('nassau_token');localStorage.removeItem('nassau_user');setUser(null)}const value=useMemo(()=>({user,login,logout,isAuthenticated:!!user}),[user]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){return useContext(AuthContext)}
