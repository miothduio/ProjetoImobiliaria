import { useState } from 'react'
import { mensagemDeErro } from '../services/api.js'
import { prepararContrato } from '../services/contratosService.js'
import { formatarMoeda } from '../utils/imovel.js'
import { rotuloTipoOferta } from '../utils/situacoes.js'

const LIMITE_BYTES = 10 * 1024 * 1024

/**
 * Corretor prepara o contrato de uma oferta aceita:
 * gera o PDF pelo sistema (padrão) ou envia um PDF pronto.
 * O contrato vai para "aguardando aprovação" do administrador.
 */
export default function FormPrepararContrato({ oferta, onPreparado, onFechar }) {
  const [modo, setModo] = useState('gerar')
  const [arquivo, setArquivo] = useState(null)
  const [tentou, setTentou] = useState(false)
  const [estado, setEstado] = useState({ enviando: false, erro: null })

  const erroArquivo =
    modo !== 'enviar'
      ? null
      : !arquivo
        ? 'Escolha o arquivo PDF do contrato.'
        : !/\.pdf$/i.test(arquivo.name) && arquivo.type !== 'application/pdf'
          ? 'O arquivo precisa ser um PDF.'
          : arquivo.size > LIMITE_BYTES
            ? 'O PDF pode ter no máximo 10 MB.'
            : null

  async function enviar(evento) {
    evento.preventDefault()
    setTentou(true)
    if (erroArquivo) return
    setEstado({ enviando: true, erro: null })
    try {
      onPreparado(await prepararContrato(oferta.id, modo === 'enviar' ? arquivo : null))
    } catch (error) {
      setEstado({ enviando: false, erro: mensagemDeErro(error, 'Não foi possível preparar o contrato.') })
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <p>
        Oferta nº {oferta.id} de <strong>{oferta.cliente?.nome}</strong>: {rotuloTipoOferta(oferta.tipo).toLowerCase()} de{' '}
        <strong>{oferta.imovel?.titulo}</strong> por {formatarMoeda(oferta.valor)}
        {oferta.tipo === 'ALUGUEL' && '/mês'}.
      </p>

      <fieldset className="campo">
        <legend>PDF do contrato</legend>
        <label className="opcao">
          <input type="radio" name="modo" checked={modo === 'gerar'} onChange={() => setModo('gerar')} />
          Gerar automaticamente com os dados da oferta
        </label>
        <label className="opcao">
          <input type="radio" name="modo" checked={modo === 'enviar'} onChange={() => setModo('enviar')} />
          Enviar um PDF pronto
        </label>
      </fieldset>

      {modo === 'enviar' && (
        <div className={`campo ${tentou && erroArquivo ? 'campo--erro' : ''}`}>
          <label htmlFor="contrato-arquivo">Arquivo (PDF, até 10 MB)</label>
          <input id="contrato-arquivo" type="file" accept="application/pdf,.pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          {tentou && erroArquivo && <p className="campo__erro">{erroArquivo}</p>}
        </div>
      )}

      <p className="dica">Depois de preparado, o contrato espera a aprovação do administrador; só então o cliente pode assinar.</p>

      {estado.erro && (
        <p className="alerta alerta--erro" role="alert">
          {estado.erro}
        </p>
      )}
      <div className="formulario__acoes">
        <button type="submit" className="botao botao--destaque" disabled={estado.enviando}>
          {estado.enviando ? 'Preparando…' : 'Preparar contrato'}
        </button>
        <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={estado.enviando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
