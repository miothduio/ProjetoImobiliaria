import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/contexto.js'
import { PERFIS } from '../auth/sessao.js'
import { mensagemDeErro } from '../services/api.js'
import { adicionarFavorito, idsFavoritos, removerFavorito } from '../services/favoritosService.js'
import { FavoritosContext } from './contexto.js'

/**
 * Guarda os ids dos favoritos do cliente logado, para a estrelinha da vitrine e do
 * detalhe saber se está marcada sem uma chamada por imóvel.
 * A troca é otimista: a estrela muda na hora e volta atrás se a API recusar.
 */
export default function FavoritosProvider({ children }) {
  const { sessao } = useAuth()
  const ativo = sessao?.perfil === PERFIS.CLIENTE
  const token = ativo ? sessao.token : null
  const [estado, setEstado] = useState({ token: null, ids: new Set() })

  useEffect(() => {
    if (!token) return undefined
    let vivo = true
    idsFavoritos()
      .then((ids) => vivo && setEstado({ token, ids: new Set(ids) }))
      .catch(() => {
        /* sem a lista, as estrelas começam vazias; a página de favoritos mostra o erro */
      })
    return () => {
      vivo = false
    }
  }, [token])

  // dados de outra sessão (logout/login com outra conta) não valem
  const ids = useMemo(() => (estado.token === token ? estado.ids : new Set()), [estado, token])

  const trocar = useCallback(
    (id, marcar) =>
      setEstado((e) => {
        const novos = new Set(e.token === token ? e.ids : [])
        if (marcar) novos.add(id)
        else novos.delete(id)
        return { token, ids: novos }
      }),
    [token],
  )

  const alternar = useCallback(
    async (imovelId) => {
      const id = Number(imovelId)
      const marcar = !ids.has(id)
      trocar(id, marcar)
      try {
        if (marcar) await adicionarFavorito(id)
        else await removerFavorito(id)
        return null
      } catch (error) {
        trocar(id, !marcar)
        return mensagemDeErro(error, 'Não foi possível atualizar seus favoritos.')
      }
    },
    [ids, trocar],
  )

  const valor = useMemo(
    () => ({ ativo, ehFavorito: (id) => ids.has(Number(id)), alternar, total: ids.size, removidoLocal: (id) => trocar(Number(id), false) }),
    [ativo, ids, alternar, trocar],
  )

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>
}
