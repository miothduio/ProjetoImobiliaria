import { useState } from 'react'
import { Link } from 'react-router-dom'
import Confirmacao from '../../components/Confirmacao.jsx'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback.jsx'
import FiltroSituacao from '../../components/FiltroSituacao.jsx'
import ImovelMini from '../../components/ImovelMini.jsx'
import Paginacao from '../../components/Paginacao.jsx'
import Situacao from '../../components/Situacao.jsx'
import { useDados } from '../../hooks/useDados.js'
import { useListaNaUrl } from '../../hooks/useListaNaUrl.js'
import { cancelarOferta, minhasOfertas } from '../../services/ofertasService.js'
import { formatarMoeda } from '../../utils/imovel.js'
import {
  EXPLICACAO_OFERTA,
  SITUACOES_OFERTA,
  formatarDataHora,
  rotuloTipoOferta,
  situacaoContrato,
  situacaoOferta,
} from '../../utils/situacoes.js'

const POR_PAGINA = 8

export default function MinhasOfertas() {
  const { status: filtro, pagina, filtrar, irPara } = useListaNaUrl()
  const [cancelando, setCancelando] = useState(null)
  const [aviso, setAviso] = useState(null)

  const lista = useDados(
    ({ signal }) => minhasOfertas({ status: filtro, pagina: pagina - 1, tamanho: POR_PAGINA }, { signal }),
    [filtro, pagina],
  )

  return (
    <>
      <FiltroSituacao situacoes={SITUACOES_OFERTA} atual={filtro} onTrocar={filtrar} />
      {aviso && (
        <p className="alerta alerta--info" role="status">
          {aviso}
        </p>
      )}

      {lista.status === 'carregando' && <Carregando texto="Carregando suas ofertas…" />}
      {lista.status === 'erro' && <MensagemErro mensagem={lista.erro} onTentarNovamente={lista.recarregar} />}
      {lista.status === 'ok' && lista.dados.conteudo.length === 0 && (
        <SemResultados titulo={filtro ? 'Nenhuma oferta nesta situação' : 'Você ainda não fez ofertas'}>
          {filtro ? 'Escolha “Todas” para ver as outras.' : <Link to="/">Procure um imóvel disponível e faça a sua.</Link>}
        </SemResultados>
      )}

      {lista.status === 'ok' && lista.dados.conteudo.length > 0 && (
        <>
          <p className="barra-resultados__total">
            {lista.dados.totalElementos} oferta{lista.dados.totalElementos === 1 ? '' : 's'}
            {lista.atualizando && <span className="spinner spinner--pequeno" aria-label="Atualizando" />}
          </p>
          <ul className={`registros ${lista.atualizando ? 'posts--atualizando' : ''}`}>
            {lista.dados.conteudo.map((o) => {
              const podeCancelar = o.status === 'PENDENTE' || o.status === 'EM_ESPERA'
              return (
                <li key={o.id} className="registro">
                  <ImovelMini imovel={o.imovel} mostrarSituacao />
                  <div className="registro__dados">
                    <p className="registro__valor">
                      {rotuloTipoOferta(o.tipo)}: <strong>{formatarMoeda(o.valor)}</strong>
                      {o.tipo === 'ALUGUEL' && '/mês'}
                    </p>
                    <p className="registro__linha">
                      <Situacao situacao={situacaoOferta(o.status)} /> {EXPLICACAO_OFERTA[o.status]}
                    </p>
                    {o.contrato && (
                      <p className="registro__linha">
                        Contrato: <Situacao situacao={situacaoContrato(o.contrato.status)} />{' '}
                        <Link to="/cliente/contratos">ver contratos</Link>
                      </p>
                    )}
                    {o.mensagem && <p className="registro__mensagem">“{o.mensagem}”</p>}
                    <p className="dica">
                      Oferta nº {o.id}, enviada em {formatarDataHora(o.createdAt)}
                    </p>
                  </div>
                  {podeCancelar && (
                    <div className="registro__acoes">
                      <button type="button" className="botao botao--secundario" onClick={() => setCancelando(o)}>
                        Desistir
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <Paginacao pagina={pagina} totalPaginas={lista.dados.totalPaginas} onIr={irPara} />
        </>
      )}

      <Confirmacao
        aberto={Boolean(cancelando)}
        titulo="Desistir da oferta"
        rotuloConfirmar="Sim, desistir"
        perigoso
        acao={() => cancelarOferta(cancelando.id)}
        onFechar={() => setCancelando(null)}
        onConcluido={() => {
          setAviso(`A oferta nº ${cancelando.id} foi cancelada.`)
          setCancelando(null)
          lista.recarregar()
        }}
      >
        {cancelando && (
          <p>
            Cancelar a oferta de {formatarMoeda(cancelando.valor)} para <strong>{cancelando.imovel?.titulo}</strong>? Depois você
            pode fazer outra, se o imóvel continuar disponível.
          </p>
        )}
      </Confirmacao>
    </>
  )
}
