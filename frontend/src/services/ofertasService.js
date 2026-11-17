import api from './api.js'

/** Tira do objeto os filtros vazios, para não mandar "status=" na URL. */
export function semVazios(filtros = {}) {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

/** Normaliza o PaginaDTO do backend: { conteudo, pagina (0..), tamanho, totalElementos, totalPaginas }. */
export function lerPagina(data) {
  return {
    conteudo: Array.isArray(data?.conteudo) ? data.conteudo : [],
    pagina: data?.pagina ?? 0,
    tamanho: data?.tamanho ?? 0,
    totalElementos: data?.totalElementos ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
  }
}

// ---------- Cliente ----------

/** POST /ofertas { imovelId, tipo: VENDA|ALUGUEL, valor, mensagem? } -> oferta. 409 = regra de negócio. */
export async function fazerOferta(dados) {
  const { data } = await api.post('/ofertas', dados)
  return data
}

/** GET /ofertas/minhas ?status=&imovelId=&pagina=&tamanho= */
export async function minhasOfertas(filtros = {}, { signal } = {}) {
  const { data } = await api.get('/ofertas/minhas', { params: semVazios(filtros), signal })
  return lerPagina(data)
}

/** PATCH /ofertas/{id}/cancelar (só pendente ou em espera) */
export async function cancelarOferta(id) {
  const { data } = await api.patch(`/ofertas/${id}/cancelar`)
  return data
}

// ---------- Corretor / Admin ----------

/** GET /ofertas ?status=&imovelId=&pagina=&tamanho= */
export async function listarOfertas(filtros = {}, { signal } = {}) {
  const { data } = await api.get('/ofertas', { params: semVazios(filtros), signal })
  return lerPagina(data)
}

/** PATCH /ofertas/{id}/aceitar: imóvel reservado, outras pendentes em espera */
export async function aceitarOferta(id) {
  const { data } = await api.patch(`/ofertas/${id}/aceitar`)
  return data
}

/** PATCH /ofertas/{id}/recusar */
export async function recusarOferta(id) {
  const { data } = await api.patch(`/ofertas/${id}/recusar`)
  return data
}
