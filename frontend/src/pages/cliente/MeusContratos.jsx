import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/contexto.js'
import BotaoPdf from '../../components/BotaoPdf.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback.jsx'
import FiltroSituacao from '../../components/FiltroSituacao.jsx'
import ImovelMini from '../../components/ImovelMini.jsx'
import Paginacao from '../../components/Paginacao.jsx'
import Situacao from '../../components/Situacao.jsx'
import { useDados } from '../../hooks/useDados.js'
import { useListaNaUrl } from '../../hooks/useListaNaUrl.js'
import { mensagemDeErro } from '../../services/api.js'
import { assinarContrato, meusContratos } from '../../services/contratosService.js'
import { formatarMoeda, normalizar } from '../../utils/imovel.js'
import {
  EXPLICACAO_CONTRATO,
  SITUACOES_CONTRATO,
  formatarDataHora,
  rotuloTipoOferta,
  situacaoContrato,
} from '../../utils/situacoes.js'

const POR_PAGINA = 8

/** Assinatura eletrônica simples: li e concordo + nome completo igual ao do cadastro. */
function FormAssinatura({ contrato, onAssinado, onFechar }) {
  const { usuario } = useAuth()
  const [nome, setNome] = useState('')
  const [aceite, setAceite] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [estado, setEstado] = useState({ enviando: false, erro: null })

  const nomeCadastro = usuario?.nome?.trim()
  const limpo = nome.trim().replace(/\s+/g, ' ')
  const erros = {
    aceite: aceite ? null : 'Marque que leu e concorda com o contrato.',
    nome: !limpo
      ? 'Digite seu nome completo.'
      : nomeCadastro && normalizar(limpo) !== normalizar(nomeCadastro).replace(/\s+/g, ' ')
        ? `Digite o nome exatamente como no cadastro: ${nomeCadastro}.`
        : null,
  }

  async function assinar(evento) {
    evento.preventDefault()
    setTentou(true)
    if (erros.aceite || erros.nome) return
    setEstado({ enviando: true, erro: null })
    try {
      onAssinado(await assinarContrato(contrato.id, limpo))
    } catch (error) {
      setEstado({ enviando: false, erro: mensagemDeErro(error, 'Não foi possível assinar agora.') })
    }
  }

  return (
    <form className="formulario" onSubmit={assinar} noValidate>
      <p>
        Contrato nº {contrato.id}: {rotuloTipoOferta(contrato.oferta.tipo).toLowerCase()} de{' '}
        <strong>{contrato.imovel?.titulo}</strong> por <strong>{formatarMoeda(contrato.oferta.valor)}</strong>
        {contrato.oferta.tipo === 'ALUGUEL' && '/mês'}.
      </p>
      <p className="formulario__acoes">
        <BotaoPdf contrato={contrato} rotulo="Ler o contrato (PDF)" />
      </p>

      <label className="opcao">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
        Li o contrato e concordo com os termos.
      </label>
      {tentou && erros.aceite && <p className="campo__erro">{erros.aceite}</p>}

      <div className={`campo ${tentou && erros.nome ? 'campo--erro' : ''}`}>
        <label htmlFor="assinatura-nome">Assinatura: digite seu nome completo</label>
        <input
          id="assinatura-nome"
          className="campo__assinatura"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="name"
          aria-invalid={Boolean(tentou && erros.nome)}
          placeholder={nomeCadastro || 'Seu nome completo'}
        />
        {tentou && erros.nome && <p className="campo__erro">{erros.nome}</p>}
      </div>

      <p className="dica">Ao assinar, o imóvel sai da vitrine e as outras ofertas dele são encerradas. Esta ação não pode ser desfeita.</p>

      {estado.erro && (
        <p className="alerta alerta--erro" role="alert">
          {estado.erro}
        </p>
      )}
      <div className="formulario__acoes">
        <button type="submit" className="botao botao--destaque" disabled={estado.enviando}>
          {estado.enviando ? 'Assinando…' : '✍ Assinar contrato'}
        </button>
        <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={estado.enviando}>
          Agora não
        </button>
      </div>
    </form>
  )
}

