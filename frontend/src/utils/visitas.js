const CHAVE = 'imobiliaria.visitas'
const CHAVE_SESSAO = 'imobiliaria.visita-contada'
let contagem = null

/**
 * Contador de visitas à moda antiga, mas honesto: conta as visitas DESTE navegador
 * (uma por sessão), guardadas no localStorage. Sem armazenamento disponível, mostra 1.
 */
export function contarVisita() {
  if (contagem !== null) return contagem
  try {
    let n = Number(localStorage.getItem(CHAVE)) || 0
    if (!sessionStorage.getItem(CHAVE_SESSAO)) {
      n += 1
      localStorage.setItem(CHAVE, String(n))
      sessionStorage.setItem(CHAVE_SESSAO, '1')
    }
    contagem = Math.max(n, 1)
  } catch {
    contagem = 1
  }
  return contagem
}
