import { useState } from 'react'
import { lerValorEmReais } from '../utils/validacao.js'

/**
 * Formulário de filtros da vitrine. Só aplica (muda a URL) ao clicar em "Filtrar",
 * depois de validar os valores. Para recarregar com novos valores da URL, o pai troca a "key".
 */
export default function Filtros({ valores, bairros, onAplicar, onLimpar }) {
  const [campos, setCampos] = useState({
    bairro: valores.bairro,
    finalidade: valores.finalidade,
    min: valores.min,
    max: valores.max,
  })
  const [erros, setErros] = useState({})

  function alterar(evento) {
    const { name, value } = evento.target
    setCampos((c) => ({ ...c, [name]: value }))
    if (erros[name] || erros.faixa) setErros({})
  }

  function enviar(evento) {
    evento.preventDefault()
    const min = lerValorEmReais(campos.min, 'Valor mínimo')
    const max = lerValorEmReais(campos.max, 'Valor máximo')
    const novos = {}
    if (min.erro) novos.min = min.erro
    if (max.erro) novos.max = max.erro
    if (!novos.min && !novos.max && min.valor != null && max.valor != null && min.valor > max.valor) {
      novos.faixa = 'O valor mínimo não pode ser maior que o máximo.'
    }
    setErros(novos)
    if (Object.keys(novos).length) return

    onAplicar({
      bairro: campos.bairro,
      finalidade: campos.finalidade,
      min: min.valor != null ? String(min.valor) : '',
      max: max.valor != null ? String(max.valor) : '',
    })
  }

  const temFiltro = Boolean(valores.bairro || valores.finalidade || valores.min || valores.max)
  const erroFaixa = erros.min || erros.max || erros.faixa

  return (
    <form className="filtros" onSubmit={enviar} noValidate aria-label="Filtrar imóveis">
      <div className="campo">
        <label htmlFor="filtro-bairro">Bairro</label>
        <select
          id="filtro-bairro"
          name="bairro"
          value={campos.bairro}
          onChange={alterar}
          disabled={bairros.status !== 'ok'}
        >
          <option value="">
            {bairros.status === 'carregando' ? 'Carregando…' : bairros.status === 'erro' ? 'Indisponível' : 'Todos'}
          </option>
          {bairros.lista.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.nome}
              {b.cidade ? ` (${b.cidade})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="filtro-finalidade">Finalidade</label>
        <select id="filtro-finalidade" name="finalidade" value={campos.finalidade} onChange={alterar}>
          <option value="">Venda e aluguel</option>
          <option value="VENDA">Venda</option>
          <option value="ALUGUEL">Aluguel</option>
        </select>
      </div>

      <fieldset className={`campo filtros__faixa ${erroFaixa ? 'campo--erro' : ''}`}>
        <legend>Faixa de preço (R$)</legend>
        <div className="filtros__faixa-campos">
          <input
            name="min"
            inputMode="decimal"
            placeholder="Mínimo"
            aria-label="Valor mínimo"
            value={campos.min}
            onChange={alterar}
            aria-invalid={Boolean(erros.min || erros.faixa)}
            aria-describedby={erroFaixa ? 'faixa-erro' : undefined}
          />
          <span aria-hidden="true">a</span>
          <input
            name="max"
            inputMode="decimal"
            placeholder="Máximo"
            aria-label="Valor máximo"
            value={campos.max}
            onChange={alterar}
            aria-invalid={Boolean(erros.max || erros.faixa)}
            aria-describedby={erroFaixa ? 'faixa-erro' : undefined}
          />
        </div>
        {erroFaixa && (
          <p id="faixa-erro" className="campo__erro">
            {erroFaixa}
          </p>
        )}
      </fieldset>

      <div className="filtros__acoes">
        <button type="submit" className="botao">
          Filtrar
        </button>
        {temFiltro && (
          <button type="button" className="botao botao--secundario" onClick={onLimpar}>
            Limpar
          </button>
        )}
      </div>
    </form>
  )
}
