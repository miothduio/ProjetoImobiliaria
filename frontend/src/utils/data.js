const dia = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** createdAt do Spring vem sem fuso ("2026-11-10T19:46:00"): o navegador lê como horário local. */
function ler(valor) {
  if (!valor) return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

/** "terça-feira, 10 de novembro de 2026" */
export function diaPorExtenso(valor) {
  const data = ler(valor)
  return data ? dia.format(data) : null
}

/** "19:46" */
export function horaCurta(valor) {
  const data = ler(valor)
  return data ? hora.format(data) : null
}

/** Chave para agrupar posts do mesmo dia. */
export function chaveDoDia(valor) {
  const data = ler(valor)
  return data ? `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}` : 'sem-data'
}

/** Corta o texto no fim de uma palavra, com reticências. */
export function resumo(texto, limite = 180) {
  const limpo = (texto ?? '').replace(/\s+/g, ' ').trim()
  if (limpo.length <= limite) return limpo
  return `${limpo.slice(0, limpo.lastIndexOf(' ', limite)).replace(/[,.;:]$/, '')}…`
}
