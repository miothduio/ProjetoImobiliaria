/** Selo da situação (oferta ou contrato). O texto sempre aparece: a cor só reforça. */
export default function Situacao({ situacao }) {
  return <span className={`situacao situacao--${situacao.tom}`}>{situacao.rotulo}</span>
}
