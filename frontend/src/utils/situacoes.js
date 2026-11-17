/** Rótulos e cores das situações de ofertas e contratos (iguais aos enums do backend). */

export const SITUACOES_OFERTA = [
  { valor: 'PENDENTE', rotulo: 'Pendente', tom: 'atencao' },
  { valor: 'ACEITA', rotulo: 'Aceita', tom: 'ok' },
  { valor: 'EM_ESPERA', rotulo: 'Em espera', tom: 'info' },
  { valor: 'RECUSADA', rotulo: 'Recusada', tom: 'erro' },
  { valor: 'CANCELADA', rotulo: 'Cancelada', tom: 'neutro' },
]

export const SITUACOES_CONTRATO = [
  { valor: 'AGUARDANDO_APROVACAO', rotulo: 'Aguardando aprovação', tom: 'atencao' },
  { valor: 'AGUARDANDO_ASSINATURA', rotulo: 'Aguardando assinatura', tom: 'info' },
  { valor: 'ASSINADO', rotulo: 'Assinado', tom: 'ok' },
  { valor: 'RECUSADO', rotulo: 'Recusado', tom: 'erro' },
  { valor: 'CANCELADO', rotulo: 'Cancelado', tom: 'neutro' },
]

/** O que cada situação quer dizer, para o cliente entender a lista sem perguntar. */
export const EXPLICACAO_OFERTA = {
  PENDENTE: 'Aguardando a resposta do corretor.',
  ACEITA: 'Aceita! O imóvel está reservado para você e o contrato está sendo preparado.',
  EM_ESPERA: 'Outra oferta foi aceita. Se aquele negócio não fechar, a sua volta para a fila.',
  RECUSADA: 'Não foi aceita. Você pode fazer outra oferta se o imóvel estiver disponível.',
  CANCELADA: 'Cancelada.',
}

export const EXPLICACAO_CONTRATO = {
  AGUARDANDO_APROVACAO: 'O corretor preparou o contrato e a administração está revisando.',
  AGUARDANDO_ASSINATURA: 'Aprovado! Confira o PDF e assine.',
  ASSINADO: 'Assinado. Negócio fechado!',
  RECUSADO: 'A administração pediu ajustes; um novo contrato será preparado.',
  CANCELADO: 'Cancelado. O imóvel voltou a ficar disponível.',
}

function buscar(lista, valor) {
  return lista.find((s) => s.valor === valor) ?? { valor, rotulo: valor ?? '—', tom: 'neutro' }
}

export const situacaoOferta = (valor) => buscar(SITUACOES_OFERTA, valor)
export const situacaoContrato = (valor) => buscar(SITUACOES_CONTRATO, valor)

export function rotuloTipoOferta(tipo) {
  return tipo === 'ALUGUEL' ? 'Aluguel' : tipo === 'VENDA' ? 'Compra' : tipo
}

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** "17/11/2026 19:40" (o Spring manda sem fuso: o navegador lê como horário local) */
export function formatarDataHora(valor) {
  if (!valor) return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : dataHora.format(data)
}
