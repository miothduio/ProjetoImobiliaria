import api from './api.js'

// o envio passa pelo servidor de e-mail (SMTP), que pode levar alguns segundos
const OPCOES = { timeout: 30000 }

/**
 * POST /imoveis/{id}/contato  { nome, email, telefone?, assunto, mensagem }
 * A API envia para a caixa da imobiliária, com "responder para" no e-mail do cliente.
 */
export async function enviarContatoImovel(imovelId, dados) {
  const { data } = await api.post(`/imoveis/${imovelId}/contato`, dados, OPCOES)
  return data
}

/** POST /contato — contato geral, sem imóvel. */
export async function enviarContatoGeral(dados) {
  const { data } = await api.post('/contato', dados, OPCOES)
  return data
}
