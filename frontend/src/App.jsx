import { Route, Routes } from 'react-router-dom'
import RotaProtegida from './auth/RotaProtegida.jsx'
import { PERFIS } from './auth/sessao.js'
import Layout from './components/Layout.jsx'
import AreaCliente from './pages/AreaCliente.jsx'
import Contato from './pages/Contato.jsx'
import ImovelDetalhe from './pages/ImovelDetalhe.jsx'
import Login from './pages/Login.jsx'
import NaoEncontrada from './pages/NaoEncontrada.jsx'
import PainelAdmin from './pages/PainelAdmin.jsx'
import Vitrine from './pages/Vitrine.jsx'

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
        <Route element={<RotaProtegida perfil={PERFIS.CLIENTE} />}>
          <Route path="cliente" element={<AreaCliente />} />
        </Route>

        {/* Painel do admin */}
        <Route element={<RotaProtegida perfil={PERFIS.ADMIN} />}>
          <Route path="admin" element={<PainelAdmin />} />
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
