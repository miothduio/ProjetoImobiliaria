import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/contexto.js'
import { destinoAposLogin } from '../auth/sessao.js'
import { mensagemDeErro } from '../services/api.js'
import { validarEmail, validarObrigatorio } from '../utils/validacao.js'

function validar({ email, senha }) {
  return {
    email: validarEmail(email),
    senha: validarObrigatorio(senha, 'Informe a senha.'),
  }
}

/** Mensagem do erro de login, sem nunca mostrar JSON. */
function mensagemDoLogin(error) {
  const status = error?.response?.status
  if (status === 401) return 'E-mail ou senha incorretos. Confira os dados e tente novamente.'
  if (status === 400) return 'Confira o e-mail e a senha informados.'
  return mensagemDeErro(error, 'Não foi possível entrar agora. Tente novamente.')
}

export default function Login() {
  const { sessao, aviso, entrar, limparAviso } = useAuth()
  const location = useLocation()
  const de = location.state?.de

  // guarda o aviso ("sessão expirou" / "você saiu") só para esta tela e limpa do contexto
  const [avisoDaTela] = useState(aviso)
  useEffect(() => {
    limparAviso()
  }, [limparAviso])

  const [campos, setCampos] = useState({ email: '', senha: '' })
  const [erros, setErros] = useState({})
  const [tocados, setTocados] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroServidor, setErroServidor] = useState(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const emailRef = useRef(null)
  const senhaRef = useRef(null)

  // já logado (ou acabou de entrar): vai para a área do perfil ou para a página que tentou abrir
  if (sessao) {
    return <Navigate to={destinoAposLogin(sessao, de)} replace />
  }

  function alterar(evento) {
    const { name, value } = evento.target
    const novos = { ...campos, [name]: value }
    setCampos(novos)
    setErroServidor(null)
    // depois que o campo foi visitado, o erro some/aparece enquanto digita
    if (tocados[name]) setErros(validar(novos))
  }

  function sair(evento) {
    const { name } = evento.target
    setTocados((t) => ({ ...t, [name]: true }))
    setErros(validar(campos))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const encontrados = validar(campos)
    setErros(encontrados)
    setTocados({ email: true, senha: true })

    if (encontrados.email) return emailRef.current?.focus()
    if (encontrados.senha) return senhaRef.current?.focus()

    setEnviando(true)
    setErroServidor(null)
    try {
      await entrar(campos.email, campos.senha)
      // o redirecionamento acontece no próximo render (bloco "if (sessao)" acima)
    } catch (error) {
      setErroServidor(mensagemDoLogin(error))
      setCampos((c) => ({ ...c, senha: '' }))
      senhaRef.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  const erroEmail = tocados.email && erros.email
  const erroSenha = tocados.senha && erros.senha

  let avisoTopo = null
  if (avisoDaTela) avisoTopo = avisoDaTela
  else if (de) avisoTopo = { tipo: 'info', texto: 'Entre com sua conta para acessar essa página.' }

  return (
    <section className="login">
      <div className="login__cartao">
        <header className="login__cabecalho">
          <h1>Entrar</h1>
          <p>Acesse sua área de cliente ou o painel da imobiliária.</p>
        </header>

        {avisoTopo && (
          <p className={`alerta alerta--${avisoTopo.tipo === 'expirada' ? 'atencao' : 'info'}`} role="status">
            {avisoTopo.texto}
          </p>
        )}

        {erroServidor && (
          <p className="alerta alerta--erro" role="alert">
            {erroServidor}
          </p>
        )}

        <form className="formulario" onSubmit={enviar} noValidate>
          <div className={`campo ${erroEmail ? 'campo--erro' : ''}`}>
            <label htmlFor="email">E-mail</label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="nome@exemplo.com"
              value={campos.email}
              onChange={alterar}
              onBlur={sair}
              aria-invalid={Boolean(erroEmail)}
              aria-describedby={erroEmail ? 'email-erro' : undefined}
              disabled={enviando}
            />
            {erroEmail && (
              <p id="email-erro" className="campo__erro">
                {erros.email}
              </p>
            )}
          </div>

          <div className={`campo ${erroSenha ? 'campo--erro' : ''}`}>
            <label htmlFor="senha">Senha</label>
            <div className="campo__senha">
              <input
                ref={senhaRef}
                id="senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                value={campos.senha}
                onChange={alterar}
                onBlur={sair}
                aria-invalid={Boolean(erroSenha)}
                aria-describedby={erroSenha ? 'senha-erro' : undefined}
                disabled={enviando}
              />
              <button
                type="button"
                className="campo__mostrar"
                onClick={() => setMostrarSenha((m) => !m)}
                aria-pressed={mostrarSenha}
                disabled={enviando}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {erroSenha && (
              <p id="senha-erro" className="campo__erro">
                {erros.senha}
              </p>
            )}
          </div>

          <button type="submit" className="botao botao--largo" disabled={enviando}>
            {enviando ? (
              <>
                <span className="spinner spinner--pequeno" aria-hidden="true" /> Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="login__rodape">
          <Link to="/">Voltar para os imóveis</Link>
        </p>
      </div>
    </section>
  )
}
