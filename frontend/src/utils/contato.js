import { localizacao, rotuloFinalidade, valorPrincipal } from './imovel.js'

/** E-mail que recebe os contatos. Configure em .env.local (VITE_EMAIL_IMOBILIARIA). */
export const EMAIL_IMOBILIARIA = import.meta.env.VITE_EMAIL_IMOBILIARIA || 'contato@imobiliaria.com.br'

function mailto(assunto, corpo) {
  return `mailto:${EMAIL_IMOBILIARIA}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
}

/**
 * Assunto e mensagem iniciais do contato sobre um imóvel (código, tipo, bairro, valor).
 * Vão pré-preenchidos no formulário e o cliente pode editar tudo antes de enviar.
 */
export function rascunhoContatoImovel(imovel) {
  const tipo = imovel.tipoImovel?.nome || 'Imóvel'
  const { valor, sufixo } = valorPrincipal(imovel)
  const finalidade = rotuloFinalidade(imovel.finalidade)

  const assunto = `Interesse no imóvel cód. ${imovel.id} (${tipo})`
  const mensagem = [
    'Olá! Tenho interesse no imóvel abaixo e gostaria de mais informações.',
    '',
    `Código: ${imovel.id}`,
    `Imóvel: ${imovel.titulo || '-'}`,
    `Tipo: ${tipo}`,
    `Bairro: ${localizacao(imovel) || '-'}`,
    finalidade ? `Finalidade: ${finalidade}` : null,
    `Valor: ${valor ? `${valor}${sufixo}` : 'sob consulta'}`,
  ]
    .filter((linha) => linha !== null)
    .join('\n')

  return { assunto, mensagem }
}

export const RASCUNHO_CONTATO_GERAL = {
  assunto: 'Contato pelo site',
  mensagem: 'Olá! Gostaria de falar com a imobiliária.',
}

/** Alternativa: abrir o programa de e-mail do computador com o mesmo texto. */
export function linkMailto({ assunto, mensagem }) {
  return mailto(assunto, mensagem)
}
