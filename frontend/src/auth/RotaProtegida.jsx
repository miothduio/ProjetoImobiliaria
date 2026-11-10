import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AcessoNegado from '../pages/AcessoNegado.jsx'
import { useAuth } from './contexto.js'

/**
 * Protege um grupo de rotas.
 * - Sem login (ou token expirado): vai para /login e, depois de entrar, volta para cá.
 * - Logado com outro perfil: mostra "Acesso negado" (digitar /admin na URL como cliente não abre o painel).
 */
export default function RotaProtegida({ perfil }) {
  const { sessao } = useAuth()
  const location = useLocation()

  if (!sessao) {
    return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />
  }

  if (perfil && sessao.perfil !== perfil) {
    return <AcessoNegado />
  }

  return <Outlet />
}
