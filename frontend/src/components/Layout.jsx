import { Link, NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app">
      <header className="topo">
        <div className="topo__conteudo container">
          <Link to="/" className="marca" aria-label="Página inicial">
            <img src="/favicon.svg" alt="" width="32" height="32" />
            <span>Imobiliária</span>
          </Link>
          <nav className="menu" aria-label="Menu principal">
            <NavLink to="/" end>
              Imóveis
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container principal">
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="container">Projeto final Web4 · IFFar Panambi</div>
      </footer>
    </div>
  )
}
