import { randomUUID } from 'node:crypto'
import { pool, transaction } from './db.js'
import { HttpError } from './errors.js'

const joinPatient = `SELECT a.*, p.full_name, p.cpf, p.birth_date, p.email, p.phone, p.payment_type,
  u.id AS patient_user_id FROM appointments a JOIN patients p ON p.id=a.patient_id
  JOIN users u ON u.id=p.user_id`
const timeColumns = {
  AGENDADO: 'confirmed_at', NA_ESPERA: 'arrived_at', EM_ATENDIMENTO: 'started_at',
  EM_COLETA: 'collection_started_at', COLETA_REALIZADA: 'collection_finished_at',
  ATENDIMENTO_FINALIZADO: 'finished_at', CONCLUIDO: 'exited_at'
}

function normalizeCpf(value) { return String(value || '').replace(/\D/g, '') }
export function validCpf(value) {
  const digits = normalizeCpf(value)
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  const digitAt = length => {
    const sum = digits.slice(0, length).split('').reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return digitAt(9) === Number(digits[9]) && digitAt(10) === Number(digits[10])
}
function validateRequest(body) {
  const required = ['fullName', 'cpf', 'birthDate', 'email', 'phone', 'paymentType', 'desiredDate', 'desiredTime']
  if (required.some(field => !String(body[field] || '').trim())) throw new HttpError(400, 'Preencha todos os dados obrigatórios.')
  if (!validCpf(body.cpf)) throw new HttpError(400, 'Informe um CPF válido com 11 dígitos.')
  if (!['CONVENIO', 'PARTICULAR'].includes(body.paymentType)) throw new HttpError(400, 'Selecione convênio ou particular.')
  const desiredDate = new Date(`${body.desiredDate}T00:00:00Z`)
  if (Number.isNaN(desiredDate.valueOf()) || desiredDate.toISOString().slice(0, 10) !== body.desiredDate
      || body.desiredDate < new Date().toISOString().slice(0, 10)) {
    throw new HttpError(400, 'A data desejada deve ser válida e não pode estar no passado.')
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.desiredTime) || body.desiredTime < '07:00' || body.desiredTime >= '17:00') {
    throw new HttpError(400, 'Escolha um horário entre 07:00 e 17:00.')
  }
  if (!Array.isArray(body.exams) || !body.exams.length || body.exams.some(exam => !String(exam).trim())) {
    throw new HttpError(400, 'Informe ao menos um exame.')
  }
}

async function addEvent(conn, appointmentId, actorId, status, note = null) {
  await conn.query('INSERT INTO appointment_events(id,appointment_id,actor_user_id,status,note) VALUES(?,?,?,?,?)',
    [randomUUID(), appointmentId, actorId, status, note])
}

async function notify(conn, userId, appointmentId, title, message) {
  await conn.query('INSERT INTO notifications(id,user_id,appointment_id,title,message) VALUES(?,?,?,?,?)',
    [randomUUID(), userId, appointmentId, title, message])
}

async function transition(id, actorId, allowed, nextStatus, note, update = {}) {
  return transaction(async conn => {
    const [rows] = await conn.query(`${joinPatient} WHERE a.id=? FOR UPDATE`, [id])
    if (!rows.length) throw new HttpError(404, 'Solicitação não encontrada.')
    const appointment = rows[0]
    if (!allowed.includes(appointment.status)) throw new HttpError(409, `A solicitação não pode avançar de ${appointment.status}.`)
    const fields = ['status=?']
    const values = [nextStatus]
    const timestampColumn = timeColumns[nextStatus]
    if (timestampColumn) fields.push(`${timestampColumn}=NOW()`)
    for (const [key, value] of Object.entries(update)) {
      if (!['desired_date', 'desired_time', 'attendant_id', 'staff_note'].includes(key)) continue
      fields.push(`${key}=?`)
      values.push(value)
    }
    values.push(id)
    await conn.query(`UPDATE appointments SET ${fields.join(',')} WHERE id=?`, values)
    await addEvent(conn, id, actorId, nextStatus, note)
    const label = note || `Status atualizado para ${nextStatus.replaceAll('_', ' ').toLowerCase()}.`
    await notify(conn, appointment.patient_user_id, id, 'Atualização da solicitação', label)
    return { ...appointment, ...update, status: nextStatus }
  })
}

