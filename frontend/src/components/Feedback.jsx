/** Estados padrão de toda tela que busca dados: carregando, sem resultados e erro. */

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <div className="feedback" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  )
}

export function SemResultados({ titulo = 'Nenhum resultado', children }) {
  return (
    <div className="feedback">
      <p className="feedback__titulo">{titulo}</p>
      {children && <p className="feedback__texto">{children}</p>}
    </div>
  )
}

export function MensagemErro({ mensagem, onTentarNovamente }) {
  return (
    <div className="feedback feedback--erro" role="alert">
      <p className="feedback__titulo">Não foi possível carregar</p>
      <p className="feedback__texto">{mensagem}</p>
      {onTentarNovamente && (
        <button type="button" className="botao botao--secundario" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}
