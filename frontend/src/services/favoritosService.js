import api from './api.js'

/** GET /favoritos -> imóveis (resumo) do cliente, mais recentes primeiro */
export async function listarFavoritos({ signal } = {}) {
  const { data } = await api.get('/favoritos', { signal })
  return Array.isArray(data) ? data : []
}

/** GET /favoritos/ids -> [3, 8, 12] */
export async function idsFavoritos() {
  const { data } = await api.get('/favoritos/ids')
  return Array.isArray(data) ? data : []
}

/** POST /favoritos/{id} (idempotente) */
export async function adicionarFavorito(imovelId) {
  await api.post(`/favoritos/${imovelId}`)
}

/** DELETE /favoritos/{id} (idempotente) */
export async function removerFavorito(imovelId) {
  await api.delete(`/favoritos/${imovelId}`)
}
