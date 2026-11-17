import { useState } from 'react'
import { mensagemDeErro } from '../services/api.js'
import { abrirPdfDoContrato } from '../services/contratosService.js'

/** Abre o PDF do contrato (a requisição leva o token). */
export default function BotaoPdf({ contrato, rotulo = 'Ver PDF' }) {
  const [estado, setEstado] = useState({ abrindo: false, erro: null })

  async function abrir() {
    setEstado({ abrindo: true, erro: null })
    try {
      await abrirPdfDoContrato(contrato.id)
      setEstado({ abrindo: false, erro: null })
    } catch (error) {
      setEstado({ abrindo: false, erro: mensagemDeErro(error, 'Não foi possível abrir o PDF.') })
    }
  }

  return (
    <>
      <button type="button" className="botao botao--secundario" onClick={abrir} disabled={estado.abrindo}>
        {estado.abrindo ? 'Abrindo…' : `📄 ${rotulo}`}
      </button>
      {estado.erro && (
        <span className="favorito__erro" role="alert">
          {estado.erro}
        </span>
      )}
    </>
  )
}
