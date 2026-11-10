import { Link } from 'react-router-dom'
import { useAuth } from '../auth/contexto.js'
import { ROTA_INICIAL } from '../auth/sessao.js'

export default function AcessoNegado() {
  const { sessao } = useAuth()
  const inicio = sessao ? ROTA_INICIAL[sessao.perfil] : '/'

  return (
    <div className="feedback feedback--erro" role="alert">
      <p className="feedback__titulo">Acesso negado</p>
      <p className="feedback__texto">Seu perfil não tem permissão para abrir esta página.</p>
      <Link to={inicio} className="botao">
        Ir para minha área
      </Link>
    </div>
  )
}
