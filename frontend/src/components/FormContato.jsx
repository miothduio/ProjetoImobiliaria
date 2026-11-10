import { useRef, useState } from 'react'
import { useAuth } from '../auth/contexto.js'
import { mensagemDeErro } from '../services/api.js'
import { enviarContatoGeral, enviarContatoImovel } from '../services/contatoService.js'
import { linkMailto } from '../utils/contato.js'
import { validarEmail, validarObrigatorio, validarTelefoneOpcional } from '../utils/validacao.js'

const LIMITE_MENSAGEM = 5000
const ORDEM_CAMPOS = ['nome', 'email', 'telefone', 'assunto', 'mensagem']

function validar(c) {
  return {
    nome: validarObrigatorio(c.nome, 'Informe seu nome.'),
    email: validarEmail(c.email),
    telefone: validarTelefoneOpcional(c.telefone),
    assunto: validarObrigatorio(c.assunto, 'Informe o assunto.'),
    mensagem:
      validarObrigatorio(c.mensagem, 'Escreva a mensagem.') ||
      (c.mensagem.length > LIMITE_MENSAGEM ? `A mensagem pode ter no máximo ${LIMITE_MENSAGEM} caracteres.` : null),
  }
}

function Campo({ id, rotulo, erro, opcional, children }) {
  return (
    <div className={`campo ${erro ? 'campo--erro' : ''}`}>
      <label htmlFor={id}>
        {rotulo}
        {opcional && <span className="campo__opcional"> (opcional)</span>}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="campo__erro">
          {erro}
        </p>
      )}
    </div>
  )
}

/**
 * Formulário "Entrar em contato". Assunto e mensagem chegam pré-preenchidos (rascunho)
 * e o cliente edita o que quiser antes de enviar. Envia pela API, que manda o e-mail
 * para a imobiliária com "responder para" no e-mail do cliente.
 * Com "imovel", usa POST /imoveis/{id}/contato; sem, POST /contato.
 */
export default function FormContato({ imovel, rascunho, onFechar }) {
  const { sessao, usuario } = useAuth()

  // nome/e-mail: enquanto a pessoa não digitar, usa os dados de quem está logado
  const [digitados, setDigitados] = useState({
    nome: null,
    email: null,
    telefone: '',
    assunto: rascunho.assunto,
    mensagem: rascunho.mensagem,
  })
  const campos = {
    ...digitados,
    nome: digitados.nome ?? usuario?.nome ?? '',
    email: digitados.email ?? usuario?.email ?? sessao?.email ?? '',
  }

  const [tocados, setTocados] = useState({})
  const [estado, setEstado] = useState({ status: 'editando', erro: null })
  const refs = useRef({})
  const erros = validar(campos)

  function alterar(evento) {
    const { name, value } = evento.target
    setDigitados((d) => ({ ...d, [name]: value }))
    if (estado.erro) setEstado({ status: 'editando', erro: null })
  }

  const sair = (evento) => setTocados((t) => ({ ...t, [evento.target.name]: true }))

  async function enviar(evento) {
    evento.preventDefault()
    setTocados(Object.fromEntries(ORDEM_CAMPOS.map((c) => [c, true])))
    const primeiroInvalido = ORDEM_CAMPOS.find((c) => erros[c])
    if (primeiroInvalido) {
      refs.current[primeiroInvalido]?.focus()
      return
    }

    const dados = {
      nome: campos.nome.trim(),
      email: campos.email.trim(),
      telefone: campos.telefone.trim() || null,
      assunto: campos.assunto.trim(),
      mensagem: campos.mensagem.trim(),
    }

    setEstado({ status: 'enviando', erro: null })
    try {
      if (imovel) await enviarContatoImovel(imovel.id, dados)
      else await enviarContatoGeral(dados)
      setEstado({ status: 'enviado', erro: null })
    } catch (error) {
      setEstado({ status: 'editando', erro: mensagemDeErro(error, 'Não foi possível enviar a mensagem.') })
    }
  }

  if (estado.status === 'enviado') {
    return (
      <div className="contato-enviado" role="status">
        <p className="contato-enviado__titulo">Mensagem enviada!</p>
        <p>
          A imobiliária recebeu seu contato e vai responder em <strong>{campos.email.trim()}</strong>.
        </p>
        {onFechar && (
          <button type="button" className="botao" onClick={onFechar}>
            Fechar
          </button>
        )}
      </div>
    )
  }

  const enviando = estado.status === 'enviando'
  const erro = (campo) => (tocados[campo] ? erros[campo] : null)
  const props = (campo) => ({
    id: `contato-${campo}`,
    name: campo,
    value: campos[campo],
    onChange: alterar,
    onBlur: sair,
    disabled: enviando,
    ref: (el) => {
      refs.current[campo] = el
    },
    'aria-invalid': Boolean(erro(campo)),
    'aria-describedby': erro(campo) ? `contato-${campo}-erro` : undefined,
  })

  return (
    <form className="formulario formulario--contato" onSubmit={enviar} noValidate>
      {estado.erro && (
        <p className="alerta alerta--erro" role="alert">
          {estado.erro}
        </p>
      )}

      <div className="formulario__linha">
        <Campo id="contato-nome" rotulo="Seu nome" erro={erro('nome')}>
          <input {...props('nome')} autoComplete="name" />
        </Campo>
        <Campo id="contato-email" rotulo="Seu e-mail" erro={erro('email')}>
          <input {...props('email')} type="email" inputMode="email" autoComplete="email" />
        </Campo>
      </div>

      <Campo id="contato-telefone" rotulo="Telefone" opcional erro={erro('telefone')}>
        <input {...props('telefone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="(55) 99999-0000" />
      </Campo>

      <Campo id="contato-assunto" rotulo="Assunto" erro={erro('assunto')}>
        <input {...props('assunto')} maxLength={150} />
      </Campo>

      <Campo id="contato-mensagem" rotulo="Mensagem" erro={erro('mensagem')}>
        <textarea {...props('mensagem')} rows={9} />
        <span className={`campo__contador ${campos.mensagem.length > LIMITE_MENSAGEM ? 'campo__contador--erro' : ''}`}>
          {campos.mensagem.length}/{LIMITE_MENSAGEM}
        </span>
      </Campo>

      <div className="formulario__acoes">
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? (
            <>
              <span className="spinner spinner--pequeno" aria-hidden="true" /> Enviando…
            </>
          ) : (
            'Enviar mensagem'
          )}
        </button>
        {onFechar && (
          <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={enviando}>
            Cancelar
          </button>
        )}
      </div>

      <p className="dica">
        Prefere usar seu programa de e-mail?{' '}
        <a href={linkMailto({ assunto: campos.assunto, mensagem: campos.mensagem })}>Abrir com este texto</a>
      </p>
    </form>
  )
}
