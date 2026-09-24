import { useState, useEffect } from 'react'
import { getStorageData, setStorageData, STORAGE_KEYS } from '../utils/storage'
import initialData from '../data/initialData.json'

export function Convenios() {
  const [convenios, setConvenios] = useState([])
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')

  useEffect(() => {
    setConvenios(getStorageData(STORAGE_KEYS.CONVENIOS, initialData.convenios))
  }, [])

  function handleAdd(e) {
    e.preventDefault()
    if (!nome || !codigo) return

    const novo = { id: Date.now().toString(), nome, codigo, ativo: true }
    const listaAtualizada = [...convenios, novo]
    setConvenios(listaAtualizada)
    setStorageData(STORAGE_KEYS.CONVENIOS, listaAtualizada)

    setNome('')
    setCodigo('')
  }

  function toggleAtivo(id) {
    const listaAtualizada = convenios.map((c) =>
      c.id === id ? { ...c, ativo: !c.ativo } : c
    )
    setConvenios(listaAtualizada)
    setStorageData(STORAGE_KEYS.CONVENIOS, listaAtualizada)
  }

  return (
    <div className="page container">
      <h2>🏥 Cadastro de Convênios Operacionais</h2>
      <p>Gerencie os planos de saúde e convênios aceitos no laboratório.</p>

      <form className="form-card inline-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Nome do Convênio"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Código ANS/Interno"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">Cadastrar</button>
      </form>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {convenios.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.nome}</strong></td>
                <td>{c.codigo}</td>
                <td>{c.ativo ? '✅ Ativo' : '❌ Inativo'}</td>
                <td>
                  <button className="btn-sm btn-secondary" onClick={() => toggleAtivo(c.id)}>
                    {c.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}