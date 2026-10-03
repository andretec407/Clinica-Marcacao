const STORAGE_KEY = 'nassau_demo_state'
const PATIENT_ID = 'demo-patient'
const STAFF_ID = 'demo-staff'
const ADMIN_ID = 'demo-admin'

export const demoAccounts = [
  { email: 'paciente@demo.local', password: 'Paciente123!', user: { id: PATIENT_ID, name: 'Maria da Silva', email: 'paciente@demo.local', role: 'PACIENTE' } },
  { email: 'atendente@demo.local', password: 'Atendente123!', user: { id: STAFF_ID, name: 'Atendente Demo', email: 'atendente@demo.local', role: 'ATENDENTE' } },
  { email: 'admin@demo.local', password: 'Admin12345!', user: { id: ADMIN_ID, name: 'Administrador Demo', email: 'admin@demo.local', role: 'ADMINISTRADOR' } }
]

const now = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const makeEvent = (status, note) => ({ id: crypto.randomUUID(), status, note, created_at: now() })

function initialState() {
  const created = `${today()}T08:00:00.000Z`
  const maria = {
    id: 'demo-appointment-1024', ticket_number: 'A1024', patient_id: PATIENT_ID, patient_user_id: PATIENT_ID,
    full_name: 'Maria da Silva', cpf: '52998224725', birth_date: '1988-04-12', email: 'paciente@demo.local', phone: '(11) 99999-1024',
    payment_type: 'CONVENIO', exams: ['Hemograma', 'Glicemia'], desired_date: today(), desired_time: '09:00',
    notes: 'Jejum de 8 horas.', staff_note: 'Paciente orientada sobre o preparo.', document_path: 'pedido-demo.pdf',
    status: 'NA_ESPERA', attendant_id: null, created_at: created, updated_at: created,
    confirmed_at: created, arrived_at: created, started_at: null, collection_started_at: null,
    collection_finished_at: null, finished_at: null, exited_at: null,
    history: [makeEvent('SOLICITADO', 'Solicitação enviada pelo paciente.'), makeEvent('AGUARDANDO_CONFIRMACAO', 'Solicitação aprovada.'), makeEvent('AGENDADO', 'Agendamento confirmado para hoje.'), makeEvent('NA_ESPERA', 'Chegada registrada na recepção.')]
  }
  const joao = {
    id: 'demo-appointment-1025', ticket_number: 'A1025', patient_id: 'demo-patient-joao', patient_user_id: 'demo-patient-joao',
    full_name: 'João Santos', cpf: '11144477735', birth_date: '1979-07-23', email: 'joao@example.local', phone: '(11) 98888-1025',
    payment_type: 'PARTICULAR', exams: ['TSH'], desired_date: today(), desired_time: '09:30', notes: '', staff_note: null,
    document_path: null, status: 'SOLICITADO', attendant_id: null, created_at: created, updated_at: created,
    arrived_at: null, history: [makeEvent('SOLICITADO', 'Solicitação enviada pelo paciente.')]
  }
  const ana = {
    id: 'demo-appointment-1026', ticket_number: 'A1026', patient_id: 'demo-patient-ana', patient_user_id: 'demo-patient-ana',
    full_name: 'Ana Oliveira', cpf: '93541134780', birth_date: '1992-11-03', email: 'ana@example.local', phone: '(11) 97777-1026',
    payment_type: 'CONVENIO', exams: ['Colesterol'], desired_date: today(), desired_time: '10:00', notes: '', staff_note: null,
    document_path: null, status: 'AGENDADO', attendant_id: null, created_at: created, updated_at: created,
    confirmed_at: created, arrived_at: null, history: [makeEvent('SOLICITADO', 'Solicitação enviada pelo paciente.'), makeEvent('AGUARDANDO_CONFIRMACAO', 'Solicitação aprovada.'), makeEvent('AGENDADO', 'Agendamento confirmado.')]
  }
  return {
    nextTicket: 1027,
    appointments: [maria, joao, ana],
    notifications: [{ id: 'demo-notification-1', user_id: PATIENT_ID, appointment_id: maria.id, title: 'Agendamento confirmado', message: 'Sua visita está confirmada para hoje às 09:00.', is_read: false, created_at: created }],
    legacyTickets: [
      { id: 'demo-ticket-1', number: `${yesterday().slice(2).replaceAll('-', '')}-SP001`, type: 'SP', status: 'ATENDIDA', issued_at: `${yesterday()}T08:10:00`, first_call_at: `${yesterday()}T08:14:00`, started_at: `${yesterday()}T08:15:00`, finished_at: `${yesterday()}T08:22:00`, counter: 1, attendant_id: STAFF_ID, call_count: 1 },
      { id: 'demo-ticket-2', number: `${today().slice(2).replaceAll('-', '')}-SE001`, type: 'SE', status: 'AGUARDANDO', issued_at: now(), first_call_at: null, counter: null, attendant_id: null, call_count: 0 },
      { id: 'demo-ticket-3', number: `${today().slice(2).replaceAll('-', '')}-SG001`, type: 'SG', status: 'AGUARDANDO', issued_at: now(), first_call_at: null, counter: null, attendant_id: null, call_count: 0 }
    ],
    users: demoAccounts.map(account => ({ ...account.user, active: true, created_at: created }))
  }
}

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return initialState()
  try { return JSON.parse(raw) } catch { return initialState() }
}
function saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return state }
function clone(value) { return JSON.parse(JSON.stringify(value)) }
function bodyData(body) {
  if (!body) return {}
  if (body instanceof FormData) return Object.fromEntries(body.entries())
  try { return JSON.parse(body) } catch { return {} }
}
function currentUser(token) {
  const [, id, role] = String(token || '').split(':')
  return { id, role }
}
function appointmentFor(state, id) { return state.appointments.find(item => item.id === id || item.ticket_number === id) }
function pushEvent(item, status, note) {
  item.status = status
  item.updated_at = now()
  item.history ||= []
  item.history.push(makeEvent(status, note))
}
function notify(state, item, title, message) {
  state.notifications.unshift({ id: crypto.randomUUID(), user_id: item.patient_user_id, appointment_id: item.id, title, message, is_read: false, created_at: now() })
}
function mapListItem(item) { const { history, ...rest } = item; return rest }

