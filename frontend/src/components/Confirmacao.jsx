import { useState } from 'react'
import Dialogo from './Dialogo.jsx'
import { mensagemDeErro } from '../services/api.js'

/**
 * Janela de confirmação para ações que mudam dados (aceitar, recusar, cancelar, excluir...).
 * "acao" recebe o motivo digitado (quando pedirMotivo) e devolve uma Promise.
 * Enquanto envia, os botões ficam travados; se a API recusar, a mensagem aparece aqui dentro.
 */
export default function Confirmacao({
  aberto,
  titulo,
  children,
  rotuloConfirmar = 'Confirmar',
  perigoso = false,
  pedirMotivo = false,
  rotuloMotivo = 'Motivo (opcional)',
  acao,
  onFechar,
  onConcluido,
}) {
  return (
    <Dialogo aberto={aberto} onFechar={onFechar} titulo={titulo}>
      {aberto && (
        <Corpo
          rotuloConfirmar={rotuloConfirmar}
          perigoso={perigoso}
          pedirMotivo={pedirMotivo}
          rotuloMotivo={rotuloMotivo}
          acao={acao}
          onFechar={onFechar}
          onConcluido={onConcluido}
        >
          {children}
        </Corpo>
      )}
    </Dialogo>
  )
}

function Corpo({ children, rotuloConfirmar, perigoso, pedirMotivo, rotuloMotivo, acao, onFechar, onConcluido }) {
  const [motivo, setMotivo] = useState('')
  const [estado, setEstado] = useState({ enviando: false, erro: null })

  async function confirmar(evento) {
    evento.preventDefault()
    setEstado({ enviando: true, erro: null })
    try {
      const resultado = await acao(motivo.trim())
      onConcluido?.(resultado)
    } catch (error) {
      setEstado({ enviando: false, erro: mensagemDeErro(error) })
    }
  }

  return (
    <form className="formulario" onSubmit={confirmar}>
      <div className="confirmacao__texto">{children}</div>
      {pedirMotivo && (
        <div className="campo">
          <label htmlFor="confirmacao-motivo">{rotuloMotivo}</label>
          <textarea id="confirmacao-motivo" rows={3} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      )}
      {estado.erro && (
        <p className="alerta alerta--erro" role="alert">
          {estado.erro}
        </p>
      )}
      <div className="formulario__acoes">
        <button type="submit" className={`botao ${perigoso ? 'botao--perigo' : 'botao--destaque'}`} disabled={estado.enviando}>
          {estado.enviando ? 'Aguarde…' : rotuloConfirmar}
        </button>
        <button type="button" className="botao botao--secundario" onClick={onFechar} disabled={estado.enviando}>
          Voltar
        </button>
      </div>
    </form>
  )
}
