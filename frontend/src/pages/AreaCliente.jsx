import { Link } from 'react-router-dom'
import { useAuth } from '../auth/contexto.js'

const horario = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

const SECOES = [
  { titulo: 'Minhas ofertas', texto: 'Acompanhe as propostas que você fez e a situação de cada uma.' },
  { titulo: 'Favoritos', texto: 'Guarde os imóveis que você quer ver de novo.' },
  { titulo: 'Contratos', texto: 'Assine e consulte os contratos das ofertas aceitas.' },
]

export default function AreaCliente() {
  const { sessao, usuario } = useAuth()
  const nome = usuario?.nome?.split(' ')[0]

  return (
    <section>
      <header className="cabecalho-pagina">
        <h1>{nome ? `Olá, ${nome}!` : 'Área do cliente'}</h1>
        <p className="cabecalho-pagina__info">
          {sessao.email}, sessão válida até {horario.format(sessao.expiraEm)}
        </p>
      </header>

      <div className="atalhos">
        {SECOES.map((secao) => (
          <article key={secao.titulo} className="atalho atalho--inativo">
            <h2>{secao.titulo}</h2>
            <p>{secao.texto}</p>
            <span className="etiqueta">Em breve</span>
          </article>
        ))}
        <Link to="/" className="atalho atalho--destaque">
          <h2>Procurar imóveis</h2>
          <p>Encontre um imóvel disponível e faça sua oferta.</p>
          <span className="atalho__mais">Ver imóveis »</span>
        </Link>
      </div>
    </section>
  )
}
