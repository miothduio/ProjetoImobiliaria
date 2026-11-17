import api from './api.js'

/** GET /users — só ADMIN (USER recebe 403). Senha nunca vem na resposta. */
export async function listarUsuarios({ signal } = {}) {
  const { data } = await api.get('/users', { signal })
  return Array.isArray(data) ? data : []
}

/** POST /users { nome, email, senha, tipo: ADMIN|CORRETOR|USER } -> 201. 400 { mensagem } se o e-mail já existe. */
export async function criarUsuario(dados) {
  const { data } = await api.post('/users', dados)
  return data
}

/** PUT /users/{id} { nome, email, tipo, senha? } -> 204. Senha vazia mantém a atual. */
export async function alterarUsuario(id, dados) {
  await api.put(`/users/${id}`, dados)
}

/** DELETE /users/{id} -> 204. 409 se for a própria conta. */
export async function excluirUsuario(id) {
  await api.delete(`/users/${id}`)
}
