/**
 * Filtro por situação no formato "marcadores" de blog: Todas | Pendentes | ...
 * O valor fica na URL (?status=), então dá para voltar e compartilhar o filtro.
 */
export default function FiltroSituacao({ situacoes, atual, onTrocar }) {
  const opcoes = [{ valor: '', rotulo: 'Todas' }, ...situacoes]
  return (
    <div className="filtro-situacao" role="group" aria-label="Filtrar por situação">
      <span className="filtro-situacao__rotulo">Situação:</span>
      {opcoes.map((s) => (
        <button
          key={s.valor || 'todas'}
          type="button"
          className="filtro-situacao__opcao"
          aria-pressed={(atual || '') === s.valor}
          onClick={() => onTrocar(s.valor)}
        >
          {s.rotulo}
        </button>
      ))}
    </div>
  )
}
