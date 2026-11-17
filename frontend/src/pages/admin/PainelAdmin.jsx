import { Link } from 'react-router-dom'
import { Carregando, MensagemErro } from '../../components/Feedback.jsx'
import { BarraSegmentada, BarrasHorizontais } from '../../components/Graficos.jsx'
import { useDados } from '../../hooks/useDados.js'
import { buscarPainel } from '../../services/painelService.js'

/** Cor fixa por finalidade (a cor acompanha a categoria, não a posição). Paleta validada para daltonismo. */
const CORES_FINALIDADE = {
  Venda: 'var(--serie-1)',
  Aluguel: 'var(--serie-2)',
  'Venda e aluguel': 'var(--serie-3)',
  'Sem finalidade': 'var(--serie-4)',
}

function Total({ rotulo, valor, detalhe, para }) {
  return (
    <Link to={para} className="total total--link">
      <p className="total__valor">{valor.toLocaleString('pt-BR')}</p>
      <p className="total__rotulo">{rotulo}</p>
      {detalhe && <p className="total__detalhe">{detalhe}</p>}
    </Link>
  )
}

/** Painel: totais (cada um leva à lista filtrada) e três gráficos. */
export default function PainelAdmin() {
  const { status, dados, erro, recarregar, atualizando } = useDados(({ signal }) => buscarPainel({ signal }), [])

  if (status === 'carregando') return <Carregando texto="Carregando o painel…" />
  if (status === 'erro') return <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />

  const { totais } = dados
  const aguardandoAprovacao = totais.contratosAguardandoAprovacao

  return (
    <div className="painel-admin">
      <p className="barra-resultados__total">
        Números de agora{' '}
        <button type="button" className="link" onClick={recarregar} disabled={atualizando}>
          {atualizando ? 'atualizando…' : 'atualizar'}
        </button>
      </p>

      <div className="totais">
        <Total
          rotulo="Imóveis disponíveis"
          valor={totais.imoveisDisponiveis}
          detalhe={`de ${totais.imoveis} cadastrados`}
          para="/"
        />
        <Total rotulo="Ofertas pendentes" valor={totais.ofertasPendentes} detalhe="esperando resposta" para="/admin/ofertas?status=PENDENTE" />
        <Total
          rotulo="Contratos aguardando assinatura"
          valor={totais.contratosAguardandoAssinatura}
          detalhe={aguardandoAprovacao > 0 ? `+ ${aguardandoAprovacao} aguardando aprovação` : 'nenhum para aprovar'}
          para="/admin/contratos?status=AGUARDANDO_ASSINATURA"
        />
        <Total rotulo="Contratos assinados" valor={totais.contratosAssinados} detalhe="negócios fechados" para="/admin/contratos?status=ASSINADO" />
      </div>

      {aguardandoAprovacao > 0 && (
        <p className="alerta alerta--atencao">
          {aguardandoAprovacao === 1 ? 'Há 1 contrato' : `Há ${aguardandoAprovacao} contratos`} esperando aprovação.{' '}
          <Link to="/admin/contratos?status=AGUARDANDO_APROVACAO">Revisar »</Link>
        </p>
      )}

      <div className="graficos">
        <BarrasHorizontais
          titulo="Imóveis por bairro"
          subtitulo="Todos os cadastrados, de qualquer situação"
          dados={dados.imoveisPorBairro}
          rotuloCategoria="Bairro"
          rotuloValor="Imóveis"
          vazio="Nenhum imóvel cadastrado."
        />
        <BarrasHorizontais
          titulo="Ofertas por situação"
          subtitulo="Todas as ofertas já recebidas"
          dados={dados.ofertasPorSituacao}
          rotuloCategoria="Situação"
          rotuloValor="Ofertas"
          vazio="Nenhuma oferta recebida ainda."
        />
        <BarraSegmentada
          titulo="Imóveis por finalidade"
          subtitulo="Cadastros antigos com os dois preços contam como “venda e aluguel”"
          dados={dados.imoveisPorFinalidade}
          cores={CORES_FINALIDADE}
          rotuloCategoria="Finalidade"
          rotuloValor="Imóveis"
          vazio="Nenhum imóvel cadastrado."
        />
        <BarrasHorizontais
          titulo="Imóveis por situação"
          subtitulo="Disponível, reservado, alugado e vendido"
          dados={dados.imoveisPorStatus}
          rotuloCategoria="Situação"
          rotuloValor="Imóveis"
          vazio="Nenhum imóvel cadastrado."
        />
      </div>
    </div>
  )
}
