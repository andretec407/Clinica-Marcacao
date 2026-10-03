import {useEffect,useState} from 'react';import {api} from '../services/api'
const emptyForm={name:'',email:'',password:'',role:'ATENDENTE'}
export function Usuarios(){
 const [users,setUsers]=useState([]),[form,setForm]=useState(emptyForm),[msg,setMsg]=useState('')
 const load=async()=>setUsers((await api.users()).users||[])
 useEffect(()=>{load()},[])
 const change=(field,value)=>setForm(prev=>({...prev,[field]:value}))
 const submit=async e=>{e.preventDefault();try{await api.createUser(form);setForm(emptyForm);setMsg('Usuário cadastrado.');await load()}catch(err){setMsg(err.message)}}
 return <div className="container page"><div className="section-head"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Usuários</h1><p>Cadastro disponível para o perfil administrador.</p></div></div>{msg&&<div className="alert">{msg}</div>}<div className="operator-grid"><form className="panel form" onSubmit={submit}><h2>Novo usuário</h2><label>Nome<input value={form.name} onChange={e=>change('name',e.target.value)} required/></label><label>E-mail<input type="email" value={form.email} onChange={e=>change('email',e.target.value)} required/></label><label>Senha<input type="password" value={form.password} onChange={e=>change('password',e.target.value)} required minLength="8"/></label><label>Perfil<select value={form.role} onChange={e=>change('role',e.target.value)}><option>ATENDENTE</option><option>GESTOR</option><option>ADMINISTRADOR</option></select></label><button className="btn primary">Cadastrar</button></form><div className="panel"><h2>Usuários cadastrados</h2><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table></div></div></div>
}
