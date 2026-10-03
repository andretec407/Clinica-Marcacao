import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const secret = process.env.JWT_SECRET || 'dev-secret-change-me-before-deployment'
const validRoles = ['PACIENTE', 'ATENDENTE', 'GESTOR', 'ADMINISTRADOR']

export const hashPassword = password => bcrypt.hash(password, 12)
export const comparePassword = (password, hash) => bcrypt.compare(password, hash)
export const signToken = user => jwt.sign({
  sub: user.id,
  name: user.name,
  email: user.email,
  role: user.role
}, secret, { expiresIn: '8h' })

export function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Autenticação necessária.' })
  try {
    req.user = jwt.verify(token, secret)
    next()
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const expandedRoles = roles.includes('GESTOR') ? [...roles, 'ADMINISTRADOR'] : roles
    if (!validRoles.includes(req.user?.role) || !expandedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Perfil sem permissão para esta operação.' })
    }
    next()
  }
}
