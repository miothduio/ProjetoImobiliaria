/** Números a mostrar: primeira, última e vizinhas da atual, com "…" nos buracos. */
function paginasVisiveis(atual, total) {
  const paginas = new Set([1, total, atual - 1, atual, atual + 1])
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const resultado = []
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push(`…${p}`)
    resultado.push(p)
  })
  return resultado
}

/** pagina começa em 1 (é o número que aparece na URL e para o usuário). */
export default function Paginacao({ pagina, totalPaginas, onIr }) {
  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacao" aria-label="Paginação">
      <button type="button" onClick={() => onIr(pagina - 1)} disabled={pagina <= 1}>
        « Anterior
      </button>

      <ol>
        {paginasVisiveis(pagina, totalPaginas).map((p) =>
          typeof p === 'string' ? (
            <li key={p} className="paginacao__reticencias" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onIr(p)}
                aria-current={p === pagina ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <button type="button" onClick={() => onIr(pagina + 1)} disabled={pagina >= totalPaginas}>
        Próxima »
      </button>
    </nav>
  )
}
