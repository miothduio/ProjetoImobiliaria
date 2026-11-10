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
 * outro valor (ex.: "Residencial", com os dois preços) -> o que estiver preenchido (venda primeiro).
 * "preferencia" (VENDA/ALUGUEL) vem do filtro da vitrine: quem filtrou por aluguel vê o aluguel.
 */
export function valorPrincipal(imovel, preferencia) {
  const finalidade = normalizar(imovel?.finalidade)
  const preferida = normalizar(preferencia)
  const venda = imovel?.precoVenda
  const aluguel = imovel?.precoAluguel
  const comoAluguel = { valor: formatarMoeda(aluguel), sufixo: '/mês' }
  const comoVenda = { valor: formatarMoeda(venda), sufixo: '' }

  if (preferida === 'ALUGUEL' && aluguel != null) return comoAluguel
  if (preferida === 'VENDA' && venda != null) return comoVenda
  if (finalidade === 'ALUGUEL' && aluguel != null) return comoAluguel
  if (venda != null) return comoVenda
  if (aluguel != null) return comoAluguel
  return { valor: null, sufixo: '' }
}

export function localizacao(imovel) {
  const bairro = imovel?.bairro?.nome
  const cidade = imovel?.bairro?.cidade
  return [bairro, cidade].filter(Boolean).join(', ')
}

const ROTULOS_STATUS = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
  ALUGADO: 'Alugado',
}

export function rotuloStatus(status) {
  const chave = normalizar(status)
  if (ROTULOS_STATUS[chave]) return ROTULOS_STATUS[chave]
  if (!chave) return null
  return chave.charAt(0) + chave.slice(1).toLowerCase()
}

/** Bairro, Cidade/UF (o banco tem estado como "- RS"; limpa o traço). */
export function localizacaoCompleta(imovel) {
  const bairro = imovel?.bairro?.nome
  const cidade = imovel?.bairro?.cidade
  const estado = (imovel?.bairro?.estado ?? '').replace(/^[\s-]+/, '').trim()
  const cidadeUf = [cidade, estado].filter(Boolean).join('/')
  return [bairro, cidadeUf].filter(Boolean).join(', ')
}

export function formatarArea(valor) {
  const numero = Number(valor)
  if (valor == null || !Number.isFinite(numero)) return null
  return `${numero.toLocaleString('pt-BR')} m²`
}

/** "Piscina, Churrasqueira, Jardim" -> ["Piscina", "Churrasqueira", "Jardim"] */
export function listaCaracteristicas(texto) {
  return (texto ?? '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}