export async function createRequest(userId, body, document) {
  validateRequest(body)
  return transaction(async conn => {
    const [patients] = await conn.query('SELECT * FROM patients WHERE user_id=? FOR UPDATE', [userId])
    if (!patients.length) throw new HttpError(404, 'Perfil de paciente não encontrado.')
    const patient = patients[0]
    const cpf = normalizeCpf(body.cpf)
    if (cpf !== normalizeCpf(patient.cpf)) throw new HttpError(400, 'O CPF informado deve corresponder ao cadastro da conta.')
    await conn.query('UPDATE patients SET full_name=?,birth_date=?,email=?,phone=?,payment_type=? WHERE id=?',
      [body.fullName.trim(), body.birthDate, body.email.trim().toLowerCase(), body.phone.trim(), body.paymentType, patient.id])
    await conn.query('UPDATE users SET name=?,email=? WHERE id=?', [body.fullName.trim(), body.email.trim().toLowerCase(), userId])
    await conn.query('UPDATE appointment_sequence SET next_value=LAST_INSERT_ID(next_value+1) WHERE id=1')
    const [[sequence]] = await conn.query('SELECT LAST_INSERT_ID() AS ticket_number')
    const id = randomUUID()
    const ticketNumber = `A${sequence.ticket_number}`
    const exams = body.exams.map(exam => String(exam).trim())
    await conn.query(`INSERT INTO appointments
      (id,ticket_number,patient_id,exams,desired_date,desired_time,payment_type,notes,document_path,status)
      VALUES(?,?,?,?,?,?,?,?,?,'SOLICITADO')`,
    [id, ticketNumber, patient.id, JSON.stringify(exams), body.desiredDate, body.desiredTime,
    body.paymentType, body.notes?.trim() || null, document?.filename || null])
    await addEvent(conn, id, userId, 'SOLICITADO', 'Solicitação enviada pelo paciente.')
    return { id, ticketNumber, exams, desiredDate: body.desiredDate, desiredTime: body.desiredTime, status: 'SOLICITADO' }
  })
}

export async function registerPatient(userId, profile) {
  const cpf = normalizeCpf(profile.cpf)
  if (!profile.fullName?.trim() || !validCpf(cpf) || !profile.birthDate || !profile.phone) {
    throw new HttpError(400, 'Informe nome, CPF, nascimento e telefone para criar o perfil.')
  }
  const id = randomUUID()
  try {
    await pool.query('INSERT INTO patients(id,user_id,full_name,cpf,birth_date,email,phone,payment_type) VALUES(?,?,?,?,?,?,?,?)',
      [id, userId, profile.fullName.trim(), cpf, profile.birthDate, profile.email.trim().toLowerCase(), profile.phone.trim(), profile.paymentType || 'PARTICULAR'])
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Já existe uma conta cadastrada com este CPF.')
    throw error
  }
}

export async function listMine(userId) {
  const [rows] = await pool.query(`${joinPatient} WHERE p.user_id=? ORDER BY a.created_at DESC`, [userId])
  if (!rows.length) return rows
  const ids = rows.map(row => row.id)
  const [events] = await pool.query(`SELECT id,appointment_id,status,note,created_at FROM appointment_events
    WHERE appointment_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`, ids)
  const histories = new Map(ids.map(id => [id, []]))
  for (const event of events) histories.get(event.appointment_id).push(event)
  return rows.map(row => ({ ...row, history: histories.get(row.id) }))
}

export async function details(id) {
  const [rows] = await pool.query(`${joinPatient} WHERE a.id=?`, [id])
  if (!rows.length) throw new HttpError(404, 'Solicitação não encontrada.')
  const [events] = await pool.query(`SELECT e.id,e.status,e.note,e.created_at,u.name AS actor_name
    FROM appointment_events e LEFT JOIN users u ON u.id=e.actor_user_id
    WHERE e.appointment_id=? ORDER BY e.created_at ASC`, [id])
  return { ...rows[0], history: events }
}

export async function patientDetails(id, userId) {
  const item = await details(id)
  if (item.patient_user_id !== userId) throw new HttpError(403, 'Você não tem acesso a esta solicitação.')
  return item
}

export async function staffSearch(query) {
  const term = String(query || '').trim()
  if (!term) return []
  const cpf = normalizeCpf(term)
  const birthDate = /^\d{4}-\d{2}-\d{2}$/.test(term) ? term
    : /^\d{2}\/\d{2}\/\d{4}$/.test(term) ? `${term.slice(6)}-${term.slice(3, 5)}-${term.slice(0, 2)}` : null
  const [rows] = await pool.query(`${joinPatient}
    WHERE a.ticket_number=? OR p.cpf LIKE ? OR p.full_name LIKE ? OR p.birth_date=?
    ORDER BY a.created_at DESC LIMIT 50`, [term.toUpperCase(), `%${cpf || term}%`, `%${term}%`, birthDate])
  return rows
}

