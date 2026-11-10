import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOKEN_KEY, tokenStorage } from '../services/api.js'
import { buscarUsuarioLogado, login } from '../services/authService.js'
import { AuthContext } from './contexto.js'
import { EVENTO_SESSAO_EXPIRADA, sessaoDoToken } from './sessao.js'

const AVISOS = {
  expirada: { tipo: 'expirada', texto: 'Sua sessão expirou. Entre novamente para continuar.' },
  logout: { tipo: 'logout', texto: 'Você saiu da sua conta.' },
}

// O maior atraso aceito pelo setTimeout (~24 dias); acima disso ele dispara na hora.
const ATRASO_MAXIMO = 2_147_483_647

function estadoInicial() {
  const token = tokenStorage.get()
  const sessao = sessaoDoToken(token)
  if (token && !sessao) {
    // havia token salvo, mas expirou enquanto o site estava fechado
    tokenStorage.clear()
    return { sessao: null, usuario: null, aviso: AVISOS.expirada }
  }
  return { sessao, usuario: null, aviso: null }
}

function reducer(estado, acao) {
  switch (acao.tipo) {
    case 'entrou':
      return { sessao: acao.sessao, usuario: null, aviso: null }
    case 'usuario':
      // ignora resposta atrasada de uma sessão que já acabou
      return estado.sessao?.token === acao.token ? { ...estado, usuario: acao.usuario } : estado
    case 'saiu':
      if (!estado.sessao) return estado
      return { sessao: null, usuario: null, aviso: AVISOS[acao.motivo] ?? null }
    case 'limparAviso':
      return estado.aviso ? { ...estado, aviso: null } : estado
    default:
      return estado
  }
}

/**
 * Guarda quem está logado e cuida do ciclo de vida do token:
 * - login: salva o token e lê o perfil do payload
 * - expiração: desloga sozinho quando o "exp" do token chega
 * - 401 do backend (interceptor do axios): desloga
 * - logout em outra aba: desloga aqui também
 */
export default function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial)
  const navigate = useNavigate()
  const { sessao } = estado

  // 401 vindo de qualquer requisição protegida
  useEffect(() => {
    const aoExpirar = () => dispatch({ tipo: 'saiu', motivo: 'expirada' })
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar)
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar)
  }, [])

  // Desloga no instante em que o token expira (o backend só avisaria na próxima chamada protegida)
  useEffect(() => {
    if (!sessao) return undefined
    const atraso = Math.min(Math.max(sessao.expiraEm - Date.now(), 0), ATRASO_MAXIMO)
    const id = setTimeout(() => {
      tokenStorage.clear()
      dispatch({ tipo: 'saiu', motivo: 'expirada' })
    }, atraso)
    return () => clearTimeout(id)
  }, [sessao])

  // Nome do usuário (GET /me). Também confirma com o backend que o token salvo ainda vale:
  // se não valer, a resposta é 401 e o interceptor desloga.
  useEffect(() => {
    if (!sessao) return
    buscarUsuarioLogado()
      .then((usuario) => dispatch({ tipo: 'usuario', token: sessao.token, usuario }))
      .catch(() => {
        // sem nome: o menu mostra o e-mail do token
      })
  }, [sessao])

  // Login/logout feito em outra aba do navegador
  useEffect(() => {
    function aoMudarStorage(evento) {
      if (evento.key !== TOKEN_KEY) return
      const nova = sessaoDoToken(evento.newValue)
      if (nova) dispatch({ tipo: 'entrou', sessao: nova })
      else dispatch({ tipo: 'saiu', motivo: 'logout' })
    }
    window.addEventListener('storage', aoMudarStorage)
    return () => window.removeEventListener('storage', aoMudarStorage)
  }, [])

  /** Faz o login e devolve a sessão. Erros do axios sobem para a tela tratar. */
  const entrar = useCallback(async (email, senha) => {
    const token = await login(email, senha)
    const nova = sessaoDoToken(token)
    if (!nova) throw new Error('O servidor devolveu um token inválido.')
    tokenStorage.set(token)
    dispatch({ tipo: 'entrou', sessao: nova })
    return nova
  }, [])

  /** Logout: apaga o token e leva para o login. */
  const sair = useCallback(() => {
    tokenStorage.clear()
    navigate('/login', { replace: true })
    dispatch({ tipo: 'saiu', motivo: 'logout' })
  }, [navigate])

  const limparAviso = useCallback(() => dispatch({ tipo: 'limparAviso' }), [])

  const valor = useMemo(
    () => ({ ...estado, entrar, sair, limparAviso }),
    [estado, entrar, sair, limparAviso],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
