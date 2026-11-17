import api from './api.js'
import { lerPagina, semVazios } from './ofertasService.js'

// ---------- Corretor / Admin ----------

/**
 * POST /contratos (multipart): ofertaId + arquivo PDF opcional.
 * Sem arquivo, o backend gera o PDF a partir da oferta.
 */
export async function prepararContrato(ofertaId, arquivo) {
  const corpo = new FormData()
  corpo.append('ofertaId', ofertaId)
  if (arquivo) corpo.append('arquivo', arquivo)
  const { data } = await api.post('/contratos', corpo, { timeout: 60000 })
  return data
}

/** GET /contratos ?status=&pagina=&tamanho= */
export async function listarContratos(filtros = {}, { signal } = {}) {
  const { data } = await api.get('/contratos', { params: semVazios(filtros), signal })
  return lerPagina(data)
}

/** PATCH /contratos/{id}/aprovar (só ADMIN) */
export async function aprovarContrato(id) {
  const { data } = await api.patch(`/contratos/${id}/aprovar`)
  return data
}

/** PATCH /contratos/{id}/recusar { motivo } (só ADMIN) */
export async function recusarContrato(id, motivo) {
  const { data } = await api.patch(`/contratos/${id}/recusar`, { motivo })
  return data
}

/** PATCH /contratos/{id}/cancelar { motivo } (só ADMIN): o imóvel volta a ficar disponível */
export async function cancelarContrato(id, motivo) {
  const { data } = await api.patch(`/contratos/${id}/cancelar`, { motivo })
  return data
}

// ---------- Cliente ----------

/** GET /contratos/meus ?status=&pagina=&tamanho= */
export async function meusContratos(filtros = {}, { signal } = {}) {
  const { data } = await api.get('/contratos/meus', { params: semVazios(filtros), signal })
  return lerPagina(data)
}

/** PATCH /contratos/{id}/assinar { nome, aceite: true } */
export async function assinarContrato(id, nome) {
  const { data } = await api.patch(`/contratos/${id}/assinar`, { nome, aceite: true })
  return data
}

// ---------- PDF (dono ou equipe) ----------

/**
 * GET /contratos/{id}/pdf com o token (por isso não dá para usar um <a href> direto).
 * Abre o PDF numa aba nova; se o navegador bloquear o pop-up, baixa o arquivo.
 */
export async function abrirPdfDoContrato(id) {
  // a aba é aberta antes do await, senão o bloqueador de pop-ups barra
  const aba = window.open('', '_blank')
  try {
    const resposta = await api.get(`/contratos/${id}/pdf`, { responseType: 'blob', timeout: 60000 })
    const url = URL.createObjectURL(new Blob([resposta.data], { type: 'application/pdf' }))
    if (aba) {
      aba.location.href = url
    } else {
      const link = document.createElement('a')
      link.href = url
      link.download = nomeDoArquivo(resposta.headers['content-disposition']) || `contrato-${id}.pdf`
      link.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    aba?.close()
    // com responseType blob, o JSON do erro chega como Blob: converte para o mensagemDeErro ler
    if (error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        /* corpo não era JSON */
      }
    }
    throw error
  }
}

function nomeDoArquivo(disposicao) {
  const encontrado = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicao || '')
  return encontrado ? decodeURIComponent(encontrado[1]) : null
}