export async function pendingRequests() {
  const [rows] = await pool.query(`${joinPatient} WHERE a.status IN ('SOLICITADO','AGUARDANDO_CONFIRMACAO') ORDER BY a.created_at ASC`)
  return rows
}

export async function waitingQueue() {
  const [rows] = await pool.query(`${joinPatient} WHERE a.status IN ('NA_ESPERA','CHAMADO','EM_ATENDIMENTO','EM_COLETA','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO')
    ORDER BY FIELD(a.status,'ATENDIMENTO_FINALIZADO','COLETA_REALIZADA','EM_COLETA','EM_ATENDIMENTO','CHAMADO','NA_ESPERA'), a.arrived_at ASC`)
  return rows
}

export async function staffDashboard() {
  const [[counts]] = await pool.query(`SELECT
    SUM(status='NA_ESPERA') AS waiting,
    SUM(status IN ('CHAMADO','EM_ATENDIMENTO','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO')) AS in_service,
    SUM(status='EM_COLETA') AS in_collection,
    SUM(status='CONCLUIDO' AND DATE(exited_at)=CURDATE()) AS finished,
    SUM(status IN ('SOLICITADO','AGUARDANDO_CONFIRMACAO')) AS pending
    FROM appointments WHERE DATE(created_at)=CURDATE() OR DATE(arrived_at)=CURDATE() OR DATE(exited_at)=CURDATE()
    OR status IN ('NA_ESPERA','EM_ATENDIMENTO','CHAMADO','EM_COLETA','SOLICITADO','AGUARDANDO_CONFIRMACAO')`)
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value || 0)]))
}

export async function confirmRequest(id, actorId, date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || ''))) {
    throw new HttpError(400, 'Informe uma data e um horário válidos para o agendamento.')
  }
  return transition(id, actorId, ['AGUARDANDO_CONFIRMACAO'], 'AGENDADO', 'Agendamento confirmado pela equipe.',
    { desired_date: date, desired_time: time })
}

export async function approveRequest(id, actorId) {
  return transition(id, actorId, ['SOLICITADO'], 'AGUARDANDO_CONFIRMACAO', 'Solicitação aprovada; aguardando confirmação do agendamento.')
}

export async function arrive(id, actorId) {
  return transition(id, actorId, ['AGENDADO'], 'NA_ESPERA', 'Chegada registrada na recepção.')
}

export async function callNext(actorId) {
  return transaction(async conn => {
    const [active] = await conn.query(`SELECT ticket_number FROM appointments WHERE attendant_id=?
      AND status IN ('CHAMADO','EM_ATENDIMENTO','EM_COLETA','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO')
      ORDER BY updated_at DESC LIMIT 1 FOR UPDATE`, [actorId])
    if (active.length) throw new HttpError(409, `Conclua o atendimento ${active[0].ticket_number} antes de chamar outro paciente.`)
    const [rows] = await conn.query(`${joinPatient} WHERE a.status='NA_ESPERA' ORDER BY a.arrived_at ASC LIMIT 1 FOR UPDATE`)
    if (!rows.length) throw new HttpError(409, 'Não há pacientes aguardando.')
    const appointment = rows[0]
    await conn.query("UPDATE appointments SET status='CHAMADO',attendant_id=? WHERE id=?", [actorId, appointment.id])
    await addEvent(conn, appointment.id, actorId, 'CHAMADO', 'Paciente chamado para atendimento.')
    await notify(conn, appointment.patient_user_id, appointment.id, 'É sua vez', 'Dirija-se ao guichê para iniciar o atendimento.')
    return { ...appointment, status: 'CHAMADO' }
  })
}

export const startConsultation = (id, actorId) => transition(id, actorId, ['CHAMADO'], 'EM_ATENDIMENTO', 'Atendimento iniciado.')
export const startCollection = (id, actorId) => transition(id, actorId, ['EM_ATENDIMENTO'], 'EM_COLETA', 'Coleta iniciada.')
export const finishCollection = (id, actorId) => transition(id, actorId, ['EM_COLETA'], 'COLETA_REALIZADA', 'Coleta realizada.')
export const finishConsultation = (id, actorId, note) => transition(id, actorId,
  ['COLETA_REALIZADA'], 'ATENDIMENTO_FINALIZADO', note || 'Atendimento finalizado.', { staff_note: note || null })
