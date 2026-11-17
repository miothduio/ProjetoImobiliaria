import { NavLink } from 'react-router-dom'

/** Abas internas de uma área (cliente ou admin), no estilo das abas do topo. */
export default function MenuArea({ itens, rotulo }) {
  return (
    <nav className="menu-area" aria-label={rotulo}>
      <ul>
        {itens.map((item) => (
          <li key={item.para}>
            <NavLink to={item.para} end={item.exato}>
              {item.rotulo}
              {item.contador > 0 && <span className="menu-area__contador">{item.contador}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
