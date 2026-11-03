/** "Disponível" -> "DISPONIVEL" (o banco tem os dois formatos). */
export function normalizar(texto) {
  return (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
}

export function estaDisponivel(imovel) {
  return normalizar(imovel?.status) === 'DISPONIVEL'
}

const ROTULOS_FINALIDADE = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
}

export function rotuloFinalidade(finalidade) {
  const chave = normalizar(finalidade)
  if (ROTULOS_FINALIDADE[chave]) return ROTULOS_FINALIDADE[chave]
  if (!chave) return null
  return chave.charAt(0) + chave.slice(1).toLowerCase()
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function formatarMoeda(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? moeda.format(numero) : null
}

/**
 * Valor a destacar no card, conforme a finalidade:
 * ALUGUEL -> preço do aluguel (/mês); VENDA -> preço de venda;
 * outro valor -> o que estiver preenchido (venda primeiro).
 */
export function valorPrincipal(imovel) {
  const finalidade = normalizar(imovel?.finalidade)
  const venda = imovel?.precoVenda
  const aluguel = imovel?.precoAluguel

  if (finalidade === 'ALUGUEL' && aluguel != null) {
    return { valor: formatarMoeda(aluguel), sufixo: '/mês' }
  }
  if (venda != null) return { valor: formatarMoeda(venda), sufixo: '' }
  if (aluguel != null) return { valor: formatarMoeda(aluguel), sufixo: '/mês' }
  return { valor: null, sufixo: '' }
}

export function localizacao(imovel) {
  const bairro = imovel?.bairro?.nome
  const cidade = imovel?.bairro?.cidade
  return [bairro, cidade].filter(Boolean).join(' · ')
}
