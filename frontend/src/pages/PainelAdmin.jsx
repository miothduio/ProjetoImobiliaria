import { useEffect, useState } from 'react'
import { useAuth } from '../auth/contexto.js'
import { Carregando, MensagemErro } from '../components/Feedback.jsx'
import { mensagemDeErro } from '../services/api.js'
import { listarImoveis } from '../services/imoveisService.js'
import { listarUsuarios } from '../services/usuariosService.js'
import { estaDisponivel } from '../utils/imovel.js'

function Total({ rotulo, valor }) {
  return (
    <div className="total">
      <p className="total__valor">{valor.toLocaleString('pt-BR')}</p>
      <p className="total__rotulo">{rotulo}</p>
    </div>
  )
}

/**
 * Painel do admin. Por enquanto mostra totais básicos; GET /users só responde
 * com o token de ADMIN, então esta tela já exercita a requisição autenticada (JWT).
 */
export default function PainelAdmin() {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState({ status: 'carregando', dados: null, erro: null })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    Promise.all([listarImoveis(), listarUsuarios()])
      .then(([imoveis, usuarios]) => {
        if (!ativo) return
        setEstado({
          status: 'ok',
          erro: null,
          dados: {
            imoveis: imoveis.length,
            disponiveis: imoveis.filter(estaDisponivel).length,
            usuarios: usuarios.length,
            clientes: usuarios.filter((u) => String(u.tipo ?? '').toUpperCase() !== 'ADMIN').length,
          },
        })
      })
      .catch((error) => {
        // 401 já foi tratado pelo interceptor (desloga e volta ao login)
        if (ativo) setEstado({ status: 'erro', dados: null, erro: mensagemDeErro(error) })
      })
    return () => {
      ativo = false
    }
  }, [tentativa])

  function recarregar() {
    setEstado({ status: 'carregando', dados: null, erro: null })
    setTentativa((n) => n + 1)
  }

  const { status, dados, erro } = estado

  return (
    <section>
      <header className="cabecalho-pagina">
        <h1>Painel administrativo</h1>
        {usuario?.nome && <p className="cabecalho-pagina__info">Olá, {usuario.nome.split(' ')[0]}</p>}
      </header>

      {status === 'carregando' && <Carregando texto="Carregando totais…" />}
      {status === 'erro' && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {status === 'ok' && (
        <div className="totais">
          <Total rotulo="Imóveis cadastrados" valor={dados.imoveis} />
          <Total rotulo="Imóveis disponíveis" valor={dados.disponiveis} />
          <Total rotulo="Usuários" valor={dados.usuarios} />
          <Total rotulo="Clientes" valor={dados.clientes} />
        </div>
      )}
    </section>
  )
}
