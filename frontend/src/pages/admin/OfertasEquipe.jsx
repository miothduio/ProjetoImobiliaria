import { useState } from 'react'
import { Link } from 'react-router-dom'
import Confirmacao from '../../components/Confirmacao.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback.jsx'
import FiltroSituacao from '../../components/FiltroSituacao.jsx'
import FormPrepararContrato from '../../components/FormPrepararContrato.jsx'
import ImovelMini from '../../components/ImovelMini.jsx'
import Paginacao from '../../components/Paginacao.jsx'
import Situacao from '../../components/Situacao.jsx'
import { useDados } from '../../hooks/useDados.js'
import { useListaNaUrl } from '../../hooks/useListaNaUrl.js'
import { aceitarOferta, listarOfertas, recusarOferta } from '../../services/ofertasService.js'
import { formatarMoeda } from '../../utils/imovel.js'
import { SITUACOES_OFERTA, formatarDataHora, rotuloTipoOferta, situacaoContrato, situacaoOferta } from '../../utils/situacoes.js'

const POR_PAGINA = 10

/** Contrato que ainda vale (nesses casos não se prepara outro nem se desfaz o aceite). */
const CONTRATO_ATIVO = ['AGUARDANDO_APROVACAO', 'AGUARDANDO_ASSINATURA', 'ASSINADO']

/** Diferença para o preço anunciado: "5% abaixo do anunciado" */
function comparacao(oferta) {
  const anunciado = oferta.tipo === 'ALUGUEL' ? oferta.imovel?.precoAluguel : oferta.imovel?.precoVenda
  if (!anunciado || !oferta.valor) return null
  const diferenca = Math.round(((oferta.valor - anunciado) / anunciado) * 100)
  if (diferenca === 0) return 'igual ao anunciado'
  return `${Math.abs(diferenca)}% ${diferenca < 0 ? 'abaixo' : 'acima'} do anunciado`
}

const CONFIRMACOES = {
  aceitar: {
    titulo: 'Aceitar oferta',
    rotulo: 'Aceitar',
    texto: 'O imóvel fica RESERVADO e as outras ofertas pendentes dele vão para EM ESPERA. Depois, prepare o contrato.',
    acao: (o) => aceitarOferta(o.id),
    aviso: (o) => `Oferta nº ${o.id} aceita. O imóvel está reservado; agora prepare o contrato.`,
  },
  recusar: {
    titulo: 'Recusar oferta',
    rotulo: 'Recusar',
    perigoso: true,
    texto: 'O cliente é avisado por e-mail e pode fazer outra oferta enquanto o imóvel estiver disponível.',
    acao: (o) => recusarOferta(o.id),
    aviso: (o) => `Oferta nº ${o.id} recusada.`,
  },
  desfazer: {
    titulo: 'Desfazer aceite',
    rotulo: 'Desfazer aceite',
    perigoso: true,
    texto: 'A oferta passa a RECUSADA, o imóvel volta a ficar DISPONÍVEL e quem estava em espera volta a PENDENTE.',
    acao: (o) => recusarOferta(o.id),
    aviso: (o) => `Aceite da oferta nº ${o.id} desfeito; o imóvel voltou para a vitrine.`,
  },
}

