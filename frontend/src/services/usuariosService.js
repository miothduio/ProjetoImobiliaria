import api from './api.js'

/** GET /users — só ADMIN (USER recebe 403). Senha nunca vem na resposta. */
export async function listarUsuarios() {
  const { data } = await api.get('/users')
  return Array.isArray(data) ? data : []
}
