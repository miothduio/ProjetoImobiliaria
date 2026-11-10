import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Filtros from '../components/Filtros.jsx'
import ImovelPost from '../components/ImovelPost.jsx'
import Paginacao from '../components/Paginacao.jsx'
import { Carregando, MensagemErro, SemResultados } from '../components/Feedback.jsx'
import { buscarImoveis, listarBairros } from '../services/imoveisService.js'
import { foiCancelada, mensagemDeErro } from '../services/api.js'
import { chaveDoDia, diaPorExtenso } from '../utils/data.js'

const POR_PAGINA = 9
const ORDENS = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'preco_asc', rotulo: 'Menor preço' },
  { valor: 'preco_desc', rotulo: 'Maior preço' },
]
const CHAVES_FILTRO = ['bairro', 'finalidade', 'min', 'max']

/** Como no Blogger: um cabeçalho de data e, embaixo, os posts daquele dia. */
function agruparPorDia(imoveis) {
  const grupos = []
  for (const imovel of imoveis) {
    const chave = chaveDoDia(imovel.createdAt)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.chave === chave) ultimo.imoveis.push(imovel)
    else grupos.push({ chave, dia: diaPorExtenso(imovel.createdAt), imoveis: [imovel] })
  }
  return grupos
}

/**
 * Os filtros ficam na URL (?bairro=1&finalidade=VENDA&min=100000&ordem=preco_asc&pagina=2):
 * dá para compartilhar o link, recarregar a página e usar o "voltar" do navegador.
 */
function lerUrl(params) {
  const pagina = Number.parseInt(params.get('pagina') ?? '1', 10)
  const ordem = params.get('ordem')
  return {
    bairro: params.get('bairro') ?? '',
    finalidade: params.get('finalidade') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    ordem: ORDENS.some((o) => o.valor === ordem) ? ordem : 'recentes',
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
  }
}

function montarUrl(valores) {
  const params = new URLSearchParams()
  CHAVES_FILTRO.forEach((chave) => valores[chave] && params.set(chave, valores[chave]))
  if (valores.ordem && valores.ordem !== 'recentes') params.set('ordem', valores.ordem)
  if (valores.pagina > 1) params.set('pagina', String(valores.pagina))
  return params
}

function useBairros() {
  const [bairros, setBairros] = useState({ status: 'carregando', lista: [] })
  useEffect(() => {
    let ativo = true
    listarBairros()
      .then((lista) => {
        const ordenados = [...lista].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
        if (ativo) setBairros({ status: 'ok', lista: ordenados })
      })
      .catch(() => ativo && setBairros({ status: 'erro', lista: [] }))
    return () => {
      ativo = false
    }
  }, [])
  return bairros
}

