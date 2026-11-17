import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AcessoNegado from '../pages/AcessoNegado.jsx'
import { useAuth } from './contexto.js'

/**
 * Protege um grupo de rotas.
 * - Sem login (ou token expirado): vai para /login e, depois de entrar, volta para cá
 *   (menos depois de um logout, quando o próximo login pode ser de outra pessoa).
 * - Logado com outro perfil: mostra "Acesso negado" (digitar /admin na URL como cliente não abre o painel).
 * "perfis" aceita um perfil ou uma lista (ex.: [ADMIN, CORRETOR]).
 */
export default function RotaProtegida({ perfis }) {
  const { sessao, aviso } = useAuth()
  const location = useLocation()

  if (!sessao) {
    // depois de clicar em "Sair" não guarda a página: o próximo login pode ser de outra pessoa
    const voltarPara = aviso?.tipo === 'logout' ? undefined : { de: location.pathname + location.search }
    return <Navigate to="/login" replace state={voltarPara} />
  }

  const permitidos = perfis == null ? null : [].concat(perfis)
  if (permitidos && !permitidos.includes(sessao.perfil)) {
    return <AcessoNegado />
  }

  return <Outlet />
}
