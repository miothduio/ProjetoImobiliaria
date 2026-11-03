import api from './api.js'

/** GET /imoveis — público, sem token. */
export async function listarImoveis() {
  const { data } = await api.get('/imoveis')
  return Array.isArray(data) ? data : []
}

/** GET /fotos/imovel/{id} — público. Fotos em ordem; cada uma traz "url" e "capa". */
export async function listarFotosDoImovel(imovelId) {
  const { data } = await api.get(`/fotos/imovel/${imovelId}`)
  return Array.isArray(data) ? data : []
}