export default function Vitrine() {
  const [params, setParams] = useSearchParams()
  const valores = lerUrl(params)
  const chaveBusca = montarUrl(valores).toString()
  const bairros = useBairros()
  const topoRef = useRef(null)

  // "chave" identifica a busca a que o resultado pertence; se a URL mudou e a resposta
  // nova ainda não chegou, a tela está carregando (sem setState dentro do efeito)
  const [tentativa, setTentativa] = useState(0)
  const chaveAtual = `${chaveBusca}#${tentativa}`
  const [resposta, setResposta] = useState({ chave: null, resultado: null, erro: null })

  useEffect(() => {
    const controle = new AbortController()
    const atuais = lerUrl(new URLSearchParams(chaveBusca))
    const chave = `${chaveBusca}#${tentativa}`

    buscarImoveis(
      {
        bairroId: atuais.bairro,
        finalidade: atuais.finalidade,
        precoMin: atuais.min,
        precoMax: atuais.max,
        ordem: atuais.ordem,
        pagina: atuais.pagina - 1, // a API começa em 0
        tamanho: POR_PAGINA,
      },
      { signal: controle.signal },
    )
      .then((resultado) => setResposta({ chave, resultado, erro: null }))
      .catch((error) => {
        if (!foiCancelada(error)) setResposta({ chave, resultado: null, erro: mensagemDeErro(error) })
      })

    // a busca anterior é cancelada quando o usuário muda filtro/página antes de ela terminar
    return () => controle.abort()
  }, [chaveBusca, tentativa])

  function navegar(novos, { rolar = false } = {}) {
    setParams(montarUrl({ ...valores, ...novos }))
    if (rolar) topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const aplicarFiltros = (filtros) => navegar({ ...filtros, pagina: 1 })
  const limparFiltros = () => navegar({ bairro: '', finalidade: '', min: '', max: '', pagina: 1 })
  const irParaPagina = (pagina) => navegar({ pagina }, { rolar: true })

  const emDia = resposta.chave === chaveAtual
  let status = 'ok'
  if (!emDia) status = resposta.resultado ? 'atualizando' : 'carregando'
  else if (resposta.erro) status = 'erro'
  const { resultado, erro } = resposta
  const imoveis = resultado?.conteudo ?? []
  const total = resultado?.totalElementos ?? 0
  const totalPaginas = resultado?.totalPaginas ?? 0
  const temFiltro = CHAVES_FILTRO.some((chave) => valores[chave])
  const paginaInexistente = status === 'ok' && total > 0 && imoveis.length === 0

  return (
    <section>
      <header className="cabecalho-pagina">
        <h1>
          {valores.finalidade === 'VENDA'
            ? 'Imóveis à venda'
            : valores.finalidade === 'ALUGUEL'
              ? 'Imóveis para alugar'
              : 'Imóveis disponíveis'}
        </h1>
      </header>

      <Filtros
        key={CHAVES_FILTRO.map((c) => valores[c]).join('|')}
        valores={valores}
        bairros={bairros}
        onAplicar={aplicarFiltros}
        onLimpar={limparFiltros}
      />

      <div className="barra-resultados" ref={topoRef}>
        <p className="barra-resultados__total" aria-live="polite">
          {status === 'ok' &&
            total > 0 &&
            `${total} ${total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}` +
              (totalPaginas > 1 ? `, página ${valores.pagina} de ${totalPaginas}` : '')}
        </p>
        <div className="campo campo--linha">
          <label htmlFor="ordem">Ordenar por</label>
          <select id="ordem" value={valores.ordem} onChange={(e) => navegar({ ordem: e.target.value, pagina: 1 })}>
            {ORDENS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'carregando' && <Carregando texto="Buscando imóveis…" />}

      {status === 'erro' && <MensagemErro mensagem={erro} onTentarNovamente={() => setTentativa((n) => n + 1)} />}

      {status === 'ok' && total === 0 && (
        <SemResultados titulo={temFiltro ? 'Nenhum imóvel com esses filtros' : 'Nenhum imóvel disponível no momento'}>
          {temFiltro ? (
            <>
              Tente ampliar a faixa de preço ou escolher outro bairro.{' '}
              <button type="button" className="link" onClick={limparFiltros}>
                Limpar filtros
              </button>
            </>
          ) : (
            'Volte em breve: novos imóveis são cadastrados com frequência.'
          )}
        </SemResultados>
      )}

      {paginaInexistente && (
        <SemResultados titulo="Esta página não existe">
          <button type="button" className="link" onClick={() => irParaPagina(1)}>
            Ir para a primeira página
          </button>
        </SemResultados>
      )}

      {(status === 'ok' || status === 'atualizando') && imoveis.length > 0 && (
        <>
          <div className={`posts ${status === 'atualizando' ? 'posts--atualizando' : ''}`} aria-busy={status === 'atualizando'}>
            {agruparPorDia(imoveis).map((grupo, i) => (
              <section key={`${grupo.chave}-${i}`} className="dia">
                {grupo.dia && <h2 className="dia__data">{grupo.dia}</h2>}
                {grupo.imoveis.map((imovel) => (
                  <ImovelPost key={imovel.id} imovel={imovel} finalidadeFiltro={valores.finalidade} />
                ))}
              </section>
            ))}
          </div>
          <Paginacao pagina={valores.pagina} totalPaginas={totalPaginas} onIr={irParaPagina} />
        </>
      )}
    </section>
  )
}
