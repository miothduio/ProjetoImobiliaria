import { useEffect, useState } from 'react'
import { listarFotosDoImovel } from '../services/imoveisService.js'
import { urlDoBackend } from '../services/api.js'
import { localizacao, rotuloFinalidade, valorPrincipal } from '../utils/imovel.js'

function useCapa(imovelId) {
  const [capa, setCapa] = useState(null)

  useEffect(() => {
    let ativo = true
    listarFotosDoImovel(imovelId)
      .then((fotos) => {
        const foto = fotos.find((f) => f.capa) || fotos[0]
        if (ativo) setCapa(foto ? urlDoBackend(foto.url) : null)
      })
      .catch(() => {
        // sem foto: o card mostra a ilustração padrão
      })
    return () => {
      ativo = false
    }
  }, [imovelId])

  return capa
}

function Detalhe({ valor, rotulo }) {
  if (valor == null || valor === '') return null
  return (
    <li>
      <strong>{valor}</strong> {rotulo}
    </li>
  )
}

export default function ImovelCard({ imovel }) {
  const capa = useCapa(imovel.id)
  const [fotoFalhou, setFotoFalhou] = useState(false)
  const { valor, sufixo } = valorPrincipal(imovel)
  const finalidade = rotuloFinalidade(imovel.finalidade)
  const tipo = imovel.tipoImovel?.nome
  const local = localizacao(imovel)
  const area = imovel.areaConstruida ?? imovel.areaTotal

  return (
    <article className="card">
      <div className="card__foto">
        {capa && !fotoFalhou ? (
          <img src={capa} alt={imovel.titulo || 'Foto do imóvel'} loading="lazy" onError={() => setFotoFalhou(true)} />
        ) : (
          <div className="card__sem-foto" aria-label="Imóvel sem foto">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M12 30 32 14l20 16v20a2 2 0 0 1-2 2H39V38H25v14H14a2 2 0 0 1-2-2z" />
            </svg>
          </div>
        )}
        {finalidade && <span className="selo">{finalidade}</span>}
      </div>

      <div className="card__corpo">
        <p className="card__meta">
          {tipo && <span className="etiqueta">{tipo}</span>}
          <span className="card__codigo">Cód. {imovel.id}</span>
        </p>
        <h2 className="card__titulo">{imovel.titulo || 'Imóvel sem título'}</h2>
        {local && <p className="card__local">{local}</p>}

        <ul className="card__detalhes">
          <Detalhe valor={imovel.dormitorios} rotulo={imovel.dormitorios === 1 ? 'dorm.' : 'dorms.'} />
          <Detalhe valor={imovel.banheiros} rotulo={imovel.banheiros === 1 ? 'banh.' : 'banhs.'} />
          <Detalhe valor={imovel.garagem} rotulo={imovel.garagem === 1 ? 'vaga' : 'vagas'} />
          <Detalhe valor={area != null ? `${Number(area).toLocaleString('pt-BR')} m²` : null} rotulo="" />
        </ul>

        <p className="card__preco">
          {valor ? (
            <>
              {valor}
              {sufixo && <small>{sufixo}</small>}
            </>
          ) : (
            <span className="card__consulte">Valor sob consulta</span>
          )}
        </p>
      </div>
    </article>
  )
}
