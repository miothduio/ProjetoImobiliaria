import { useEffect, useState } from 'react'
import ImovelCard from '../components/ImovelCard.jsx'
import { Carregando, MensagemErro, SemResultados } from '../components/Feedback.jsx'
import { listarImoveis } from '../services/imoveisService.js'
import { mensagemDeErro } from '../services/api.js'
import { estaDisponivel } from '../utils/imovel.js'

export default function Vitrine() {
  const [estado, setEstado] = useState({ status: 'carregando', imoveis: [], erro: null })

  // incrementar "tentativa" refaz a busca (botão "Tentar novamente")
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    listarImoveis()
      .then((todos) => {
        // a vitrine mostra só o que está disponível (reservados/vendidos/alugados ficam de fora)
        if (ativo) setEstado({ status: 'ok', imoveis: todos.filter(estaDisponivel), erro: null })
      })
      .catch((error) => {
        if (ativo) setEstado({ status: 'erro', imoveis: [], erro: mensagemDeErro(error) })
      })
    return () => {
      ativo = false
    }
  }, [tentativa])

  function carregar() {
    setEstado({ status: 'carregando', imoveis: [], erro: null })
    setTentativa((n) => n + 1)
  }

  const { status, imoveis, erro } = estado

  return (
    <section>
      <header className="cabecalho-pagina">
        <h1>Imóveis disponíveis</h1>
        {status === 'ok' && imoveis.length > 0 && (
          <p className="cabecalho-pagina__info">
            {imoveis.length} {imoveis.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
          </p>
        )}
      </header>

      {status === 'carregando' && <Carregando texto="Buscando imóveis…" />}

      {status === 'erro' && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}

      {status === 'ok' && imoveis.length === 0 && (
        <SemResultados titulo="Nenhum imóvel disponível no momento">
          Volte em breve: novos imóveis são cadastrados com frequência.
        </SemResultados>
      )}

      {status === 'ok' && imoveis.length > 0 && (
        <div className="grade">
          {imoveis.map((imovel) => (
            <ImovelCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      )}
    </section>
  )
}
