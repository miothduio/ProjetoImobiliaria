import { useId } from 'react'

/**
 * Gráficos do painel feitos com HTML e CSS (sem biblioteca), seguindo:
 * - barras finas, ponta arredondada e base reta, valor na ponta;
 * - texto sempre na cor do texto (a cor da barra só identifica);
 * - dica (tooltip) ao passar o mouse ou focar com o teclado;
 * - tabela com os mesmos números em "Ver tabela" (acessível e para impressão).
 */

const formatar = (n) => Number(n).toLocaleString('pt-BR')
const porcentagem = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)

/** Junta o que passar de "maximo" em uma barra "Outros", para o gráfico não virar uma lista enorme. */
function limitar(dados, maximo) {
  if (dados.length <= maximo) return dados
  const visiveis = dados.slice(0, maximo - 1)
  const resto = dados.slice(maximo - 1)
  return [...visiveis, { chave: '__outros', rotulo: `Outros (${resto.length})`, total: resto.reduce((s, d) => s + d.total, 0) }]
}

function Tabela({ dados, rotuloCategoria, rotuloValor }) {
  const total = dados.reduce((s, d) => s + d.total, 0)
  return (
    <details className="grafico__tabela">
      <summary>Ver tabela</summary>
      <table className="ficha">
        <thead>
          <tr>
            <th scope="col">{rotuloCategoria}</th>
            <th scope="col">{rotuloValor}</th>
            <th scope="col">%</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.chave}>
              <th scope="row">{d.rotulo}</th>
              <td>{formatar(d.total)}</td>
              <td>{porcentagem(d.total, total)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

/** Barras horizontais de uma série só (cada barra é uma categoria). */
export function BarrasHorizontais({ titulo, subtitulo, dados, rotuloCategoria = 'Categoria', rotuloValor = 'Total', maximo = 8, vazio }) {
  const id = useId()
  const linhas = limitar(dados, maximo)
  const maior = Math.max(1, ...linhas.map((d) => d.total))
  const total = dados.reduce((s, d) => s + d.total, 0)

  return (
    <figure className="grafico" aria-labelledby={`${id}-titulo`}>
      <figcaption>
        <h2 id={`${id}-titulo`} className="grafico__titulo">
          {titulo}
        </h2>
        {subtitulo && <p className="grafico__subtitulo">{subtitulo}</p>}
      </figcaption>
      {total === 0 ? (
        <p className="grafico__vazio">{vazio ?? 'Ainda não há dados.'}</p>
      ) : (
        <>
          <ul className="barras">
            {linhas.map((d) => (
              <li
                key={d.chave}
                className="barras__linha"
                tabIndex={0}
                aria-label={`${d.rotulo}: ${formatar(d.total)} (${porcentagem(d.total, total)}%)`}
              >
                <span className="barras__rotulo" aria-hidden="true">
                  {d.rotulo}
                </span>
                <span className="barras__trilho" aria-hidden="true">
                  {d.total > 0 && <span className="barras__barra" style={{ width: `${(d.total / maior) * 100}%` }} />}
                  <span className="barras__valor">{formatar(d.total)}</span>
                </span>
                <span className="grafico__dica" role="tooltip">
                  <strong>{d.rotulo}</strong>
                  <br />
                  {formatar(d.total)} · {porcentagem(d.total, total)}% do total
                </span>
              </li>
            ))}
          </ul>
          <Tabela dados={dados} rotuloCategoria={rotuloCategoria} rotuloValor={rotuloValor} />
        </>
      )}
    </figure>
  )
}

/**
 * Barra única dividida em partes (partes de um todo). As cores seguem a CATEGORIA
 * (mapa "cores"), nunca a posição, para não trocarem quando um valor zera.
 */
export function BarraSegmentada({ titulo, subtitulo, dados, cores, rotuloCategoria = 'Categoria', rotuloValor = 'Total', vazio }) {
  const id = useId()
  const total = dados.reduce((s, d) => s + d.total, 0)
  const partes = dados.filter((d) => d.total > 0)

  return (
    <figure className="grafico" aria-labelledby={`${id}-titulo`}>
      <figcaption>
        <h2 id={`${id}-titulo`} className="grafico__titulo">
          {titulo}
        </h2>
        {subtitulo && <p className="grafico__subtitulo">{subtitulo}</p>}
      </figcaption>
      {total === 0 ? (
        <p className="grafico__vazio">{vazio ?? 'Ainda não há dados.'}</p>
      ) : (
        <>
          <div className="segmentos" role="list">
            {partes.map((d) => (
              <span
                key={d.chave}
                role="listitem"
                tabIndex={0}
                className="segmentos__parte"
                style={{ flexGrow: d.total, background: cores[d.chave] ?? 'var(--serie-neutra)' }}
                aria-label={`${d.rotulo}: ${formatar(d.total)} (${porcentagem(d.total, total)}%)`}
              >
                <span className="grafico__dica" role="tooltip">
                  <strong>{d.rotulo}</strong>
                  <br />
                  {formatar(d.total)} · {porcentagem(d.total, total)}%
                </span>
              </span>
            ))}
          </div>
          <ul className="legenda">
            {dados.map((d) => (
              <li key={d.chave}>
                <span className="legenda__amostra" style={{ background: cores[d.chave] ?? 'var(--serie-neutra)' }} aria-hidden="true" />
                {d.rotulo}: <strong>{formatar(d.total)}</strong> <span className="legenda__pct">({porcentagem(d.total, total)}%)</span>
              </li>
            ))}
          </ul>
          <Tabela dados={dados} rotuloCategoria={rotuloCategoria} rotuloValor={rotuloValor} />
        </>
      )}
    </figure>
  )
}
