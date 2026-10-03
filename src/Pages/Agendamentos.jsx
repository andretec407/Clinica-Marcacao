import { useState, useEffect } from 'react'
import { getStorageData, setStorageData, STORAGE_KEYS } from '../utils/storage'
import initialData from '../data/initialData.json'

export function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [convenios, setConvenios] = useState([])
  const [formData, setFormData] = useState({
    paciente: '',
    cpf: '',
    exame: '',
    data: '',
    hora: '',
    convenio: 'Particular'
  })
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    setAgendamentos(getStorageData(STORAGE_KEYS.AGENDAMENTOS, initialData.agendamentos))
    setConvenios(getStorageData(STORAGE_KEYS.CONVENIOS, initialData.convenios).filter(c => c.ativo))
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.paciente || !formData.cpf || !formData.exame || !formData.data || !formData.hora) {
      setMensagem('Preencha todos os campos obrigatórios!')
      return
    }

    const novo = {
      id: Date.now().toString(),
      ...formData,
      status: 'Agendado'
    }

    const listaAtualizada = [novo, ...agendamentos]
    setAgendamentos(listaAtualizada)
    setStorageData(STORAGE_KEYS.AGENDAMENTOS, listaAtualizada)
    setMensagem('Agendamento realizado com sucesso!')

    setFormData({ paciente: '', cpf: '', exame: '', data: '', hora: '', convenio: 'Particular' })
    setTimeout(() => setMensagem(''), 4000)
  }

  return (
    <div className="page container">
      <h2>📅 Agendamento de Exames</h2>
      <p>Preencha os dados abaixo para marcar sua coleta de análises clínicas.</p>

      {mensagem && <div className="alert-box">{mensagem}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome do Paciente *</label>
          <input
            type="text"
            value={formData.paciente}
            onChange={(e) => setFormData({ ...formData, paciente: e.target.value })}
            placeholder="Ex: Carlos Eduardo"
            required
          />
        </div>

        <div className="form-group">
          <label>CPF *</label>
          <input
            type="text"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
            required
          />
        </div>

        <div className="form-group">
          <label>Exame Desejado *</label>
          <input
            type="text"
            value={formData.exame}
            onChange={(e) => setFormData({ ...formData, exame: e.target.value })}
            placeholder="Ex: Hemograma, Colesterol, TSH"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Data *</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Horário *</label>
            <input
              type="time"
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Convênio</label>
            <select
              value={formData.convenio}
              onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
            >
              {convenios.map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Confirmar Agendamento</button>
      </form>
    </div>
  )
}