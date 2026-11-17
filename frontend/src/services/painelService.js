import api from './api.js'

/**
 * GET /painel (ADMIN e CORRETOR)
 * { totais: { imoveis, imoveisDisponiveis, ofertasPendentes, contratosAguardandoAprovacao,
 *             contratosAguardandoAssinatura, contratosAssinados },
 *   imoveisPorBairro, ofertasPorSituacao, imoveisPorFinalidade, imoveisPorStatus: [{ chave, rotulo, total }] }
 */
export async function buscarPainel({ signal } = {}) {
  const { data } = await api.get('/painel', { signal })
  return data
}
