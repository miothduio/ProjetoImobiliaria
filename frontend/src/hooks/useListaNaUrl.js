import { useSearchParams } from 'react-router-dom'

/**
 * Filtro de situação e página guardados na URL (?status=PENDENTE&pagina=2).
 * "pagina" aqui começa em 1 (é o que aparece para a pessoa); a API usa a partir de 0.
 */
export function useListaNaUrl() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const pagina = Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1)

  function atualizar(mudancas) {
    const novos = new URLSearchParams(params)
    Object.entries(mudancas).forEach(([chave, valor]) => {
      if (valor === '' || valor == null || (chave === 'pagina' && valor === 1)) novos.delete(chave)
      else novos.set(chave, String(valor))
    })
    setParams(novos)
  }

  return {
    status,
    pagina,
    filtrar: (novo) => atualizar({ status: novo, pagina: 1 }),
    irPara: (n) => {
      atualizar({ pagina: n })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  }
}
