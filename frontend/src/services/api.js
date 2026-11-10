import axios from 'axios'
import { avisarSessaoExpirada, tokenExpirado } from '../auth/sessao.js'

/** Endereço do backend. Configure em .env.local (VITE_API_URL). */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

export const TOKEN_KEY = 'imobiliaria.token'

/** Guarda o JWT no navegador. try/catch: o localStorage pode estar bloqueado. */
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* sem armazenamento disponível */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* sem armazenamento disponível */
    }
  },
}

/** Instância única do axios usada por todos os services. */
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Toda requisição sai com "Authorization: Bearer <token>" quando há usuário logado.
// Token já vencido não é enviado: é apagado aqui e a aplicação é avisada para deslogar.
// (Detalhe do backend: nas rotas PÚBLICAS um token vencido é simplesmente ignorado e a
// resposta é 200, então o front não pode depender só do 401 para perceber a expiração.)
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    if (tokenExpirado(token)) {
      tokenStorage.clear()
      avisarSessaoExpirada()
    } else {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 401 numa rota protegida = sem token, token inválido/expirado ou usuário apagado:
// apaga o token e avisa a aplicação (o AuthProvider desloga e as rotas protegidas mandam para o login).
// As rotas /public/* ficam de fora: no login, 401 significa "e-mail ou senha inválidos".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const rotaPublica = (error.config?.url || '').startsWith('/public/')
    if (error.response?.status === 401 && !rotaPublica) {
      tokenStorage.clear()
      avisarSessaoExpirada()
    }
    return Promise.reject(error)
  },
)

/**
 * Converte qualquer erro do axios numa frase amigável (nunca mostra JSON na tela).
 * O backend devolve { mensagem: "..." } nas regras de negócio.
 */
export function mensagemDeErro(error, padrao = 'Algo deu errado. Tente novamente.') {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return 'O servidor demorou demais para responder. Tente novamente.'
    }
    if (error?.request) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão ou se o backend está rodando.'
    }
    return error?.message || padrao
  }

  const { status, data } = error.response
  const mensagemBackend = typeof data === 'object' && data ? data.mensagem : null

  switch (status) {
    case 400:
      return mensagemBackend || 'Confira os dados informados.'
    case 401:
      return 'Sua sessão expirou. Entre novamente.'
    case 403:
      return 'Acesso negado. Seu perfil não tem permissão para esta ação.'
    case 404:
      return mensagemBackend || 'Item não encontrado.'
    case 409:
      return mensagemBackend || 'A operação conflita com uma regra do sistema.'
    case 502:
    case 503:
      return mensagemBackend || 'Serviço temporariamente indisponível. Tente novamente em instantes.'
    default:
      return status >= 500 ? 'O servidor encontrou um problema. Tente novamente em instantes.' : padrao
  }
}

/** true quando a requisição foi cancelada de propósito (ex.: o usuário trocou de página). */
export function foiCancelada(error) {
  return axios.isCancel(error)
}

/** Monta a URL completa de um arquivo servido pelo backend (ex.: "/uploads/3/foto.png"). */
export function urlDoBackend(caminho) {
  if (!caminho) return null
  if (/^https?:\/\//.test(caminho)) return caminho
  return `${API_URL}${caminho.startsWith('/') ? '' : '/'}${caminho}`
}

export default api
