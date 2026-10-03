import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="page container text-center">
      <h2>404 - Página Não Encontrada</h2>
      <p>A página que você está tentando acessar não existe.</p>
      <Link to="/" className="btn btn-primary">Voltar ao Início</Link>
    </div>
  )
}