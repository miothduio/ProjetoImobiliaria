import axios from 'axios'

/** Endereço do backend. Configure em .env.local (VITE_API_URL). */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

const TOKEN_KEY = 'imobiliaria.token'

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

// Toda requisição sai com "Authorization: Bearer <token>" quando há usuário logado
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 com token salvo = sessão expirada/inválida: apaga o token e avisa a aplicação
// (o redirecionamento para o login entra junto com a tela de login).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStorage.get()) {
      tokenStorage.clear()
      window.dispatchEvent(new CustomEvent('sessao-expirada'))
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
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
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
    default:
      return status >= 500 ? 'O servidor encontrou um problema. Tente novamente em instantes.' : padrao
  }
}

/** Monta a URL completa de um arquivo servido pelo backend (ex.: "/uploads/3/foto.png"). */
export function urlDoBackend(caminho) {
  if (!caminho) return null
  if (/^https?:\/\//.test(caminho)) return caminho
  return `${API_URL}${caminho.startsWith('/') ? '' : '/'}${caminho}`
}

export default api