export const registerExit = (id, actorId) => transition(id, actorId, ['ATENDIMENTO_FINALIZADO'], 'CONCLUIDO', 'Saída do paciente registrada.')
export const markNoShow = (id, actorId) => transition(id, actorId, ['AGENDADO'], 'FALTOU', 'Paciente não compareceu.')
export const cancelRequest = (id, actorId, note) => transition(id, actorId,
  ['SOLICITADO', 'AGUARDANDO_CONFIRMACAO', 'AGENDADO'], 'CANCELADO', note || 'Solicitação cancelada.')

export async function notifications(userId) {
  const [rows] = await pool.query('SELECT id,appointment_id,title,message,is_read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50', [userId])
  return rows
}

export async function markNotificationRead(id, userId) {
  await pool.query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [id, userId])
  return { success: true }
}

export async function reportSummary(period = 'day') {
  const appointmentDateFilter = period === 'month'
    ? "created_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01') AND created_at<DATE_ADD(CURDATE(),INTERVAL 1 DAY)"
    : 'DATE(created_at)=CURDATE()'
  const completionDateFilter = period === 'month'
    ? "finished_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01') AND finished_at<DATE_ADD(CURDATE(),INTERVAL 1 DAY)"
    : 'DATE(finished_at)=CURDATE()'
  const lifecycleDateFilter = period === 'month'
    ? "updated_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01') AND updated_at<DATE_ADD(CURDATE(),INTERVAL 1 DAY)"
    : 'DATE(updated_at)=CURDATE()'
  const [[counts]] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM appointments WHERE ${appointmentDateFilter}) AS total,
    (SELECT COUNT(*) FROM appointments WHERE status='CONCLUIDO' AND ${completionDateFilter}) AS completed,
    (SELECT COUNT(*) FROM appointments WHERE status='FALTOU' AND ${lifecycleDateFilter}) AS no_show,
    (SELECT COUNT(*) FROM appointments WHERE status='CANCELADO' AND ${lifecycleDateFilter}) AS cancelled,
    (SELECT COALESCE(SUM(JSON_LENGTH(exams)),0) FROM appointments WHERE status='CONCLUIDO' AND ${completionDateFilter}) AS exams_completed,
    (SELECT AVG(TIMESTAMPDIFF(MINUTE,arrived_at,started_at)) FROM appointments WHERE status IN ('ATENDIMENTO_FINALIZADO','CONCLUIDO') AND ${completionDateFilter}) AS average_wait_minutes,
    (SELECT AVG(TIMESTAMPDIFF(MINUTE,started_at,finished_at)) FROM appointments WHERE status IN ('ATENDIMENTO_FINALIZADO','CONCLUIDO') AND ${completionDateFilter}) AS average_service_minutes,
    (SELECT AVG(TIMESTAMPDIFF(MINUTE,arrived_at,exited_at)) FROM appointments WHERE status='CONCLUIDO' AND ${completionDateFilter}) AS average_stay_minutes`)
  const [[flow]] = await pool.query(`SELECT
    SUM(arrived_at IS NOT NULL AND DATE(arrived_at)=CURDATE()) AS arrived,
    SUM(status='NA_ESPERA') AS waiting,
    SUM(status IN ('CHAMADO','EM_ATENDIMENTO')) AS in_service,
    SUM(status='EM_COLETA') AS in_collection,
    SUM(status='CONCLUIDO' AND DATE(exited_at)=CURDATE()) AS exited
    FROM appointments`)
  const [staff] = await pool.query(`SELECT u.name,COUNT(a.id) AS completed FROM appointments a
    JOIN users u ON u.id=a.attendant_id WHERE a.status='CONCLUIDO' AND ${completionDateFilter}
    GROUP BY u.id,u.name ORDER BY completed DESC`)
  return {
    ...Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value || 0)])),
    current_flow: Object.fromEntries(Object.entries(flow).map(([key, value]) => [key, Number(value || 0)])),
    by_attendant: staff
  }
}

export async function documentFor(id) {
  const [[row]] = await pool.query('SELECT document_path FROM appointments WHERE id=?', [id])
  if (!row?.document_path) throw new HttpError(404, 'Nenhum documento foi anexado.')
  return row.document_path
}
