import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Vitrine from './pages/Vitrine.jsx'
import NaoEncontrada from './pages/NaoEncontrada.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Vitrine />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
