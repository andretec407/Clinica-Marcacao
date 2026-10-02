import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
const secret=process.env.JWT_SECRET||'dev-secret-change-me'
export function signToken(user){return jwt.sign({sub:user.id,name:user.name,email:user.email,role:user.role},secret,{expiresIn:'8h'})}
export function auth(req,res,next){const header=req.headers.authorization||'';const token=header.startsWith('Bearer ')?header.slice(7):null;if(!token)return res.status(401).json({message:'Autenticação necessária.'});try{req.user=jwt.verify(token,secret);next()}catch{return res.status(401).json({message:'Sessão inválida ou expirada.'})}}
export function requireRole(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({message:'Perfil sem permissão para esta operação.'})}
export const hashPassword=password=>bcrypt.hash(password,12)
export const comparePassword=(password,hash)=>bcrypt.compare(password,hash)