export function demoLogin(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const account = demoAccounts.find(item => item.email === normalizedEmail)
  if (!account) return null
  if (account.password !== password) throw new Error('Credenciais inválidas para a conta de demonstração.')
  return { token: `demo:${account.user.id}:${account.user.role}`, user: account.user, demo: true }
}

export async function demoRequest(path, options, token) {
  const { id: userId, role } = currentUser(token)
  const url = new URL(path, 'http://demo.local')
  const route = url.pathname
  const method = options.method || 'GET'
  const data = bodyData(options.body)
  const state = getState()
  const clinicStaff = ['ATENDENTE', 'GESTOR', 'ADMINISTRADOR'].includes(role)
  const admin = ['GESTOR', 'ADMINISTRADOR'].includes(role)
  const patientOwns = item => item?.patient_user_id === userId
  const requireStaff = () => { if (!clinicStaff) throw new Error('Perfil sem permissão para esta operação.') }
  const requireAdmin = () => { if (!admin) throw new Error('Perfil sem permissão para esta operação.') }
  const getAppointment = id => {
    const item = appointmentFor(state, id)
    if (!item) throw new Error('Solicitação não encontrada.')
    if (role === 'PACIENTE' && !patientOwns(item)) throw new Error('Você não tem acesso a esta solicitação.')
    return item
  }
  const applyTransition = (id, allowed, status, note, timestamp, extra = {}) => {
    const item = appointmentFor(state, id)
    if (!item) throw new Error('Solicitação não encontrada.')
    if (!allowed.includes(item.status)) throw new Error(`A solicitação não pode avançar de ${item.status}.`)
    Object.assign(item, extra)
    if (timestamp) item[timestamp] = now()
    pushEvent(item, status, note)
    notify(state, item, 'Atualização da solicitação', note)
    saveState(state)
    return { appointment: clone(item) }
  }

  if (route === '/health') return { status: 'ok', database: 'demo-local' }
  if (route === '/appointments/mine') return { appointments: clone(state.appointments.filter(patientOwns).sort((a,b) => b.created_at.localeCompare(a.created_at))) }
  if (route === '/patient/notifications') return { notifications: clone(state.notifications.filter(item => item.user_id === userId)) }
  const readMatch = route.match(/^\/patient\/notifications\/([^/]+)\/read$/)
  if (readMatch && method === 'PATCH') {
    const alert = state.notifications.find(item => item.id === readMatch[1] && item.user_id === userId)
    if (alert) alert.is_read = true
    saveState(state)
    return { success: true }
  }
  if (route === '/appointments' && method === 'POST') {
    if (role !== 'PACIENTE') throw new Error('Esta ação é exclusiva para pacientes.')
    const exams = typeof data.exams === 'string' ? JSON.parse(data.exams) : data.exams
    if (!exams?.length) throw new Error('Informe ao menos um exame.')
    const account = demoAccounts.find(item => item.user.id === userId)
    const appointment = {
      id: crypto.randomUUID(), ticket_number: `A${state.nextTicket++}`, patient_id: userId, patient_user_id: userId,
      full_name: data.fullName, cpf: String(data.cpf).replace(/\D/g, ''), birth_date: data.birthDate,
      email: data.email, phone: data.phone, payment_type: data.paymentType, exams,
      desired_date: data.desiredDate, desired_time: data.desiredTime, notes: data.notes || '', staff_note: null,
      document_path: data.medicalOrder?.name || null, status: 'SOLICITADO', attendant_id: null,
      created_at: now(), updated_at: now(), history: []
    }
    pushEvent(appointment, 'SOLICITADO', 'Solicitação enviada pelo paciente.')
    state.appointments.unshift(appointment)
    saveState(state)
    return { appointment: { id: appointment.id, ticketNumber: appointment.ticket_number, status: appointment.status }, message: 'Solicitação criada com sucesso.' }
  }
  const documentMatch = route.match(/^\/appointments\/([^/]+)\/document$/)
  if (documentMatch) {
    const item = getAppointment(documentMatch[1])
    if (!item.document_path) throw new Error('Nenhum documento foi anexado.')
    return new Blob(['Arquivo de demonstração do pedido médico.'], { type: 'application/pdf' })
  }
  const appointmentMatch = route.match(/^\/appointments\/([^/]+)$/)
  if (appointmentMatch) return { appointment: clone(getAppointment(appointmentMatch[1])) }

  if (route === '/staff/dashboard') {
    requireStaff()
    const todays = state.appointments.filter(item => item.created_at.slice(0,10) === today() || item.arrived_at?.slice(0,10) === today())
    return {
      waiting: state.appointments.filter(item => item.status === 'NA_ESPERA').length,
      in_service: state.appointments.filter(item => ['CHAMADO','EM_ATENDIMENTO','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO'].includes(item.status)).length,
      in_collection: state.appointments.filter(item => item.status === 'EM_COLETA').length,
      finished: todays.filter(item => item.status === 'CONCLUIDO').length,
      pending: state.appointments.filter(item => ['SOLICITADO','AGUARDANDO_CONFIRMACAO'].includes(item.status)).length
    }
  }
  if (route === '/staff/queue') {
    requireStaff()
    return { patients: clone(state.appointments.filter(item => ['NA_ESPERA','CHAMADO','EM_ATENDIMENTO','EM_COLETA','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO'].includes(item.status)).sort((a,b) => (a.arrived_at || '').localeCompare(b.arrived_at || '')).map(mapListItem)) }
  }
  if (route === '/staff/requests') {
    requireStaff()
    return { appointments: clone(state.appointments.filter(item => ['SOLICITADO','AGUARDANDO_CONFIRMACAO'].includes(item.status)).map(mapListItem)) }
  }
  if (route === '/staff/search') {
    requireStaff()
    const query = String(url.searchParams.get('q') || '').trim().toLowerCase()
    const digits = query.replace(/\D/g, '')
    const appointments = state.appointments.filter(item => !query || item.ticket_number.toLowerCase() === query ||
      item.full_name.toLowerCase().includes(query) || item.cpf.includes(digits) || item.birth_date === query ||
      item.birth_date.split('-').reverse().join('/') === query)
    return { appointments: clone(appointments.map(mapListItem)) }
  }
  if (route === '/staff/queue/call-next' && method === 'POST') {
    requireStaff()
    if (state.appointments.some(item => item.attendant_id === userId && ['CHAMADO','EM_ATENDIMENTO','EM_COLETA','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO'].includes(item.status))) {
      throw new Error('Conclua seu atendimento atual antes de chamar outro paciente.')
    }
    const item = state.appointments.filter(row => row.status === 'NA_ESPERA').sort((a,b) => (a.arrived_at || '').localeCompare(b.arrived_at || ''))[0]
    if (!item) throw new Error('Não há pacientes aguardando.')
    item.attendant_id = userId
    pushEvent(item, 'CHAMADO', 'Paciente chamado para atendimento.')
    notify(state, item, 'É sua vez', 'Dirija-se ao guichê para iniciar o atendimento.')
    saveState(state)
    return { appointment: clone(item) }
  }

  const staffAction = route.match(/^\/staff\/appointments\/([^/]+)\/(.+)$/)
  if (staffAction && method === 'POST') {
    requireStaff()
    const [, id, action] = staffAction
    const note = data.note || data.staffNote
    if (action === 'approve') return applyTransition(id, ['SOLICITADO'], 'AGUARDANDO_CONFIRMACAO', 'Solicitação aprovada; aguardando confirmação do agendamento.')
    if (action === 'confirm') return applyTransition(id, ['AGUARDANDO_CONFIRMACAO'], 'AGENDADO', 'Agendamento confirmado.', 'confirmed_at', { desired_date: data.desiredDate, desired_time: data.desiredTime })
    if (action === 'arrive') return applyTransition(id, ['AGENDADO'], 'NA_ESPERA', 'Chegada registrada na recepção.', 'arrived_at')
    if (action === 'start') return applyTransition(id, ['CHAMADO'], 'EM_ATENDIMENTO', 'Atendimento iniciado.', 'started_at')
    if (action === 'collection/start') return applyTransition(id, ['EM_ATENDIMENTO'], 'EM_COLETA', 'Coleta iniciada.', 'collection_started_at')
    if (action === 'collection/finish') return applyTransition(id, ['EM_COLETA'], 'COLETA_REALIZADA', 'Coleta realizada.', 'collection_finished_at')
    if (action === 'finish') return applyTransition(id, ['COLETA_REALIZADA'], 'ATENDIMENTO_FINALIZADO', note || 'Atendimento finalizado.', 'finished_at', { staff_note: note || null })
    if (action === 'exit') return applyTransition(id, ['ATENDIMENTO_FINALIZADO'], 'CONCLUIDO', 'Saída do paciente registrada.', 'exited_at')
    if (action === 'no-show') return applyTransition(id, ['AGENDADO'], 'FALTOU', 'Paciente não compareceu.')
    if (action === 'cancel') return applyTransition(id, ['SOLICITADO','AGUARDANDO_CONFIRMACAO','AGENDADO'], 'CANCELADO', note || 'Solicitação cancelada.')
  }

  if (route === '/reports/clinic') {
    requireAdmin()
    const completed = state.appointments.filter(item => item.status === 'CONCLUIDO')
    const current = state.appointments
    return {
      total: current.length, completed: completed.length,
      no_show: current.filter(item => item.status === 'FALTOU').length,
      cancelled: current.filter(item => item.status === 'CANCELADO').length,
      exams_completed: completed.reduce((sum,item) => sum + item.exams.length, 0),
      average_wait_minutes: 8, average_service_minutes: 20, average_stay_minutes: 34,
      current_flow: {
        arrived: current.filter(item => item.arrived_at).length,
        waiting: current.filter(item => item.status === 'NA_ESPERA').length,
        in_service: current.filter(item => ['CHAMADO','EM_ATENDIMENTO','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO'].includes(item.status)).length,
        in_collection: current.filter(item => item.status === 'EM_COLETA').length,
        exited: completed.length
      }, by_attendant: [{ name: 'Atendente Demo', completed: completed.length }]
    }
  }
  if (route === '/reports/summary') {
    requireAdmin()
    const tickets = state.legacyTickets
    return { emitted: tickets.length, attended: tickets.filter(item => item.status === 'ATENDIDA').length,
      abandoned: tickets.filter(item => item.status === 'NAO_COMPARECEU').length, average_minutes: 7,
      by_type: { SP: { emitted: 1, attended: 1 }, SE: { emitted: 1, attended: 0 }, SG: { emitted: 1, attended: 0 } } }
  }
  if (route === '/reports/tickets') { requireAdmin(); return { tickets: clone(state.legacyTickets) } }
  if (route === '/reports/audit') { requireAdmin(); return { audit: [] } }
  if (route === '/users' && method === 'GET') { requireAdmin(); return { users: clone(state.users) } }
  if (route === '/users' && method === 'POST') {
    requireAdmin()
    const user = { id: crypto.randomUUID(), name: data.name, email: data.email, role: data.role || 'ATENDENTE', active: true, created_at: now() }
    state.users.push(user); saveState(state); return user
  }

  if (route === '/queue') {
    const waiting = state.legacyTickets.filter(item => item.status === 'AGUARDANDO')
    const history = state.legacyTickets.filter(item => item.first_call_at).sort((a,b) => b.first_call_at.localeCompare(a.first_call_at)).slice(0,5)
    return { waiting: clone(waiting), current: clone(history[0] || null), history: clone(history) }
  }
  if (route === '/tickets' && method === 'POST') {
    const ticket = { id: crypto.randomUUID(), number: `${today().slice(2).replaceAll('-','')}-${data.type}001`, type: data.type, status: 'AGUARDANDO', issued_at: now() }
    state.legacyTickets.unshift(ticket); saveState(state); return { ticket }
  }
  if (route === '/calls/next' && method === 'POST') {
    const ticket = state.legacyTickets.find(item => item.status === 'AGUARDANDO')
    if (!ticket) throw new Error('Não há senhas aguardando atendimento.')
    Object.assign(ticket, { status: 'CHAMADA', first_call_at: now(), counter: Number(data.counter), attendant_id: userId, call_count: 1 })
    saveState(state); return { ticket: clone(ticket) }
  }
  const legacyMatch = route.match(/^\/(calls|tickets)\/([^/]+)\/(repeat|start|finish)$/)
  if (legacyMatch && method === 'POST') {
    const ticket = state.legacyTickets.find(item => item.id === legacyMatch[2])
    if (!ticket) throw new Error('Senha não encontrada.')
    const action = legacyMatch[3]
    const status = action === 'repeat' ? 'CHAMADA_NOVAMENTE' : action === 'start' ? 'EM_ATENDIMENTO' : 'ATENDIDA'
    Object.assign(ticket, { status, ...(action === 'start' ? { started_at: now() } : {}), ...(action === 'finish' ? { finished_at: now() } : {}) })
    saveState(state); return { ticket: clone(ticket) }
  }
  throw new Error(`Rota de demonstração ainda não implementada: ${method} ${route}`)
}
