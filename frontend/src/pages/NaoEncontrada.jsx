import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <div className="feedback">
      <p className="feedback__titulo">Página não encontrada</p>
      <p className="feedback__texto">O endereço digitado não existe.</p>
      <Link to="/" className="botao">
        Ver imóveis
      </Link>
    </div>
  )
}
