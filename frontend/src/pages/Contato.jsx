import FormContato from '../components/FormContato.jsx'
import { RASCUNHO_CONTATO_GERAL } from '../utils/contato.js'

export default function Contato() {
  return (
    <section className="contato">
      <header className="cabecalho-pagina">
        <h1>Fale com a imobiliária</h1>
      </header>
      <div className="painel">
        <p>
          Tem dúvidas, quer agendar uma visita ou anunciar seu imóvel? Escreva para nós e um corretor responde no seu
          e-mail.
        </p>
        <FormContato rascunho={RASCUNHO_CONTATO_GERAL} />
        <p className="dica">
          Para falar sobre um imóvel específico, use o botão “Entrar em contato” na página dele: a mensagem já vem com o
          código e os dados do imóvel.
        </p>
      </div>
    </section>
  )
}
