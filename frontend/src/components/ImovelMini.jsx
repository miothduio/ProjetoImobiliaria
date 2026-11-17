import { useState } from 'react'
import { Link } from 'react-router-dom'
import { urlDoBackend } from '../services/api.js'
import { rotuloStatus } from '../utils/imovel.js'

/** Miniatura do imóvel nas listas de ofertas, contratos e favoritos. */
export default function ImovelMini({ imovel, mostrarSituacao = false }) {
  const [falhou, setFalhou] = useState(false)
  if (!imovel) return <span className="dica">Imóvel removido</span>
  const capa = urlDoBackend(imovel.capaUrl)
  const local = [imovel.tipo, [imovel.bairro, imovel.cidade].filter(Boolean).join(', ')].filter(Boolean).join(' em ')

  return (
    <div className="imovel-mini">
      <Link to={`/imoveis/${imovel.id}`} className="imovel-mini__foto" tabIndex={-1} aria-hidden="true">
        {capa && !falhou ? <img src={capa} alt="" loading="lazy" onError={() => setFalhou(true)} /> : <span>sem foto</span>}
      </Link>
      <div>
        <Link to={`/imoveis/${imovel.id}`} className="imovel-mini__titulo">
          {imovel.titulo || 'Imóvel sem título'}
        </Link>
        <p className="imovel-mini__local">
          Cód. {imovel.id}
          {local && <> · {local}</>}
          {mostrarSituacao && imovel.status && <> · {rotuloStatus(imovel.status)}</>}
        </p>
      </div>
    </div>
  )
}
