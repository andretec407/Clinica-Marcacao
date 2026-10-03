import { randomUUID } from 'node:crypto'
import { pool, transaction } from './db.js'
import { HttpError } from './errors.js'

function ensureBusinessHours() {
  if (process.env.ENFORCE_BUSINESS_HOURS === 'false') return
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Recife', hour: '2-digit', hour12: false
  }).format(new Date()))
  if (hour < 7 || hour >= 17) throw new HttpError(400, 'Atendimento fora do expediente. O horário de operação é das 07:00 às 17:00.')
}

export async function createTicket(type) {
  ensureBusinessHours()
  if (!['SP', 'SE', 'SG'].includes(type)) throw new HttpError(400, 'Tipo de senha inválido.')
  return transaction(async conn => {
    const today = new Date().toISOString().slice(0, 10)
    await conn.query(`INSERT INTO ticket_sequences(issue_date,type,next_sequence) VALUES(?,?,2)
      ON DUPLICATE KEY UPDATE next_sequence=next_sequence+1`, [today, type])
    const [[seq]] = await conn.query('SELECT next_sequence-1 AS sequence_number FROM ticket_sequences WHERE issue_date=? AND type=? FOR UPDATE', [today, type])
    const number = `${today.slice(2).replaceAll('-', '')}-${type}${String(seq.sequence_number).padStart(3, '0')}`
    const id = randomUUID()
    const now = new Date()
    await conn.query(`INSERT INTO tickets(id,number,type,sequence_number,issue_date,status,issued_at)
      VALUES(?,?,?,?,?,'AGUARDANDO',?)`, [id, number, type, seq.sequence_number, today, now])
    await conn.query("INSERT INTO audit_events(ticket_id,action,metadata) VALUES(?,'EMISSAO',?)", [id, JSON.stringify({ type, number })])
    return { id, number, type, status: 'AGUARDANDO', issued_at: now }
  })
}

export async function getQueue() {
  const [waiting] = await pool.query("SELECT id,number,type,status,issued_at FROM tickets WHERE status='AGUARDANDO' ORDER BY issued_at ASC")
  const [history] = await pool.query(`SELECT id,number,type,counter,status,first_call_at AS called_at
    FROM tickets WHERE first_call_at IS NOT NULL ORDER BY first_call_at DESC LIMIT 5`)
  const [currentRows] = await pool.query(`SELECT id,number,type,counter,status,call_count FROM tickets
    WHERE first_call_at IS NOT NULL ORDER BY first_call_at DESC LIMIT 1`)
  return { waiting, current: currentRows[0] || null, history }
}

export async function callNext(userId, counter) {
  ensureBusinessHours()
  if (!Number.isInteger(counter) || counter < 1 || counter > 99) throw new HttpError(409, 'Guichê inválido.')
  return transaction(async conn => {
    const [[active]] = await conn.query(`SELECT id,number,status FROM tickets WHERE attendant_id=?
      AND status IN ('CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO') ORDER BY first_call_at DESC LIMIT 1 FOR UPDATE`, [userId])
    if (active?.status === 'CHAMADA_NOVAMENTE') {
      await conn.query("UPDATE tickets SET status='NAO_COMPARECEU' WHERE id=?", [active.id])
      await conn.query("INSERT INTO audit_events(ticket_id,actor_user_id,action,metadata) VALUES(?,?,'NAO_COMPARECEU',?)",
        [active.id, userId, JSON.stringify({ reason: 'segunda chamada sem comparecimento' })])
    } else if (active) {
      throw new HttpError(409, `Finalize o atendimento da senha ${active.number} antes de chamar outra.`)
    }
    const [[control]] = await conn.query('SELECT last_type FROM queue_control WHERE id=1 FOR UPDATE')
    const candidates = control?.last_type === 'SP' ? ['SE', 'SG', 'SP'] : ['SP', 'SE', 'SG']
    let selected = null
    for (const type of candidates) {
      const [[row]] = await conn.query(`SELECT id,type FROM tickets WHERE status='AGUARDANDO' AND type=?
        ORDER BY issued_at ASC LIMIT 1 FOR UPDATE`, [type])
      if (row) { selected = row; break }
    }
    if (!selected) throw new HttpError(409, 'Não há senhas aguardando atendimento.')
    const now = new Date()
    await conn.query(`UPDATE tickets SET status='CHAMADA',first_call_at=?,call_count=1,counter=?,attendant_id=?
      WHERE id=? AND status='AGUARDANDO'`, [now, counter, userId, selected.id])
    await conn.query('UPDATE queue_control SET last_type=? WHERE id=1', [selected.type])
    await conn.query("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) VALUES(?,?,?,'CHAMADA')", [selected.id, userId, counter])
    const [[ticket]] = await conn.query('SELECT * FROM tickets WHERE id=?', [selected.id])
    return ticket
  })
}

export async function repeatCall(userId, ticketId) {
  return transaction(async conn => {
    const [[ticket]] = await conn.query('SELECT * FROM tickets WHERE id=? AND attendant_id=? FOR UPDATE', [ticketId, userId])
    if (!ticket) throw new HttpError(409, 'Senha não encontrada para este atendente.')
    if (!['CHAMADA', 'CHAMADA_NOVAMENTE'].includes(ticket.status)) throw new HttpError(409, 'A senha não pode ser chamada novamente neste estado.')
    if (ticket.call_count >= 2) {
      await conn.query("UPDATE tickets SET status='NAO_COMPARECEU' WHERE id=?", [ticketId])
      await conn.query("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) VALUES(?,?,?,'NAO_COMPARECEU')", [ticketId, userId, ticket.counter])
      return { ...ticket, status: 'NAO_COMPARECEU' }
    }
    await conn.query("UPDATE tickets SET status='CHAMADA_NOVAMENTE',second_call_at=NOW(),call_count=2 WHERE id=?", [ticketId])
    await conn.query("INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) VALUES(?,?,?,'CHAMADA_NOVAMENTE')", [ticketId, userId, ticket.counter])
    const [[updated]] = await conn.query('SELECT * FROM tickets WHERE id=?', [ticketId])
    return updated
  })
}

async function updateState(userId, ticketId, allowed, status, action, timestamp) {
  return transaction(async conn => {
    const placeholders = allowed.map(() => '?').join(',')
    const [result] = await conn.query(`UPDATE tickets SET status=?,${timestamp}=NOW()
      WHERE id=? AND attendant_id=? AND status IN (${placeholders})`, [status, ticketId, userId, ...allowed])
    if (!result.affectedRows) throw new HttpError(409, status === 'ATENDIDA' ? 'A senha não está em atendimento.' : 'A senha não está disponível para início.')
    await conn.query('INSERT INTO audit_events(ticket_id,actor_user_id,counter,action) SELECT id,attendant_id,counter,? FROM tickets WHERE id=?', [action, ticketId])
    const [[ticket]] = await conn.query('SELECT * FROM tickets WHERE id=?', [ticketId])
    return ticket
  })
}

export const startTicket = (userId, id) => updateState(userId, id, ['CHAMADA', 'CHAMADA_NOVAMENTE'], 'EM_ATENDIMENTO', 'INICIO_ATENDIMENTO', 'started_at')
export const finishTicket = (userId, id) => updateState(userId, id, ['EM_ATENDIMENTO'], 'ATENDIDA', 'FINALIZACAO_ATENDIMENTO', 'finished_at')
