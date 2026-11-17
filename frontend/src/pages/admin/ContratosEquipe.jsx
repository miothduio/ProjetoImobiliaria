import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/contexto.js'
import { PERFIS } from '../../auth/sessao.js'
import BotaoPdf from '../../components/BotaoPdf.jsx'
import Confirmacao from '../../components/Confirmacao.jsx'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback.jsx'
import FiltroSituacao from '../../components/FiltroSituacao.jsx'
import ImovelMini from '../../components/ImovelMini.jsx'
import Paginacao from '../../components/Paginacao.jsx'
import Situacao from '../../components/Situacao.jsx'
import { useDados } from '../../hooks/useDados.js'
import { useListaNaUrl } from '../../hooks/useListaNaUrl.js'
import { aprovarContrato, cancelarContrato, listarContratos, recusarContrato } from '../../services/contratosService.js'
import { formatarMoeda } from '../../utils/imovel.js'
import { SITUACOES_CONTRATO, formatarDataHora, rotuloTipoOferta, situacaoContrato } from '../../utils/situacoes.js'

const POR_PAGINA = 10

const CONFIRMACOES = {
  aprovar: {
    titulo: 'Aprovar contrato',
    rotulo: 'Aprovar',
    texto: 'O cliente recebe um e-mail e passa a poder assinar na área dele.',
    acao: (c) => aprovarContrato(c.id),
    aviso: (c) => `Contrato nº ${c.id} aprovado. O cliente foi avisado para assinar.`,
  },
  recusar: {
    titulo: 'Recusar contrato',
    rotulo: 'Recusar',
    perigoso: true,
    motivo: 'O que precisa ser corrigido? (o corretor e o cliente veem)',
    texto: 'A reserva do imóvel continua; o corretor prepara um novo contrato para a mesma oferta.',
    acao: (c, motivo) => recusarContrato(c.id, motivo),
    aviso: (c) => `Contrato nº ${c.id} recusado. O corretor pode preparar outro em Ofertas › Aceitas.`,
  },
  cancelar: {
    titulo: 'Cancelar contrato (cliente desistiu)',
    rotulo: 'Cancelar contrato',
    perigoso: true,
    motivo: 'Motivo do cancelamento (opcional)',
    texto: 'O contrato e a oferta são cancelados, o imóvel volta a ficar DISPONÍVEL e quem estava em espera volta a PENDENTE.',
    acao: (c, motivo) => cancelarContrato(c.id, motivo),
    aviso: (c) => `Contrato nº ${c.id} cancelado. O imóvel voltou para a vitrine.`,
  },
}

