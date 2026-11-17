import { useState } from 'react'
import { useAuth } from '../../auth/contexto.js'
import Confirmacao from '../../components/Confirmacao.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback.jsx'
import { useDados } from '../../hooks/useDados.js'
import { mensagemDeErro } from '../../services/api.js'
import { alterarUsuario, criarUsuario, excluirUsuario, listarUsuarios } from '../../services/usuariosService.js'
import { normalizar } from '../../utils/imovel.js'
import { validarEmail, validarObrigatorio } from '../../utils/validacao.js'

const PERFIS_USUARIO = [
  { valor: 'USER', rotulo: 'Cliente' },
  { valor: 'CORRETOR', rotulo: 'Corretor' },
  { valor: 'ADMIN', rotulo: 'Administrador' },
]
const rotuloPerfil = (tipo) => PERFIS_USUARIO.find((p) => p.valor === (normalizar(tipo) || 'USER'))?.rotulo ?? tipo

function FormUsuario({ usuario, ehVoceMesmo, onSalvo, onFechar }) {
  const novo = !usuario
  const [campos, setCampos] = useState({
    nome: usuario?.nome ?? '',
    email: usuario?.email ?? '',
    tipo: normalizar(usuario?.tipo) || 'USER',
    senha: '',
  })
  const [tentou, setTentou] = useState(false)
  const [estado, setEstado] = useState({ enviando: false, erro: null })

  const erros = {
    nome: validarObrigatorio(campos.nome, 'Informe o nome.'),
    email: validarEmail(campos.email),
    senha: novo
      ? validarObrigatorio(campos.senha, 'Defina uma senha.') || (campos.senha.length < 6 ? 'Use pelo menos 6 caracteres.' : null)
      : campos.senha && campos.senha.length < 6
        ? 'Use pelo menos 6 caracteres.'
        : null,
  }
  const mostrar = (c) => (tentou ? erros[c] : null)
  const alterar = (e) => setCampos((c) => ({ ...c, [e.target.name]: e.target.value }))

  async function salvar(evento) {
    evento.preventDefault()
    setTentou(true)
    if (Object.values(erros).some(Boolean)) return
    setEstado({ enviando: true, erro: null })
    const dados = { nome: campos.nome.trim(), email: campos.email.trim(), tipo: campos.tipo }
    if (campos.senha) dados.senha = campos.senha
    try {
      if (novo) await criarUsuario(dados)
      else await alterarUsuario(usuario.id, dados)
      onSalvo(dados)
    } catch (error) {
      setEstado({ enviando: false, erro: mensagemDeErro(error, 'Não foi possível salvar.') })
    }
  }

  return (
    <form className="formulario" onSubmit={salvar} noValidate>
      {[
        ['nome', 'Nome completo', 'text', 'name'],
        ['email', 'E-mail', 'email', 'email'],
      ].map(([nome, rotulo, tipo, auto]) => (
        <div key={nome} className={`campo ${mostrar(nome) ? 'campo--erro' : ''}`}>
          <label htmlFor={`usuario-${nome}`}>{rotulo}</label>
          <input id={`usuario-${nome}`} name={nome} type={tipo} autoComplete={auto} value={campos[nome]} onChange={alterar} aria-invalid={Boolean(mostrar(nome))} />
          {mostrar(nome) && <p className="campo__erro">{erros[nome]}</p>}
        </div>
      ))}
      <div className="campo">
        <label htmlFor="usuario-tipo">Perfil</label>
        <select id="usuario-tipo" name="tipo" value={campos.tipo} onChange={alterar} disabled={ehVoceMesmo}>
          {PERFIS_USUARIO.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </select>
        {ehVoceMesmo && <p className="dica">Você não pode tirar o seu próprio perfil de administrador.</p>}
      </div>
      <div className={`campo ${mostrar('senha') ? 'campo--erro' : ''}`}>
        <label htmlFor="usuario-senha">
          {novo ? 'Senha' : 'Nova senha'} {!novo && <span className="campo__opcional">(deixe em branco para manter)</span>}
        </label>
        <input id="usuario-senha" name="senha" type="password" autoComplete="new-password" value={campos.senha} onChange={alterar} aria-invalid={Boolean(mostrar('senha'))} />
        {mostrar('senha') && <p className="campo__erro">{erros.senha}</p>}
      </div>
      {estado.erro && (
        <p className="alerta alerta--erro" role="alert">
          {estado.erro}
        </p>
      )}
      <div className="formulario__acoes">
        <button type="submit" className="botao botao--destaque" disabled={estado.enviando}>
          {estado.enviando ? 'Salvando…' : novo ? 'Cadastrar' : 'Salvar'}
        </button>
        <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={estado.enviando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function Usuarios() {
  const { sessao } = useAuth()
  const lista = useDados(({ signal }) => listarUsuarios({ signal }), [])
  const [busca, setBusca] = useState('')
  const [perfil, setPerfil] = useState('')
  const [editando, setEditando] = useState(null) // null | 'novo' | usuario
  const [excluindo, setExcluindo] = useState(null)
  const [aviso, setAviso] = useState(null)

  const ehVoce = (u) => u.email?.toLowerCase() === sessao.email.toLowerCase()
  const termo = normalizar(busca)
  const filtrados = (lista.dados ?? []).filter(
    (u) =>
      (!termo || normalizar(u.nome).includes(termo) || normalizar(u.email).includes(termo)) &&
      (!perfil || (normalizar(u.tipo) || 'USER') === perfil),
  )

  return (
    <>
      <div className="barra-ferramentas">
        <div className="campo campo--linha">
          <label htmlFor="busca-usuario">Buscar</label>
          <input id="busca-usuario" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="nome ou e-mail" />
        </div>
        <div className="campo campo--linha">
          <label htmlFor="filtro-perfil">Perfil</label>
          <select id="filtro-perfil" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            <option value="">Todos</option>
            {PERFIS_USUARIO.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="botao botao--destaque" onClick={() => setEditando('novo')}>
          + Novo usuário
        </button>
      </div>

      {aviso && (
        <p className="alerta alerta--info" role="status">
          {aviso}
        </p>
      )}
      {lista.status === 'carregando' && <Carregando texto="Carregando usuários…" />}
      {lista.status === 'erro' && <MensagemErro mensagem={lista.erro} onTentarNovamente={lista.recarregar} />}
      {lista.status === 'ok' && filtrados.length === 0 && (
        <SemResultados titulo="Nenhum usuário encontrado">{busca || perfil ? 'Tente outra busca.' : null}</SemResultados>
      )}
      {lista.status === 'ok' && filtrados.length > 0 && (
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">E-mail</th>
              <th scope="col">Perfil</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id}>
                <td data-rotulo="Nome">
                  {u.nome || <em>sem nome</em>} {ehVoce(u) && <span className="conta__perfil">você</span>}
                </td>
                <td data-rotulo="E-mail">{u.email}</td>
                <td data-rotulo="Perfil">{rotuloPerfil(u.tipo)}</td>
                <td className="tabela__acoes">
                  <button type="button" className="botao botao--secundario" onClick={() => setEditando(u)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={() => setExcluindo(u)}
                    disabled={ehVoce(u)}
                    title={ehVoce(u) ? 'Você não pode excluir a sua própria conta' : undefined}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialogo aberto={Boolean(editando)} onFechar={() => setEditando(null)} titulo={editando === 'novo' ? 'Novo usuário' : 'Editar usuário'}>
        {editando && (
          <FormUsuario
            usuario={editando === 'novo' ? null : editando}
            ehVoceMesmo={editando !== 'novo' && ehVoce(editando)}
            onFechar={() => setEditando(null)}
            onSalvo={(dados) => {
              setAviso(editando === 'novo' ? `${dados.nome} cadastrado como ${rotuloPerfil(dados.tipo).toLowerCase()}.` : `${dados.nome} atualizado.`)
              setEditando(null)
              lista.recarregar()
            }}
          />
        )}
      </Dialogo>

      <Confirmacao
        aberto={Boolean(excluindo)}
        titulo="Excluir usuário"
        rotuloConfirmar="Excluir"
        perigoso
        acao={() => excluirUsuario(excluindo.id)}
        onFechar={() => setExcluindo(null)}
        onConcluido={() => {
          setAviso(`${excluindo.nome || excluindo.email} foi excluído.`)
          setExcluindo(null)
          lista.recarregar()
        }}
      >
        {excluindo && (
          <>
            <p>
              Excluir <strong>{excluindo.nome || excluindo.email}</strong> ({excluindo.email})?
            </p>
            <p>As ofertas, contratos e favoritos dele também serão apagados. Se ele tinha um imóvel reservado, o imóvel volta a ficar disponível.</p>
          </>
        )}
      </Confirmacao>
    </>
  )
}
