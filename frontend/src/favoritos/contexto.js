import { createContext, useContext } from 'react'

export const FavoritosContext = createContext(null)

/**
 * { ativo, ehFavorito(id), alternar(id) -> Promise<string|null> (mensagem de erro), total }
 * "ativo" é false para visitante, corretor e admin: aí a estrelinha nem aparece.
 */
export function useFavoritos() {
  const contexto = useContext(FavoritosContext)
  if (!contexto) throw new Error('useFavoritos precisa estar dentro de <FavoritosProvider>')
  return contexto
}
