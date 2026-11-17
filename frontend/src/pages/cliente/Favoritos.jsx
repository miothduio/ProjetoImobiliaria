import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback.jsx'
import ImovelMini from '../../components/ImovelMini.jsx'
import Situacao from '../../components/Situacao.jsx'
import { useFavoritos } from '../../favoritos/contexto.js'
import { useDados } from '../../hooks/useDados.js'
import { listarFavoritos } from '../../services/favoritosService.js'
import { estaDisponivel, rotuloStatus, valorPrincipal } from '../../utils/imovel.js'

export default function Favoritos() {
  const { alternar } = useFavoritos()
  const lista = useDados(({ signal }) => listarFavoritos({ signal }), [])
  const [removidos, setRemovidos] = useState([])
  const [erro, setErro] = useState(null)

  async function remover(imovel) {
    setErro(null)
    setRemovidos((r) => [...r, imovel.id])
    const problema = await alternar(imovel.id)
    if (problema) {
      setRemovidos((r) => r.filter((id) => id !== imovel.id))
      setErro(problema)
    }
  }

  if (lista.status === 'carregando') return <Carregando texto="Carregando seus favoritos…" />
  if (lista.status === 'erro') return <MensagemErro mensagem={lista.erro} onTentarNovamente={lista.recarregar} />

  const imoveis = lista.dados.filter((i) => !removidos.includes(i.id))
  if (imoveis.length === 0) {
    return (
      <SemResultados titulo="Nenhum favorito ainda">
        Na <Link to="/">vitrine</Link> ou na página de um imóvel, clique em ☆ Favoritar para guardar aqui.
      </SemResultados>
    )
  }

  return (
    <>
      {erro && (
        <p className="alerta alerta--erro" role="alert">
          {erro}
        </p>
      )}
      <ul className="registros">
        {imoveis.map((imovel) => {
          const { valor, sufixo } = valorPrincipal(imovel)
          const disponivel = estaDisponivel(imovel)
          return (
            <li key={imovel.id} className="registro">
              <ImovelMini imovel={imovel} />
              <div className="registro__dados">
                <p className="registro__valor">
                  {valor ? (
                    <strong>
                      {valor}
                      {sufixo}
                    </strong>
                  ) : (
                    'Valor sob consulta'
                  )}
                </p>
                <p className="registro__linha">
                  <Situacao situacao={{ rotulo: rotuloStatus(imovel.status) ?? 'Sem situação', tom: disponivel ? 'ok' : 'neutro' }} />{' '}
                  {disponivel ? 'Ainda recebe ofertas.' : 'Não recebe novas ofertas no momento.'}
                </p>
              </div>
              <div className="registro__acoes">
                {disponivel && (
                  <Link to={`/imoveis/${imovel.id}`} className="botao">
                    Fazer oferta
                  </Link>
                )}
                <button type="button" className="botao botao--secundario" onClick={() => remover(imovel)}>
                  ★ Remover
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