export default function MeusContratos() {
  const { status: filtro, pagina, filtrar, irPara } = useListaNaUrl()
  const [assinando, setAssinando] = useState(null)
  const [aviso, setAviso] = useState(null)

  const lista = useDados(
    ({ signal }) => meusContratos({ status: filtro, pagina: pagina - 1, tamanho: POR_PAGINA }, { signal }),
    [filtro, pagina],
  )

  return (
    <>
      <FiltroSituacao situacoes={SITUACOES_CONTRATO} atual={filtro} onTrocar={filtrar} />
      {aviso && (
        <p className="alerta alerta--info" role="status">
          {aviso}
        </p>
      )}

      {lista.status === 'carregando' && <Carregando texto="Carregando seus contratos…" />}
      {lista.status === 'erro' && <MensagemErro mensagem={lista.erro} onTentarNovamente={lista.recarregar} />}
      {lista.status === 'ok' && lista.dados.conteudo.length === 0 && (
        <SemResultados titulo={filtro ? 'Nenhum contrato nesta situação' : 'Nenhum contrato ainda'}>
          {filtro ? 'Escolha “Todas” para ver os outros.' : <>Quando uma oferta sua for aceita, o contrato aparece aqui. <Link to="/cliente/ofertas">Ver minhas ofertas</Link></>}
        </SemResultados>
      )}

      {lista.status === 'ok' && lista.dados.conteudo.length > 0 && (
        <>
          <ul className={`registros ${lista.atualizando ? 'posts--atualizando' : ''}`}>
            {lista.dados.conteudo.map((c) => (
              <li key={c.id} className={`registro ${c.status === 'AGUARDANDO_ASSINATURA' ? 'registro--destaque' : ''}`}>
                <ImovelMini imovel={c.imovel} />
                <div className="registro__dados">
                  <p className="registro__valor">
                    Contrato nº {c.id} · {rotuloTipoOferta(c.oferta.tipo)}: <strong>{formatarMoeda(c.oferta.valor)}</strong>
                    {c.oferta.tipo === 'ALUGUEL' && '/mês'}
                  </p>
                  <p className="registro__linha">
                    <Situacao situacao={situacaoContrato(c.status)} /> {EXPLICACAO_CONTRATO[c.status]}
                  </p>
                  {c.status === 'ASSINADO' && (
                    <p className="registro__linha">
                      Assinado por <strong>{c.assinadoComo}</strong> em {formatarDataHora(c.dataAssinatura)}.
                    </p>
                  )}
                  {c.motivo && (c.status === 'RECUSADO' || c.status === 'CANCELADO') && (
                    <p className="registro__mensagem">Motivo: {c.motivo}</p>
                  )}
                  <p className="dica">
                    Preparado em {formatarDataHora(c.createdAt)}
                    {c.dataAprovacao && <>, aprovado em {formatarDataHora(c.dataAprovacao)}</>}
                  </p>
                </div>
                <div className="registro__acoes">
                  {c.status === 'AGUARDANDO_ASSINATURA' && (
                    <button type="button" className="botao botao--destaque" onClick={() => setAssinando(c)}>
                      ✍ Assinar
                    </button>
                  )}
                  {c.status !== 'AGUARDANDO_APROVACAO' && <BotaoPdf contrato={c} />}
                </div>
              </li>
            ))}
          </ul>
          <Paginacao pagina={pagina} totalPaginas={lista.dados.totalPaginas} onIr={irPara} />
        </>
      )}

      <Dialogo aberto={Boolean(assinando)} onFechar={() => setAssinando(null)} titulo="Assinar contrato">
        {assinando && (
          <FormAssinatura
            contrato={assinando}
            onFechar={() => setAssinando(null)}
            onAssinado={(c) => {
              setAssinando(null)
              setAviso(`Contrato nº ${c.id} assinado! O imóvel agora está ${c.oferta.tipo === 'ALUGUEL' ? 'alugado' : 'vendido'} para você.`)
              lista.recarregar()
            }}
          />
        )}
      </Dialogo>
    </>
  )
}
