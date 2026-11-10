import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/contexto.js'
import { PERFIS } from '../auth/sessao.js'
import BarraLateral from './BarraLateral.jsx'

/**
 * Abas do topo conforme quem está navegando.
 * "ativa" recebe a URL atual: Comprar/Alugar são a vitrine com ?finalidade=,
 * então não dá para usar o NavLink (ele ignora a query string).
 */
function abasDoMenu(perfil) {
  const finalidade = (busca) => new URLSearchParams(busca).get('finalidade')
  const abas = [
    { para: '/', rotulo: 'Início', ativa: (p, b) => p === '/' && !finalidade(b) },
    { para: '/?finalidade=VENDA', rotulo: 'Comprar', ativa: (p, b) => p === '/' && finalidade(b) === 'VENDA' },
    { para: '/?finalidade=ALUGUEL', rotulo: 'Alugar', ativa: (p, b) => p === '/' && finalidade(b) === 'ALUGUEL' },
    { para: '/contato', rotulo: 'Contato', ativa: (p) => p === '/contato' },
  ]
  if (perfil === PERFIS.ADMIN) abas.push({ para: '/admin', rotulo: 'Painel', ativa: (p) => p.startsWith('/admin') })
  if (perfil === PERFIS.CLIENTE) abas.push({ para: '/cliente', rotulo: 'Minha área', ativa: (p) => p.startsWith('/cliente') })
  if (!perfil) abas.push({ para: '/login', rotulo: 'Entrar', ativa: (p) => p === '/login' })
  return abas
}

function AvisoSessao() {
  const { aviso, limparAviso } = useAuth()
  const { pathname } = useLocation()
  // na tela de login o aviso já aparece dentro do formulário
  if (aviso?.tipo !== 'expirada' || pathname === '/login') return null

  return (
    <div className="aviso-sessao" role="status">
      <span>{aviso.texto}</span>
      <span className="aviso-sessao__acoes">
        <Link to="/login">Entrar</Link>
        <button type="button" onClick={limparAviso} aria-label="Fechar aviso">
          ×
        </button>
      </span>
    </div>
  )
}

export default function Layout() {
  const { sessao, usuario, sair } = useAuth()
  const { pathname, search } = useLocation()
  const nomeCurto = usuario?.nome?.split(' ')[0] || sessao?.email

  return (
    <div className="moldura">
      <header className="banner">
        <Link to="/" className="banner__titulo">
          <img src="/favicon.svg" alt="" width="44" height="44" />
          Imobiliária
        </Link>
        <p className="banner__descricao">Casas, apartamentos e terrenos para comprar ou alugar em Panambi e região</p>
      </header>

      <nav className="abas" aria-label="Menu principal">
        <ul>
          {abasDoMenu(sessao?.perfil).map((aba) => {
            const ativa = aba.ativa(pathname, search)
            return (
              <li key={aba.para}>
                <Link to={aba.para} className={ativa ? 'ativa' : undefined} aria-current={ativa ? 'page' : undefined}>
                  {aba.rotulo}
                </Link>
              </li>
            )
          })}
        </ul>
        {sessao && (
          <p className="conta">
            Olá, <strong title={sessao.email}>{nomeCurto}</strong>
            {sessao.perfil === PERFIS.ADMIN && <span className="conta__perfil">admin</span>}
            <span aria-hidden="true"> | </span>
            <button type="button" className="link" onClick={sair}>
              Sair
            </button>
          </p>
        )}
      </nav>

      <AvisoSessao />

      <div className="colunas">
        <main className="conteudo">
          <Outlet />
        </main>
        <BarraLateral />
      </div>

      <footer className="rodape">
        <p>Imobiliária | Projeto final Web4, IFFar Panambi</p>
        <p className="rodape__nota">Site melhor visualizado em 1024x768 com qualquer navegador moderno.</p>
      </footer>
    </div>
  )
}
