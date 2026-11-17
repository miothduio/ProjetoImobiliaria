import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensagemDeErro } from '../services/api.js'
import { fazerOferta } from '../services/ofertasService.js'
import { formatarMoeda, tiposDeOferta, valorParaCampo } from '../utils/imovel.js'
import { rotuloTipoOferta } from '../utils/situacoes.js'
import { lerValorEmReais } from '../utils/validacao.js'

const LIMITE_MENSAGEM = 1000

/**
 * Formulário "Fazer oferta" (dentro da janela do detalhe do imóvel).
 * Valida antes de enviar: tipo, valor numérico maior que zero e tamanho da mensagem.
 * Regras de negócio (imóvel reservado, oferta repetida) chegam como 409 e aparecem aqui.
 */
export default function FormOferta({ imovel, onEnviada, onFechar }) {
  const tipos = tiposDeOferta(imovel)
  const [tipo, setTipo] = useState(tipos[0] ?? '')
  const [valores, setValores] = useState({
    VENDA: valorParaCampo(imovel.precoVenda),
    ALUGUEL: valorParaCampo(imovel.precoAluguel),
  })
  const [mensagem, setMensagem] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [estado, setEstado] = useState({ status: 'editando', erro: null, oferta: null })

  const textoValor = valores[tipo] ?? ''
  const lido = lerValorEmReais(textoValor, 'Valor')
  const erros = {
    tipo: tipo ? null : 'Escolha se a oferta é para alugar ou comprar.',
    valor: lido.erro || (lido.valor == null ? 'Informe o valor da oferta.' : lido.valor <= 0 ? 'O valor precisa ser maior que zero.' : null),
    mensagem: mensagem.length > LIMITE_MENSAGEM ? `A mensagem pode ter no máximo ${LIMITE_MENSAGEM} caracteres.` : null,
  }
  const mostrar = (campo) => (tentouEnviar ? erros[campo] : null)
  const precoAnunciado = tipo === 'ALUGUEL' ? imovel.precoAluguel : imovel.precoVenda

  async function enviar(evento) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.values(erros).some(Boolean)) return
    setEstado({ status: 'enviando', erro: null, oferta: null })
    try {
      const oferta = await fazerOferta({ imovelId: imovel.id, tipo, valor: lido.valor, mensagem: mensagem.trim() || null })
      setEstado({ status: 'enviada', erro: null, oferta })
      onEnviada?.(oferta)
    } catch (error) {
      setEstado({ status: 'editando', erro: mensagemDeErro(error, 'Não foi possível enviar a oferta.'), oferta: null })
    }
  }

  if (estado.status === 'enviada') {
    return (
      <div className="contato-enviado" role="status">
        <p className="contato-enviado__titulo">Oferta enviada!</p>
        <p>
          Sua proposta de {formatarMoeda(estado.oferta.valor)}
          {estado.oferta.tipo === 'ALUGUEL' ? '/mês' : ''} está <strong>pendente</strong>. O corretor responde por aqui e por
          e-mail.
        </p>
        <p className="formulario__acoes">
          <Link to="/cliente/ofertas" className="botao botao--destaque">
            Ver minhas ofertas
          </Link>
          <button type="button" className="botao botao--secundario" onClick={onFechar}>
            Fechar
          </button>
        </p>
      </div>
    )
  }

  if (tipos.length === 0) {
    return <p className="alerta alerta--atencao">Este imóvel não tem preço de venda nem de aluguel cadastrado. Use “Entrar em contato”.</p>
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {tipos.length > 1 ? (
        <fieldset className="campo">
          <legend>Você quer</legend>
          <div className="opcoes-linha">
            {tipos.map((t) => (
              <label key={t} className="opcao">
                <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} />
                {t === 'ALUGUEL' ? 'Alugar' : 'Comprar'}
              </label>
            ))}
          </div>
          {mostrar('tipo') && <p className="campo__erro">{erros.tipo}</p>}
        </fieldset>
      ) : (
        <p className="dica">
          Oferta de <strong>{rotuloTipoOferta(tipo).toLowerCase()}</strong>
          {tipo === 'ALUGUEL' ? ' (valor mensal)' : ''}.
        </p>
      )}

      <div className={`campo ${mostrar('valor') ? 'campo--erro' : ''}`}>
        <label htmlFor="oferta-valor">
          Valor proposto (R$){tipo === 'ALUGUEL' ? ' por mês' : ''}
        </label>
        <input
          id="oferta-valor"
          inputMode="decimal"
          value={textoValor}
          onChange={(e) => setValores((v) => ({ ...v, [tipo]: e.target.value }))}
          aria-invalid={Boolean(mostrar('valor'))}
          aria-describedby="oferta-valor-dica"
          placeholder="Ex.: 1.800,00"
        />
        <p id="oferta-valor-dica" className="dica">
          {precoAnunciado != null ? `Anunciado por ${formatarMoeda(precoAnunciado)}${tipo === 'ALUGUEL' ? '/mês' : ''}.` : 'Valor sob consulta.'}
        </p>
        {mostrar('valor') && <p className="campo__erro">{erros.valor}</p>}
      </div>

      <div className={`campo ${mostrar('mensagem') ? 'campo--erro' : ''}`}>
        <label htmlFor="oferta-mensagem">
          Mensagem para o corretor <span className="campo__opcional">(opcional)</span>
        </label>
        <textarea
          id="oferta-mensagem"
          rows={4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Ex.: posso dar 20% de entrada; preciso mudar em dezembro."
        />
        <span className={`campo__contador ${mensagem.length > LIMITE_MENSAGEM ? 'campo__contador--erro' : ''}`}>
          {mensagem.length}/{LIMITE_MENSAGEM}
        </span>
        {mostrar('mensagem') && <p className="campo__erro">{erros.mensagem}</p>}
      </div>

      {estado.erro && (
        <p className="alerta alerta--erro" role="alert">
          {estado.erro}
        </p>
      )}

      <div className="formulario__acoes">
        <button type="submit" className="botao botao--destaque" disabled={estado.status === 'enviando'}>
          {estado.status === 'enviando' ? 'Enviando…' : 'Enviar oferta'}
        </button>
        <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={estado.status === 'enviando'}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
