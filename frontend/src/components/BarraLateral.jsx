import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/contexto.js'
import { ROTA_INICIAL } from '../auth/sessao.js'
import { listarBairros } from '../services/imoveisService.js'
import { contarVisita } from '../utils/visitas.js'

function Widget({ titulo, children }) {
  return (
    <section className="widget">
      <h2 className="widget__titulo">{titulo}</h2>
      <div className="widget__corpo">{children}</div>
    </section>
  )
}

function useBairros() {
  const [bairros, setBairros] = useState(null)
  useEffect(() => {
    let ativo = true
    listarBairros()
      .then((lista) => {
        const ordenados = [...lista].sort((a, b) =>
          `${a.cidade ?? ''} ${a.nome ?? ''}`.localeCompare(`${b.cidade ?? ''} ${b.nome ?? ''}`, 'pt-BR'),
        )
        if (ativo) setBairros(ordenados)
      })
      .catch(() => ativo && setBairros([]))
    return () => {
      ativo = false
    }
  }, [])
  return bairros
}

/** Barra lateral de blog: quem somos, bairros (como "marcadores"), contador e selos. */
export default function BarraLateral() {
  const { sessao } = useAuth()
  const bairros = useBairros()
  const [visitas] = useState(contarVisita)

  return (
    <aside className="lateral" aria-label="Barra lateral">
      <Widget titulo="Quem somos">
        <div className="perfil">
          <img src="/favicon.svg" alt="" width="56" height="56" />
          <p>
            Imobiliária de Panambi/RS. Casas, apartamentos, terrenos e salas comerciais para comprar ou alugar na
            região.
          </p>
        </div>
        <p className="widget__rodape">
          <Link to="/contato">Fale com a gente »</Link>
        </p>
      </Widget>

      <Widget titulo="Bairros">
        {bairros === null && <p className="widget__vazio">Carregando…</p>}
        {bairros?.length === 0 && <p className="widget__vazio">Nenhum bairro cadastrado.</p>}
        {bairros?.length > 0 && (
          <ul className="marcadores">
            {bairros.map((b) => (
              <li key={b.id}>
                <Link to={`/?bairro=${b.id}`}>{b.nome}</Link>
                {b.cidade && <span className="marcadores__cidade"> ({b.cidade})</span>}
              </li>
            ))}
          </ul>
        )}
      </Widget>

      <Widget titulo="Sua conta">
        {sessao ? (
          <p>
            Você está conectado como <strong>{sessao.email}</strong>.{' '}
            <Link to={ROTA_INICIAL[sessao.perfil]}>{sessao.perfil === 'ADMIN' ? 'Ir para o painel' : 'Ir para minha área'} »</Link>
          </p>
        ) : (
          <p>
            Clientes acompanham ofertas, favoritos e contratos. <Link to="/login">Entrar »</Link>
          </p>
        )}
      </Widget>

      <Widget titulo="Contador de visitas">
        <p className="contador" aria-label={`Você visitou este site ${visitas} vezes`}>
          {String(visitas).padStart(6, '0').split('').map((digito, i) => (
            <span key={i} aria-hidden="true">
              {digito}
            </span>
          ))}
        </p>
        <p className="widget__vazio">visitas feitas por este navegador</p>
      </Widget>

      <div className="selos" aria-label="Feito com">
        <span className="selo88 selo88--react">
          <b>REACT</b> 19
        </span>
        <span className="selo88 selo88--java">
          <b>JAVA</b> Spring
        </span>
        <span className="selo88 selo88--iffar">
          <b>IFFar</b> Panambi
        </span>
      </div>
    </aside>
  )
}