export default function ContratosEquipe() {
  const { sessao } = useAuth()
  const admin = sessao.perfil === PERFIS.ADMIN
  const { status: filtro, pagina, filtrar, irPara } = useListaNaUrl()
  const [pendente, setPendente] = useState(null) // { tipo, contrato }
  const [aviso, setAviso] = useState(null)

  const lista = useDados(
    ({ signal }) => listarContratos({ status: filtro, pagina: pagina - 1, tamanho: POR_PAGINA }, { signal }),
    [filtro, pagina],
  )
  const confirmacao = pendente ? CONFIRMACOES[pendente.tipo] : null

  return (
    <>
      <FiltroSituacao situacoes={SITUACOES_CONTRATO} atual={filtro} onTrocar={filtrar} />
      {!admin && (
        <p className="dica">Só o administrador aprova, recusa ou cancela contratos. Contrato recusado? Prepare outro em Ofertas › Aceitas.</p>
      )}
      {aviso && (
        <p className="alerta alerta--info" role="status">
          {aviso}
        </p>
      )}

      {lista.status === 'carregando' && <Carregando texto="Carregando contratos…" />}
      {lista.status === 'erro' && <MensagemErro mensagem={lista.erro} onTentarNovamente={lista.recarregar} />}
      {lista.status === 'ok' && lista.dados.conteudo.length === 0 && (
        <SemResultados titulo={filtro ? 'Nenhum contrato nesta situação' : 'Nenhum contrato ainda'}>
          {filtro ? 'Escolha “Todas” para ver os outros.' : <>Aceite uma oferta e prepare o contrato em <Link to="/admin/ofertas">Ofertas</Link>.</>}
        </SemResultados>
      )}

      {lista.status === 'ok' && lista.dados.conteudo.length > 0 && (
        <>
          <p className="barra-resultados__total">
            {lista.dados.totalElementos} contrato{lista.dados.totalElementos === 1 ? '' : 's'}
            {lista.atualizando && <span className="spinner spinner--pequeno" aria-label="Atualizando" />}
          </p>
          <table className={`tabela ${lista.atualizando ? 'posts--atualizando' : ''}`}>
            <thead>
              <tr>
                <th scope="col">Imóvel</th>
                <th scope="col">Cliente</th>
                <th scope="col">Contrato</th>
                <th scope="col">Situação</th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.dados.conteudo.map((c) => (
                <tr key={c.id}>
                  <td data-rotulo="Imóvel">
                    <ImovelMini imovel={c.imovel} mostrarSituacao />
                  </td>
                  <td data-rotulo="Cliente">
                    <strong>{c.cliente?.nome || 'Sem nome'}</strong>
                    <br />
                    <a href={`mailto:${c.cliente?.email}`}>{c.cliente?.email}</a>
                  </td>
                  <td data-rotulo="Contrato">
                    Nº {c.id} · {rotuloTipoOferta(c.oferta.tipo)}: <strong>{formatarMoeda(c.oferta.valor)}</strong>
                    {c.oferta.tipo === 'ALUGUEL' && '/mês'}
                    <p className="dica">
                      {c.pdfGerado ? 'PDF gerado pelo sistema' : `PDF enviado: ${c.pdfNome}`}
                      {c.preparadoPor && <> · por {c.preparadoPor.nome}</>} · {formatarDataHora(c.createdAt)}
                    </p>
                  </td>
                  <td data-rotulo="Situação">
                    <Situacao situacao={situacaoContrato(c.status)} />
                    {c.dataAprovacao && <p className="dica">Aprovado em {formatarDataHora(c.dataAprovacao)}</p>}
                    {c.dataAssinatura && (
                      <p className="dica">
                        Assinado por {c.assinadoComo} em {formatarDataHora(c.dataAssinatura)}
                      </p>
                    )}
                    {c.motivo && <p className="registro__mensagem">Motivo: {c.motivo}</p>}
                  </td>
                  <td className="tabela__acoes">
                    <BotaoPdf contrato={c} rotulo="PDF" />
                    {admin && c.status === 'AGUARDANDO_APROVACAO' && (
                      <>
                        <button type="button" className="botao" onClick={() => setPendente({ tipo: 'aprovar', contrato: c })}>
                          ✔ Aprovar
                        </button>
                        <button type="button" className="botao botao--secundario" onClick={() => setPendente({ tipo: 'recusar', contrato: c })}>
                          ✖ Recusar
                        </button>
                      </>
                    )}
                    {admin && (c.status === 'AGUARDANDO_APROVACAO' || c.status === 'AGUARDANDO_ASSINATURA') && (
                      <button type="button" className="botao botao--secundario" onClick={() => setPendente({ tipo: 'cancelar', contrato: c })}>
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
        pedirMotivo={Boolean(confirmacao?.motivo)}
        rotuloMotivo={confirmacao?.motivo}
        acao={(motivo) => confirmacao.acao(pendente.contrato, motivo)}
        onFechar={() => setPendente(null)}
        onConcluido={() => {
          setAviso(confirmacao.aviso(pendente.contrato))
          setPendente(null)
          lista.recarregar()
        }}
      >
        {pendente && (
          <>
            <p>
              Contrato nº {pendente.contrato.id} de <strong>{pendente.contrato.cliente?.nome}</strong> para{' '}
              <strong>{pendente.contrato.imovel?.titulo}</strong> ({formatarMoeda(pendente.contrato.oferta.valor)}).
            </p>
            <p>{confirmacao.texto}</p>
          </>
        )}
      </Confirmacao>
    </>
  )
}
