import {demoLogin,demoRequest} from './demoApi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
	const token = localStorage.getItem('nassau_token')
	if (path === '/auth/login') {
		const credentials = JSON.parse(options.body || '{}')
		const demo = demoLogin(credentials.email, credentials.password)
		if (demo) return demo
	}
	if (token?.startsWith('demo:')) return demoRequest(path, options, token)

	const headers = { ...(options.headers || {}) }
	if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
	if (token) headers.Authorization = `Bearer ${token.replace(/^demo:/, '')}`

	const response = await fetch(`${API_URL}${path}`, { ...options, headers })
	const data = response.headers.get('content-type')?.includes('application/json')
		? await response.json()
		: await response.blob()
	if (!response.ok) throw new Error(data.message || 'Não foi possível concluir a operação.')
	return data
}

export const api = {
	login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
	registerPatient: profile => request('/auth/register', { method: 'POST', body: JSON.stringify(profile) }),
	queue: () => request('/queue'),
	emitTicket: type => request('/tickets', { method: 'POST', body: JSON.stringify({ type }) }),
	next: counter => request('/calls/next', { method: 'POST', body: JSON.stringify({ counter }) }),
	repeat: id => request(`/calls/${id}/repeat`, { method: 'POST' }),
	start: id => request(`/tickets/${id}/start`, { method: 'POST' }),
	finish: id => request(`/tickets/${id}/finish`, { method: 'POST' }),
	dashboard: period => request(`/reports/summary${period ? `?period=${period}` : ''}`),
	clinicReport: period => request(`/reports/clinic?period=${period || 'day'}`),
	tickets: q => request(`/reports/tickets${q ? `?${q}` : ''}`),
	audit: () => request('/reports/audit'),
	users: () => request('/users'),
	createUser: payload => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
	appointments: () => request('/appointments/mine'),
	appointment: id => request(`/appointments/${id}`),
	createAppointment: ({ values, medicalOrder }) => {
		const body = new FormData()
		for (const [key, value] of Object.entries(values)) body.append(key, Array.isArray(value) ? JSON.stringify(value) : value)
		if (medicalOrder) body.append('medicalOrder', medicalOrder)
		return request('/appointments', { method: 'POST', body })
	},
	notifications: () => request('/patient/notifications'),
	markNotificationRead: id => request(`/patient/notifications/${id}/read`, { method: 'PATCH' }),
	downloadDocument: id => request(`/appointments/${id}/document`),
	staffDashboard: () => request('/staff/dashboard'),
	staffQueue: () => request('/staff/queue'),
	staffRequests: () => request('/staff/requests'),
	searchPatients: query => request(`/staff/search?q=${encodeURIComponent(query)}`),
	callNextPatient: () => request('/staff/queue/call-next', { method: 'POST' }),
	approveRequest: id => request(`/staff/appointments/${id}/approve`, { method: 'POST' }),
	confirmAppointment: (id, desiredDate, desiredTime) => request(`/staff/appointments/${id}/confirm`, {
		method: 'POST', body: JSON.stringify({ desiredDate, desiredTime })
	}),
	arrivePatient: id => request(`/staff/appointments/${id}/arrive`, { method: 'POST' }),
	startConsultation: id => request(`/staff/appointments/${id}/start`, { method: 'POST' }),
	startCollection: id => request(`/staff/appointments/${id}/collection/start`, { method: 'POST' }),
	finishCollection: id => request(`/staff/appointments/${id}/collection/finish`, { method: 'POST' }),
	finishConsultation: (id, staffNote) => request(`/staff/appointments/${id}/finish`, {
		method: 'POST', body: JSON.stringify({ staffNote })
	}),
	registerExit: id => request(`/staff/appointments/${id}/exit`, { method: 'POST' }),
	markNoShow: id => request(`/staff/appointments/${id}/no-show`, { method: 'POST' }),
	cancelAppointment: (id, note) => request(`/staff/appointments/${id}/cancel`, {
		method: 'POST', body: JSON.stringify({ note })
	}),
	health: () => request('/health')
}
