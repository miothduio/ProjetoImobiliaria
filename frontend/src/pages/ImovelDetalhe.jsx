import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Carregando, MensagemErro, SemResultados } from '../components/Feedback.jsx'
import { foiCancelada, mensagemDeErro, urlDoBackend } from '../services/api.js'
import { buscarImovel, listarFotosDoImovel } from '../services/imoveisService.js'
import Dialogo from '../components/Dialogo.jsx'
import FormContato from '../components/FormContato.jsx'
import { rascunhoContatoImovel } from '../utils/contato.js'
import { diaPorExtenso, horaCurta } from '../utils/data.js'
import {
  estaDisponivel,
  formatarArea,
  formatarMoeda,
  listaCaracteristicas,
  localizacaoCompleta,
  normalizar,
  rotuloFinalidade,
  rotuloStatus,
  valorPrincipal,
} from '../utils/imovel.js'

function Galeria({ fotos, titulo }) {
  const [atual, setAtual] = useState(0)
  const [falhas, setFalhas] = useState({})
  const validas = fotos.filter((f) => f.url && !falhas[f.id])
  const foto = validas[Math.min(atual, validas.length - 1)]

  if (!foto) {
    return (
      <div className="galeria galeria--vazia" aria-label="Imóvel sem fotos">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M12 30 32 14l20 16v20a2 2 0 0 1-2 2H39V38H25v14H14a2 2 0 0 1-2-2z" />
        </svg>
        <p>Sem fotos cadastradas</p>
      </div>
    )
  }

  const marcarFalha = (id) => setFalhas((f) => ({ ...f, [id]: true }))

  return (
    <div className="galeria">
      <div className="galeria__principal">
        <img
          src={urlDoBackend(foto.url)}
          alt={`${titulo} – foto ${validas.indexOf(foto) + 1} de ${validas.length}`}
          onError={() => marcarFalha(foto.id)}
        />
      </div>
      {validas.length > 1 && (
        <ul className="galeria__miniaturas" aria-label="Fotos do imóvel">
          {validas.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={f === foto ? 'true' : undefined}
              >
                <img src={urlDoBackend(f.url)} alt="" loading="lazy" onError={() => marcarFalha(f.id)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Ficha({ imovel }) {
  const itens = [
    ['Código', imovel.id],
    ['Dormitórios', imovel.dormitorios],
    ['Banheiros', imovel.banheiros],
    ['Vagas de garagem', imovel.garagem],
    ['Área construída', formatarArea(imovel.areaConstruida)],
    ['Área total', formatarArea(imovel.areaTotal)],
  ].filter(([, valor]) => valor != null && valor !== '')

  return (
    <table className="ficha">
      <caption>Ficha do imóvel</caption>
      <tbody>
        {itens.map(([rotulo, valor]) => (
          <tr key={rotulo}>
            <th scope="row">{rotulo}</th>
            <td>{valor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ImovelDetalhe() {
  const { id } = useParams()
  const location = useLocation()
  const voltar = `/${location.state?.voltar ?? ''}`

  const [tentativa, setTentativa] = useState(0)
  const [contatoAberto, setContatoAberto] = useState(false)
  const chaveAtual = `${id}#${tentativa}`
  const [resposta, setResposta] = useState({ chave: null, status: 'carregando', imovel: null, fotos: [], erro: null })

  useEffect(() => {
    const controle = new AbortController()
    const chave = `${id}#${tentativa}`
    const opcoes = { signal: controle.signal }

    Promise.all([buscarImovel(id, opcoes), listarFotosDoImovel(id, opcoes).catch(() => [])])
      .then(([imovel, fotos]) => setResposta({ chave, status: 'ok', imovel, fotos, erro: null }))
      .catch((error) => {
        if (foiCancelada(error)) return
        // 404 = não existe; 400 = id que não é número (ex.: /imoveis/abc)
        const naoExiste = error.response?.status === 404 || error.response?.status === 400
        setResposta({ chave, status: naoExiste ? 'nao-encontrado' : 'erro', imovel: null, fotos: [], erro: mensagemDeErro(error) })
      })

    return () => controle.abort()
  }, [id, tentativa])

  const { imovel, fotos, erro } = resposta
  const status = resposta.chave === chaveAtual ? resposta.status : 'carregando'

  if (status === 'carregando') return <Carregando texto="Carregando imóvel…" />
  if (status === 'erro') return <MensagemErro mensagem={erro} onTentarNovamente={() => setTentativa((n) => n + 1)} />
  if (status === 'nao-encontrado' || !imovel) {
    return (
      <SemResultados titulo="Imóvel não encontrado">
        Ele pode ter sido removido. <Link to="/">Ver outros imóveis</Link>
      </SemResultados>
    )
  }

  const titulo = imovel.titulo || 'Imóvel sem título'
  const { valor, sufixo } = valorPrincipal(imovel)
  const finalidade = rotuloFinalidade(imovel.finalidade)
  const disponivel = estaDisponivel(imovel)
  const situacao = rotuloStatus(imovel.status)
  const caracteristicas = listaCaracteristicas(imovel.caracteristicas)

  // mostra o "outro" preço quando o imóvel tem os dois (venda e aluguel)
  const mostrandoAluguel = sufixo === '/mês'
  const outroPreco = mostrandoAluguel ? imovel.precoVenda : imovel.precoAluguel
  const fin = normalizar(imovel.finalidade)
  const mostrarOutro = outroPreco != null && fin !== 'VENDA' && fin !== 'ALUGUEL'

  const dia = diaPorExtenso(imovel.createdAt)
  const hora = horaCurta(imovel.createdAt)

  return (
    <article className="detalhe">
      <p className="detalhe__voltar">
        <Link to={voltar}>« Voltar para os imóveis</Link>
      </p>

      {dia && <h2 className="dia__data">{dia}</h2>}

      <header className="detalhe__cabecalho">
        <h1>{titulo}</h1>
        <p className="detalhe__local">
          {[imovel.tipoImovel?.nome, localizacaoCompleta(imovel)].filter(Boolean).join(' em ')}
        </p>
      </header>

      <Galeria key={imovel.id} fotos={fotos} titulo={titulo} />

      <div className="caixa-preco">
        <div>
          <p className="detalhe__preco">
            {valor ? (
              <>
                {valor}
                {sufixo && <small>{sufixo}</small>}
              </>
            ) : (
              <span className="post__consulte">Valor sob consulta</span>
            )}
          </p>
          {mostrarOutro && (
            <p className="detalhe__outro-preco">
              ou {formatarMoeda(outroPreco)}
              {mostrandoAluguel ? ' para comprar' : '/mês para alugar'}
            </p>
          )}
          <p className="detalhe__selos">
            {finalidade && <span className="selo">{finalidade}</span>}
            {situacao && <span className={`status ${disponivel ? 'status--ok' : 'status--indisponivel'}`}>{situacao}</span>}
          </p>
        </div>
        <div className="caixa-preco__acao">
          <button type="button" className="botao botao--destaque" onClick={() => setContatoAberto(true)}>
            Entrar em contato
          </button>
          <p className="dica">A mensagem já vem com os dados deste imóvel e você pode editar tudo antes de enviar.</p>
        </div>
      </div>

      {!disponivel && <p className="alerta alerta--atencao">Este imóvel não está disponível para novas ofertas.</p>}

      <Ficha imovel={imovel} />

      {imovel.descricao && (
        <section className="detalhe__secao">
          <h2>Sobre o imóvel</h2>
          <p className="detalhe__descricao">{imovel.descricao}</p>
        </section>
      )}

      {caracteristicas.length > 0 && (
        <section className="detalhe__secao">
          <h2>Características</h2>
          <ul className="lista-caracteristicas">
            {caracteristicas.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="post__rodape">
        Postado por <strong>Imobiliária</strong>
        {hora && <> às {hora}</>}
        <span aria-hidden="true"> | </span>
        Cód. {imovel.id}
      </p>

      <Dialogo aberto={contatoAberto} onFechar={() => setContatoAberto(false)} titulo="Entrar em contato">
        <p className="dialogo__sobre">
          Sobre: <strong>{titulo}</strong> (cód. {imovel.id})
        </p>
        <FormContato imovel={imovel} rascunho={rascunhoContatoImovel(imovel)} onFechar={() => setContatoAberto(false)} />
      </Dialogo>
    </article>
  )
}
