import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'
import { auth, requireRole, signToken, comparePassword, hashPassword } from './auth.js'
import { HttpError } from './errors.js'
import * as clinic from './clinic.js'
import { validCpf } from './clinic.js'
import * as queue from './queue.js'
import * as report from './reports.js'

const app = express()
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads')
mkdirSync(uploadsDirectory, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDirectory),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    callback(allowed.includes(file.mimetype) ? null : new HttpError(400, 'Envie o pedido médico em PDF, JPG ou PNG.'), allowed.includes(file.mimetype))
  }
})
const staff = requireRole('ATENDENTE', 'GESTOR')
const management = requireRole('GESTOR')
const patient = requireRole('PACIENTE')

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5174' }))
app.use(express.json({ limit: '100kb' }))
app.use(morgan('combined'))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'online', time: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'degraded', database: 'offline' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) throw new HttpError(400, 'E-mail e senha são obrigatórios.')
  const [[user]] = await pool.query('SELECT * FROM users WHERE email=? AND active=1', [email.trim().toLowerCase()])
  if (!user || !(await comparePassword(password, user.password_hash))) throw new HttpError(401, 'Credenciais inválidas.')
  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.post('/api/auth/register', async (req, res, next) => {
  const conn = await pool.getConnection()
  try {
    const { fullName, cpf, birthDate, email, phone, password, paymentType = 'PARTICULAR' } = req.body || {}
    const cleanCpf = String(cpf || '').replace(/\D/g, '')
    if (!fullName?.trim() || !validCpf(cleanCpf) || !birthDate || !email?.trim() || !phone?.trim() || String(password || '').length < 8) {
      throw new HttpError(400, 'Preencha os dados do paciente e use uma senha com ao menos 8 caracteres.')
    }
    await conn.beginTransaction()
    const id = randomUUID()
    const patientId = randomUUID()
    const normalizedEmail = email.trim().toLowerCase()
    await conn.query('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,\'PACIENTE\')',
      [id, fullName.trim(), normalizedEmail, await hashPassword(password)])
    await conn.query(`INSERT INTO patients(id,user_id,full_name,cpf,birth_date,email,phone,payment_type)
      VALUES(?,?,?,?,?,?,?,?)`, [patientId, id, fullName.trim(), cleanCpf, birthDate, normalizedEmail, phone.trim(), paymentType])
    await conn.commit()
    const user = { id, name: fullName.trim(), email: normalizedEmail, role: 'PACIENTE' }
    res.status(201).json({ token: signToken(user), user })
  } catch (error) {
    await conn.rollback()
    if (error.code === 'ER_DUP_ENTRY') return next(new HttpError(409, 'E-mail ou CPF já cadastrado.'))
    next(error)
  } finally { conn.release() }
})

app.post('/api/tickets', async (req, res) =>
  res.status(201).json({ ticket: await queue.createTicket(req.body?.type) }))
app.get('/api/queue', async (_req, res) => res.json(await queue.getQueue()))
app.post('/api/calls/next', auth, staff, async (req, res) =>
  res.json({ ticket: await queue.callNext(req.user.sub, Number(req.body?.counter)) }))
app.post('/api/calls/:id/repeat', auth, staff, async (req, res) =>
  res.json({ ticket: await queue.repeatCall(req.user.sub, req.params.id) }))
app.post('/api/tickets/:id/start', auth, staff, async (req, res) =>
  res.json({ ticket: await queue.startTicket(req.user.sub, req.params.id) }))
app.post('/api/tickets/:id/finish', auth, staff, async (req, res) =>
  res.json({ ticket: await queue.finishTicket(req.user.sub, req.params.id) }))

app.post('/api/appointments', auth, patient, upload.single('medicalOrder'), async (req, res) => {
  const body = { ...req.body, exams: typeof req.body.exams === 'string' ? JSON.parse(req.body.exams) : req.body.exams }
  const appointment = await clinic.createRequest(req.user.sub, body, req.file)
  res.status(201).json({ appointment, message: 'Solicitação criada com sucesso.' })
})
app.get('/api/appointments/mine', auth, patient, async (req, res) =>
  res.json({ appointments: await clinic.listMine(req.user.sub) }))
