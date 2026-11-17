import { useState } from 'react'
import { useFavoritos } from '../favoritos/contexto.js'

/** Estrelinha de favorito. Só aparece para cliente logado. */
export default function BotaoFavorito({ imovelId, compacto = false }) {
  const { ativo, ehFavorito, alternar } = useFavoritos()
  const [erro, setErro] = useState(null)
  if (!ativo) return null

  const marcado = ehFavorito(imovelId)
  async function clicar() {
    setErro(null)
    const problema = await alternar(imovelId)
    if (problema) setErro(problema)
  }

  return (
    <span className="favorito">
      <button
        type="button"
        className={`favorito__botao ${marcado ? 'favorito__botao--marcado' : ''}`}
        onClick={clicar}
        aria-pressed={marcado}
        title={marcado ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
      >
        <span aria-hidden="true">{marcado ? '★' : '☆'}</span>
        {compacto ? <span className="sr-only">Favorito</span> : marcado ? ' Nos favoritos' : ' Favoritar'}
      </button>
      {erro && (
        <span className="favorito__erro" role="alert">
          {erro}
        </span>
      )}
    </span>
  )
}
