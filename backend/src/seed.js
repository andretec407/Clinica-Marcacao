import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { pool } from './db.js'
import { hashPassword } from './auth.js'

const users = [
  { name: 'Atendente Demo', email: 'atendente@demo.local', password: 'Atendente123!', role: 'ATENDENTE' },
  { name: 'Gestor Demo', email: 'gestor@demo.local', password: 'Gestor123!', role: 'GESTOR' },
  { name: 'Administrador Demo', email: 'admin@demo.local', password: 'Admin12345!', role: 'ADMINISTRADOR' },
  { name: 'Paciente Demo', email: 'paciente@demo.local', password: 'Paciente123!', role: 'PACIENTE' }
]

try {
  for (const user of users) {
    const [[existing]] = await pool.query('SELECT id FROM users WHERE email=?', [user.email])
    if (existing) continue
    const id = randomUUID()
    await pool.query('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)',
      [id, user.name, user.email, await hashPassword(user.password), user.role])
    if (user.role === 'PACIENTE') {
      await pool.query(`INSERT INTO patients(id,user_id,full_name,cpf,birth_date,email,phone,payment_type)
        VALUES(?,?,?,?,?,?,?,?)`, [randomUUID(), id, user.name, '12345678909', '1995-01-01', user.email, '(11) 99999-0000', 'PARTICULAR'])
    }
  }
  await pool.query('INSERT IGNORE INTO queue_control(id,last_type) VALUES(1,NULL)')
  await pool.query('INSERT IGNORE INTO appointment_sequence(id,next_value) VALUES(1,1023)')
  console.log('Seed concluído.')
} finally {
  await pool.end()
}