app.get('/api/appointments/:id/document', auth, async (req, res) => {
  const item = await clinic.details(req.params.id)
  if (req.user.role === 'PACIENTE' && item.patient_user_id !== req.user.sub) throw new HttpError(403, 'Você não tem acesso a este documento.')
  if (!['PACIENTE', 'ATENDENTE', 'GESTOR', 'ADMINISTRADOR'].includes(req.user.role)) throw new HttpError(403, 'Perfil sem permissão.')
  const filename = await clinic.documentFor(req.params.id)
  res.download(path.join(uploadsDirectory, path.basename(filename)), 'pedido-medico' + path.extname(filename))
})
app.get('/api/appointments/:id', auth, async (req, res) => {
  const appointment = req.user.role === 'PACIENTE'
    ? await clinic.patientDetails(req.params.id, req.user.sub)
    : await clinic.details(req.params.id)
  res.json({ appointment })
})
app.get('/api/patient/notifications', auth, patient, async (req, res) =>
  res.json({ notifications: await clinic.notifications(req.user.sub) }))
app.patch('/api/patient/notifications/:id/read', auth, patient, async (req, res) =>
  res.json(await clinic.markNotificationRead(req.params.id, req.user.sub)))

app.get('/api/staff/dashboard', auth, staff, async (_req, res) => res.json(await clinic.staffDashboard()))
app.get('/api/staff/queue', auth, staff, async (_req, res) =>
  res.json({ patients: await clinic.waitingQueue() }))
app.get('/api/staff/search', auth, staff, async (req, res) =>
  res.json({ appointments: await clinic.staffSearch(req.query.q) }))
app.get('/api/staff/requests', auth, staff, async (_req, res) =>
  res.json({ appointments: await clinic.pendingRequests() }))
app.post('/api/staff/queue/call-next', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.callNext(req.user.sub) }))
app.post('/api/staff/appointments/:id/approve', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.approveRequest(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/confirm', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.confirmRequest(req.params.id, req.user.sub, req.body?.desiredDate, req.body?.desiredTime) }))
app.post('/api/staff/appointments/:id/arrive', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.arrive(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/start', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.startConsultation(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/collection/start', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.startCollection(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/collection/finish', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.finishCollection(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/finish', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.finishConsultation(req.params.id, req.user.sub, req.body?.staffNote) }))
app.post('/api/staff/appointments/:id/exit', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.registerExit(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/no-show', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.markNoShow(req.params.id, req.user.sub) }))
app.post('/api/staff/appointments/:id/cancel', auth, staff, async (req, res) =>
  res.json({ appointment: await clinic.cancelRequest(req.params.id, req.user.sub, req.body?.note) }))

app.get('/api/reports/clinic', auth, management, async (req, res) =>
  res.json(await clinic.reportSummary(req.query.period === 'month' ? 'month' : 'day')))
app.get('/api/reports/summary', auth, management, async (req, res) =>
  res.json(await report.summary(req.query.period === 'month' ? 'month' : 'day')))
app.get('/api/reports/tickets', auth, management, async (_req, res) =>
  res.json({ tickets: await report.tickets() }))
app.get('/api/reports/audit', auth, management, async (_req, res) =>
  res.json({ audit: await report.audit() }))
app.get('/api/users', auth, management, async (_req, res) => {
  const [users] = await pool.query('SELECT id,name,email,role,active,created_at FROM users ORDER BY name')
  res.json({ users })
})
app.post('/api/users', auth, management, async (req, res, next) => {
  try {
    const { name, email, password, role = 'ATENDENTE' } = req.body || {}
    if (!name || !email || String(password || '').length < 8 || !['ATENDENTE', 'GESTOR', 'ADMINISTRADOR'].includes(role)) {
      throw new HttpError(400, 'Dados de usuário inválidos.')
    }
    const id = randomUUID()
    await pool.query('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)',
      [id, name.trim(), email.trim().toLowerCase(), await hashPassword(password), role])
    res.status(201).json({ id, name, email, role })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(new HttpError(409, 'E-mail já cadastrado.'))
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  if (error instanceof multer.MulterError) return res.status(400).json({ message: 'O arquivo deve ter até 5 MB.' })
  const status = Number(error.status) || 500
  res.status(status).json({ message: status === 500 ? 'Erro interno do servidor.' : error.message })
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => console.log(`nassauTickets backend em http://localhost:${port}`))
