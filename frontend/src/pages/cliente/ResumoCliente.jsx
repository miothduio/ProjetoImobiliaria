import { Link } from 'react-router-dom'
import { Carregando, MensagemErro } from '../../components/Feedback.jsx'
import { useFavoritos } from '../../favoritos/contexto.js'
import { useDados } from '../../hooks/useDados.js'
import { meusContratos } from '../../services/contratosService.js'
import { minhasOfertas } from '../../services/ofertasService.js'

/** Primeira tela do cliente: o que precisa da atenção dele e atalhos. */
export default function ResumoCliente() {
  const { total: favoritos } = useFavoritos()
  const { status, dados, erro, recarregar } = useDados(
    async ({ signal }) => {
      const [ofertas, pendentes, aceitas, paraAssinar] = await Promise.all([
        minhasOfertas({ tamanho: 1 }, { signal }),
        minhasOfertas({ status: 'PENDENTE', tamanho: 1 }, { signal }),
        minhasOfertas({ status: 'ACEITA', tamanho: 1 }, { signal }),
        meusContratos({ status: 'AGUARDANDO_ASSINATURA', tamanho: 1 }, { signal }),
      ])
      return {
        ofertas: ofertas.totalElementos,
        pendentes: pendentes.totalElementos,
        aceitas: aceitas.totalElementos,
        paraAssinar: paraAssinar.totalElementos,
      }
    },
    [],
  )

  if (status === 'carregando') return <Carregando texto="Carregando seu resumo…" />
  if (status === 'erro') return <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />

  return (
    <>
      {dados.paraAssinar > 0 && (
        <p className="alerta alerta--info" role="status">
          <strong>
            {dados.paraAssinar === 1 ? 'Um contrato espera' : `${dados.paraAssinar} contratos esperam`} a sua assinatura.
          </strong>{' '}
          <Link to="/cliente/contratos?status=AGUARDANDO_ASSINATURA">Assinar agora »</Link>
        </p>
      )}

      <div className="atalhos">
        <Link to="/cliente/ofertas" className="atalho">
          <h2>Minhas ofertas</h2>
          <p>
            {dados.ofertas === 0
              ? 'Você ainda não fez ofertas.'
              : `${dados.ofertas} no total, ${dados.pendentes} aguardando resposta e ${dados.aceitas} aceita${dados.aceitas === 1 ? '' : 's'}.`}
          </p>
          <span className="atalho__mais">Acompanhar »</span>
        </Link>
        <Link to="/cliente/favoritos" className="atalho">
          <h2>Favoritos</h2>
          <p>{favoritos === 0 ? 'Marque ☆ nos imóveis que quer ver de novo.' : `${favoritos} imóve${favoritos === 1 ? 'l guardado' : 'is guardados'}.`}</p>
          <span className="atalho__mais">Ver favoritos »</span>
        </Link>
        <Link to="/cliente/contratos" className="atalho">
          <h2>Contratos</h2>
          <p>Leia o PDF e assine os contratos das ofertas aceitas.</p>
          <span className="atalho__mais">Ver contratos »</span>
        </Link>
        <Link to="/" className="atalho atalho--destaque">
          <h2>Procurar imóveis</h2>
          <p>Encontre um imóvel disponível e faça sua oferta.</p>
          <span className="atalho__mais">Ver imóveis »</span>
        </Link>
      </div>
    </>
  )
}
