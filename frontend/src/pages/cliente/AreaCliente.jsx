import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/contexto.js'
import MenuArea from '../../components/MenuArea.jsx'
import { useFavoritos } from '../../favoritos/contexto.js'

const horario = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Moldura da área do cliente: título, abas internas e a tela escolhida. */
export default function AreaCliente() {
  const { sessao, usuario } = useAuth()
  const { total } = useFavoritos()
  const nome = usuario?.nome?.split(' ')[0]

  return (
    <section>
      <header className="cabecalho-pagina">
        <h1>{nome ? `Olá, ${nome}!` : 'Área do cliente'}</h1>
        <p className="cabecalho-pagina__info">
          {sessao.email}, sessão válida até {horario.format(sessao.expiraEm)}
        </p>
      </header>

      <MenuArea
        rotulo="Área do cliente"
        itens={[
          { para: '/cliente', rotulo: 'Resumo', exato: true },
          { para: '/cliente/ofertas', rotulo: 'Minhas ofertas' },
          { para: '/cliente/favoritos', rotulo: 'Favoritos', contador: total },
          { para: '/cliente/contratos', rotulo: 'Contratos' },
        ]}
      />

      <Outlet />
    </section>
  )
}
