import { pool } from './db.js'

export async function summary(period = 'day') {
  const where = period === 'month'
    ? "issue_date BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') AND CURDATE()"
    : 'issue_date=CURDATE()'
  const [[totals]] = await pool.query(`SELECT COUNT(*) emitted,SUM(status='ATENDIDA') attended,
    SUM(status='NAO_COMPARECEU') abandoned,
    COALESCE(ROUND(AVG(TIMESTAMPDIFF(SECOND,started_at,finished_at))/60,2),0) average_minutes
    FROM tickets WHERE ${where}`)
  const [rows] = await pool.query(`SELECT type,COUNT(*) emitted,SUM(status='ATENDIDA') attended
    FROM tickets WHERE ${where} GROUP BY type`)
  const by_type = { SP: { emitted: 0, attended: 0 }, SE: { emitted: 0, attended: 0 }, SG: { emitted: 0, attended: 0 } }
  for (const row of rows) by_type[row.type] = { emitted: Number(row.emitted), attended: Number(row.attended || 0) }
  return {
    emitted: Number(totals.emitted || 0), attended: Number(totals.attended || 0),
    abandoned: Number(totals.abandoned || 0), average_minutes: Number(totals.average_minutes || 0), by_type
  }
}

export async function tickets() {
  const [rows] = await pool.query(`SELECT id,number,type,status,issued_at,started_at,finished_at,counter
    FROM tickets ORDER BY issued_at DESC LIMIT 500`)
  return rows
}

export async function audit() {
  const [rows] = await pool.query(`SELECT a.id,a.counter,a.action,t.number AS ticket_number,u.name AS attendant_name,
    t.first_call_at,t.second_call_at,t.started_at,t.finished_at,a.occurred_at
    FROM audit_events a LEFT JOIN tickets t ON t.id=a.ticket_id LEFT JOIN users u ON u.id=a.actor_user_id
    WHERE a.action IN ('CHAMADA','CHAMADA_NOVAMENTE','INICIO_ATENDIMENTO','FINALIZACAO_ATENDIMENTO','NAO_COMPARECEU')
    ORDER BY a.occurred_at DESC LIMIT 500`)
  const grouped = new Map()
  for (const row of rows) {
    if (!row.ticket_number || grouped.has(row.ticket_number)) continue
    grouped.set(row.ticket_number, {
      id: row.ticket_number, ticket_number: row.ticket_number, counter: row.counter,
      attendant_name: row.attendant_name, first_call_at: row.first_call_at,
      second_call_at: row.second_call_at, started_at: row.started_at, finished_at: row.finished_at
    })
  }
  return [...grouped.values()]
}
