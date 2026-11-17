import { useEffect, useRef, useState } from 'react'
import { foiCancelada, mensagemDeErro } from '../services/api.js'

/**
 * Busca dados da API e devolve os três estados de toda tela: carregando, ok e erro.
 *
 *   const { status, dados, erro, codigo, recarregar, atualizando } = useDados(
 *     ({ signal }) => listarOfertas({ status, pagina }, { signal }),
 *     [status, pagina],
 *   )
 *
 * - Quando "chaves" muda (filtro, página), a requisição anterior é cancelada.
 * - recarregar() busca de novo mantendo a lista na tela ("atualizando" fica true),
 *   para a tabela não piscar depois de aceitar/recusar uma oferta.
 * - erro já vem como frase amigável (nunca JSON); codigo é o status HTTP (404, 403...).
 */
export function useDados(buscar, chaves) {
  const buscarRef = useRef(buscar)
  const [tentativa, setTentativa] = useState(0)
  const [resposta, setResposta] = useState({ chave: null, status: 'carregando', dados: null, erro: null, codigo: null })
  const chave = `${JSON.stringify(chaves)}#${tentativa}`

  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    const controle = new AbortController()
    buscarRef
      .current({ signal: controle.signal })
      .then((dados) => setResposta({ chave, status: 'ok', dados, erro: null, codigo: null }))
      .catch((error) => {
        if (foiCancelada(error)) return
        setResposta({ chave, status: 'erro', dados: null, erro: mensagemDeErro(error), codigo: error.response?.status ?? null })
      })
    return () => controle.abort()
  }, [chave])

  const atual = resposta.chave === chave
  // enquanto a nova resposta não chega: mostra a anterior se ela deu certo; senão, "carregando"
  const status = atual ? resposta.status : resposta.status === 'ok' ? 'ok' : 'carregando'

  return {
    status,
    dados: status === 'ok' ? resposta.dados : null,
    erro: resposta.erro,
    codigo: resposta.codigo,
    atualizando: !atual && status === 'ok',
    recarregar: () => setTentativa((n) => n + 1),
  }
}
