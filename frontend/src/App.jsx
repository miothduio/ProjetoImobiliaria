import { Route, Routes } from 'react-router-dom'
import RotaProtegida from './auth/RotaProtegida.jsx'
import { EQUIPE, PERFIS } from './auth/sessao.js'
import Layout from './components/Layout.jsx'
import Contato from './pages/Contato.jsx'
import ImovelDetalhe from './pages/ImovelDetalhe.jsx'
import Login from './pages/Login.jsx'
import NaoEncontrada from './pages/NaoEncontrada.jsx'
import Vitrine from './pages/Vitrine.jsx'
import AreaAdmin from './pages/admin/AreaAdmin.jsx'
import ContratosEquipe from './pages/admin/ContratosEquipe.jsx'
import OfertasEquipe from './pages/admin/OfertasEquipe.jsx'
import PainelAdmin from './pages/admin/PainelAdmin.jsx'
import Usuarios from './pages/admin/Usuarios.jsx'
import AreaCliente from './pages/cliente/AreaCliente.jsx'
import Favoritos from './pages/cliente/Favoritos.jsx'
import MeusContratos from './pages/cliente/MeusContratos.jsx'
import MinhasOfertas from './pages/cliente/MinhasOfertas.jsx'
import ResumoCliente from './pages/cliente/ResumoCliente.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Área pública */}
        <Route index element={<Vitrine />} />
        <Route path="imoveis/:id" element={<ImovelDetalhe />} />
        <Route path="contato" element={<Contato />} />
        <Route path="login" element={<Login />} />

        {/* Área do cliente (perfil USER no backend) */}
        <Route element={<RotaProtegida perfis={PERFIS.CLIENTE} />}>
          <Route path="cliente" element={<AreaCliente />}>
            <Route index element={<ResumoCliente />} />
            <Route path="ofertas" element={<MinhasOfertas />} />
            <Route path="favoritos" element={<Favoritos />} />
            <Route path="contratos" element={<MeusContratos />} />
          </Route>
        </Route>

        {/* Área da equipe: corretor e admin */}
        <Route element={<RotaProtegida perfis={EQUIPE} />}>
          <Route path="admin" element={<AreaAdmin />}>
            <Route index element={<PainelAdmin />} />
            <Route path="ofertas" element={<OfertasEquipe />} />
            <Route path="contratos" element={<ContratosEquipe />} />
            {/* só admin */}
            <Route element={<RotaProtegida perfis={PERFIS.ADMIN} />}>
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
