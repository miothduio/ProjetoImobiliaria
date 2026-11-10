import { useEffect, useRef } from 'react'

/**
 * Janela modal com o <dialog> nativo do navegador: prende o foco, fecha com Esc
 * e devolve o foco para o botão que abriu. Clicar fora (no fundo escuro) também fecha.
 */
export default function Dialogo({ aberto, onFechar, titulo, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  function clicarFora(evento) {
    if (evento.target === ref.current) onFechar()
  }

  return (
    <dialog ref={ref} className="dialogo" onClose={onFechar} onClick={clicarFora} aria-labelledby="dialogo-titulo">
      {aberto && (
        <div className="dialogo__conteudo">
          <header className="dialogo__cabecalho">
            <h2 id="dialogo-titulo">{titulo}</h2>
            <button type="button" className="dialogo__fechar" onClick={onFechar} aria-label="Fechar">
              ×
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
