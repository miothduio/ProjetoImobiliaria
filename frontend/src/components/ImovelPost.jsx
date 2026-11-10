import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listarFotosDoImovel } from '../services/imoveisService.js'
import { urlDoBackend } from '../services/api.js'
import { horaCurta, resumo } from '../utils/data.js'
import { formatarArea, localizacao, normalizar, rotuloFinalidade, valorPrincipal } from '../utils/imovel.js'

/**
 * Capa do post. A busca da vitrine já traz "capaUrl"; só quando o imóvel veio de outro
 * endpoint (sem esse campo) o post busca as fotos dele.
 */
function useCapa(imovel) {
  const jaVeio = Object.hasOwn(imovel, 'capaUrl')
  const imovelId = imovel.id
  const [capa, setCapa] = useState(null)

  useEffect(() => {
    if (jaVeio) return undefined
    let ativo = true
    listarFotosDoImovel(imovelId)
      .then((fotos) => {
        const foto = fotos.find((f) => f.capa) || fotos[0]
        if (ativo) setCapa(foto ? urlDoBackend(foto.url) : null)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [imovelId, jaVeio])

  return jaVeio ? urlDoBackend(imovel.capaUrl) : capa
}

function detalhes(imovel) {
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
  return [
    imovel.dormitorios != null && plural(imovel.dormitorios, 'dormitório', 'dormitórios'),
    imovel.banheiros != null && plural(imovel.banheiros, 'banheiro', 'banheiros'),
    imovel.garagem ? plural(imovel.garagem, 'vaga', 'vagas') : null,
    formatarArea(imovel.areaConstruida ?? imovel.areaTotal),
  ].filter(Boolean)
}

/** Um imóvel na vitrine, no formato de post de blog. */
export default function ImovelPost({ imovel, finalidadeFiltro }) {
  const location = useLocation()
  const capa = useCapa(imovel)
  const [fotoFalhou, setFotoFalhou] = useState(false)
  const { valor, sufixo } = valorPrincipal(imovel, finalidadeFiltro)
  const finalidade = rotuloFinalidade(imovel.finalidade)
  const fin = normalizar(imovel.finalidade)
  const link = `/imoveis/${imovel.id}`
  const estado = { voltar: location.search }
  const titulo = imovel.titulo || 'Imóvel sem título'
  const hora = horaCurta(imovel.createdAt)
  const texto = resumo(imovel.descricao)
  const itens = detalhes(imovel)

  return (
    <article className="post">
      <h3 className="post__titulo">
        <Link to={link} state={estado}>
          {titulo}
        </Link>
      </h3>

      <div className="post__corpo">
        <Link to={link} state={estado} className="post__foto" tabIndex={-1} aria-hidden="true">
          {capa && !fotoFalhou ? (
            <img src={capa} alt="" loading="lazy" onError={() => setFotoFalhou(true)} />
          ) : (
            <span className="post__sem-foto">sem foto</span>
          )}
        </Link>

        <div className="post__texto">
          <p className="post__preco">
            {valor ? (
              <>
                {valor}
                {sufixo && <small>{sufixo}</small>}
              </>
            ) : (
              <span className="post__consulte">Valor sob consulta</span>
            )}
          </p>
          <p className="post__local">
            {[imovel.tipoImovel?.nome, localizacao(imovel)].filter(Boolean).join(' em ')}
          </p>
          {itens.length > 0 && <p className="post__detalhes">{itens.join(', ')}</p>}
          {texto && <p>{texto}</p>}
          <p>
            <Link to={link} state={estado}>
              Leia mais »
            </Link>
          </p>
        </div>
      </div>

      <p className="post__rodape">
        Postado por <strong>Imobiliária</strong>
        {hora && <> às {hora}</>}
        <span aria-hidden="true"> | </span>
        Cód. {imovel.id}
        <span aria-hidden="true"> | </span>
        Marcadores:{' '}
        {finalidade && (fin === 'VENDA' || fin === 'ALUGUEL') ? (
          <Link to={`/?finalidade=${fin}`}>{finalidade}</Link>
        ) : (
          finalidade
        )}
        {imovel.bairro?.id && (
          <>
            , <Link to={`/?bairro=${imovel.bairro.id}`}>{imovel.bairro.nome}</Link>
          </>
        )}
      </p>
    </article>
  )
}
