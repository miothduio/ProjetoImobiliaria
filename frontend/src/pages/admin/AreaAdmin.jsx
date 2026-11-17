import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/contexto.js'
import { PERFIS } from '../../auth/sessao.js'
import MenuArea from '../../components/MenuArea.jsx'

/** Moldura da área da equipe. O corretor vê painel, ofertas e contratos; o admin vê também os usuários. */
export default function AreaAdmin() {
  const { sessao, usuario } = useAuth()
  const admin = sessao.perfil === PERFIS.ADMIN
  const itens = [
    { para: '/admin', rotulo: 'Painel', exato: true },
    { para: '/admin/ofertas', rotulo: 'Ofertas' },
    { para: '/admin/contratos', rotulo: 'Contratos' },
  ]
  if (admin) itens.push({ para: '/admin/usuarios', rotulo: 'Usuários' })

  return (
    <section>
      <header className="cabecalho-pagina">
        <h1>{admin ? 'Painel administrativo' : 'Painel do corretor'}</h1>
        {usuario?.nome && <p className="cabecalho-pagina__info">Olá, {usuario.nome.split(' ')[0]}</p>}
      </header>
      <MenuArea rotulo="Área da equipe" itens={itens} />
      <Outlet />
    </section>
  )
}
