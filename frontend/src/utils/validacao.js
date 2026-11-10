/** Mesmo critério simples de formato usado pelos navegadores: algo@algo.algo, sem espaços. */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarEmail(valor) {
  const email = (valor ?? '').trim()
  if (!email) return 'Informe o e-mail.'
  if (!FORMATO_EMAIL.test(email)) return 'Digite um e-mail válido, como nome@exemplo.com.'
  return null
}

export function validarObrigatorio(valor, mensagem) {
  return (valor ?? '').toString().trim() ? null : mensagem
}

/**
 * Converte o texto digitado num valor em reais. Aceita "350000", "350.000" e "350.000,50".
 * Devolve { valor: number|null, erro: string|null }.
 */
export function lerValorEmReais(texto, rotulo) {
  const limpo = (texto ?? '').toString().trim().replace(/^R\$\s*/i, '')
  if (!limpo) return { valor: null, erro: null }

  // formato brasileiro: ponto de milhar e vírgula decimal
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo.replace(/\.(?=\d{3}(\D|$))/g, '')
  const valor = Number(normalizado)

  if (!Number.isFinite(valor)) return { valor: null, erro: `${rotulo}: digite só números.` }
  if (valor < 0) return { valor: null, erro: `${rotulo} não pode ser negativo.` }
  return { valor, erro: null }
}

/** Telefone opcional: se preenchido, precisa ter DDD (10 a 13 dígitos, aceita +55). */
export function validarTelefoneOpcional(valor) {
  const digitos = (valor ?? '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length < 10 || digitos.length > 13) return 'Digite o telefone com DDD, como (55) 99999-0000.'
  return null
}
