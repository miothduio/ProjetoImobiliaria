import api from './api.js'

/** GET /imoveis — público, lista completa (sem paginação). */
export async function listarImoveis() {
  const { data } = await api.get('/imoveis')
  return Array.isArray(data) ? data : []
}

/**
 * GET /imoveis/busca — público, usado pela vitrine.
 * filtros: { bairroId, finalidade, precoMin, precoMax, ordem, pagina (0..), tamanho }
 * Resposta: { conteudo, pagina, tamanho, totalElementos, totalPaginas }; cada imóvel traz "capaUrl".
 */
export async function buscarImoveis(filtros = {}, { signal } = {}) {
  // não manda parâmetros vazios
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== null && valor !== ''),
  )
  const { data } = await api.get('/imoveis/busca', { params, signal })
  return {
    conteudo: Array.isArray(data?.conteudo) ? data.conteudo : [],
    pagina: data?.pagina ?? 0,
    tamanho: data?.tamanho ?? 0,
    totalElementos: data?.totalElementos ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
  }
}

/** GET /imoveis/{id} — público. 404 (sem corpo) quando não existe. */
export async function buscarImovel(id, { signal } = {}) {
  const { data } = await api.get(`/imoveis/${id}`, { signal })
  return data
}

/** GET /fotos/imovel/{id} — público. Fotos em ordem; cada uma traz "url" e "capa". */
export async function listarFotosDoImovel(imovelId, { signal } = {}) {
  const { data } = await api.get(`/fotos/imovel/${imovelId}`, { signal })
  return Array.isArray(data) ? data : []
}

/** GET /bairros — público. */
export async function listarBairros() {
  const { data } = await api.get('/bairros')
  return Array.isArray(data) ? data : []
}