export default function OfertasEquipe() {
  const { status: filtro, pagina, filtrar, irPara } = useListaNaUrl()
  const [pendente, setPendente] = useState(null) // { tipo, oferta }
  const [preparando, setPreparando] = useState(null)
  const [aviso, setAviso] = useState(null)

  const lista = useDados(
    ({ signal }) => listarOfertas({ status: filtro, pagina: pagina - 1, tamanho: POR_PAGINA }, { signal }),
    [filtro, pagina],
  )
  const confirmacao = pendente ? CONFIRMACOES[pendente.tipo] : null

  function concluir(texto) {
    setAviso(texto)
    lista.recarregar()
  }

  return (
    <>
      <FiltroSituacao situacoes={SITUACOES_OFERTA} atual={filtro} onTrocar={filtrar} />
      {aviso && (
        <p className="alerta alerta--info" role="status">
          {aviso}
        </p>
      )}

      {lista.status === 'carregando' && <Carregando texto="Carregando ofertas…" />}
      {lista.status === 'erro' && <MensagemErro mensagem={lista.erro} onTentarNovamente={lista.recarregar} />}
      {lista.status === 'ok' && lista.dados.conteudo.length === 0 && (
        <SemResultados titulo={filtro ? 'Nenhuma oferta nesta situação' : 'Nenhuma oferta recebida ainda'}>
          {filtro ? 'Escolha “Todas” para ver as outras.' : 'As propostas dos clientes aparecem aqui.'}
        </SemResultados>
      )}

      {lista.status === 'ok' && lista.dados.conteudo.length > 0 && (
        <>
          <p className="barra-resultados__total">
            {lista.dados.totalElementos} oferta{lista.dados.totalElementos === 1 ? '' : 's'}
            {lista.atualizando && <span className="spinner spinner--pequeno" aria-label="Atualizando" />}
          </p>
          <table className={`tabela ${lista.atualizando ? 'posts--atualizando' : ''}`}>
            <thead>
              <tr>
                <th scope="col">Imóvel</th>
                <th scope="col">Cliente</th>
                <th scope="col">Proposta</th>
                <th scope="col">Situação</th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.dados.conteudo.map((o) => {
                const contratoAtivo = o.contrato && CONTRATO_ATIVO.includes(o.contrato.status)
                const comp = comparacao(o)
                return (
                  <tr key={o.id}>
                    <td data-rotulo="Imóvel">
                      <ImovelMini imovel={o.imovel} mostrarSituacao />
                    </td>
                    <td data-rotulo="Cliente">
                      <strong>{o.cliente?.nome || 'Sem nome'}</strong>
                      <br />
                      <a href={`mailto:${o.cliente?.email}`}>{o.cliente?.email}</a>
                    </td>
                    <td data-rotulo="Proposta">
                      {rotuloTipoOferta(o.tipo)}: <strong>{formatarMoeda(o.valor)}</strong>
                      {o.tipo === 'ALUGUEL' && '/mês'}
                      {comp && <span className="dica"> ({comp})</span>}
                      {o.mensagem && <p className="registro__mensagem">“{o.mensagem}”</p>}
                      <p className="dica">
                        Nº {o.id} · {formatarDataHora(o.createdAt)}
                      </p>
                    </td>
                    <td data-rotulo="Situação">
                      <Situacao situacao={situacaoOferta(o.status)} />
                      {o.contrato && (
                        <p className="dica">
                          Contrato: <Situacao situacao={situacaoContrato(o.contrato.status)} />
                        </p>
                      )}
                    </td>
                    <td className="tabela__acoes">
                      {o.status === 'PENDENTE' && (
                        <>
                          <button type="button" className="botao" onClick={() => setPendente({ tipo: 'aceitar', oferta: o })}>
                            ✔ Aceitar
                          </button>
                          <button type="button" className="botao botao--secundario" onClick={() => setPendente({ tipo: 'recusar', oferta: o })}>
                            ✖ Recusar
                          </button>
                        </>
                      )}
                      {o.status === 'EM_ESPERA' && (
                        <button type="button" className="botao botao--secundario" onClick={() => setPendente({ tipo: 'recusar', oferta: o })}>
                          ✖ Recusar
                        </button>
                      )}
                      {o.status === 'ACEITA' && !contratoAtivo && (
                        <>
                          <button type="button" className="botao botao--destaque" onClick={() => setPreparando(o)}>
                            📄 Preparar contrato
                          </button>
                          <button type="button" className="botao botao--secundario" onClick={() => setPendente({ tipo: 'desfazer', oferta: o })}>
                            Desfazer aceite
                          </button>
                        </>
                      )}
                      {o.status === 'ACEITA' && contratoAtivo && <Link to="/admin/contratos">Ver contrato »</Link>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Paginacao pagina={pagina} totalPaginas={lista.dados.totalPaginas} onIr={irPara} />
        </>
      )}

      <Confirmacao
        aberto={Boolean(pendente)}
        titulo={confirmacao?.titulo}
        rotuloConfirmar={confirmacao?.rotulo}
        perigoso={confirmacao?.perigoso}
        acao={() => confirmacao.acao(pendente.oferta)}
        onFechar={() => setPendente(null)}
        onConcluido={() => {
          concluir(confirmacao.aviso(pendente.oferta))
          setPendente(null)
        }}
      >
        {pendente && (
          <>
            <p>
              Oferta nº {pendente.oferta.id} de <strong>{pendente.oferta.cliente?.nome}</strong>: {formatarMoeda(pendente.oferta.valor)} para{' '}
              <strong>{pendente.oferta.imovel?.titulo}</strong>.
            </p>
            <p>{confirmacao.texto}</p>
          </>
        )}
      </Confirmacao>

      <Dialogo aberto={Boolean(preparando)} onFechar={() => setPreparando(null)} titulo="Preparar contrato">
        {preparando && (
          <FormPrepararContrato
            oferta={preparando}
            onFechar={() => setPreparando(null)}
            onPreparado={(c) => {
              setPreparando(null)
              concluir(`Contrato nº ${c.id} preparado e enviado para aprovação do administrador.`)
            }}
          />
        )}
      </Dialogo>
    </>
  )
}
