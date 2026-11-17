# Comportamento da API: o que o front-end precisa tratar

Levantamento feito antes das telas da Aula 2 (vitrine, login e áreas por perfil), lendo o `SecurityConfig`, o `SecurityFilter`, o `AuthController` e os controllers. Cada linha abaixo é conferida automaticamente na seção 7 do `npm run testar:api` (rode com o backend no ar).

## Login: `POST /public/login`

| Situação | Resposta | O que o front faz |
|---|---|---|
| E-mail e senha corretos | `200 { "token": "..." }` | Salva o token, lê o perfil do payload e vai para a área do perfil |
| Senha errada | `401 { "mensagem": "E-mail ou senha inválidos" }` | "E-mail ou senha incorretos. Confira os dados e tente novamente." |
| E-mail que não existe | `401`, **mesma mensagem** (o backend não revela se o e-mail existe) | Mesma mensagem acima |
| Campo vazio | `400` do Spring, **sem** `mensagem` (`{timestamp, status, error, path}`) | A tela valida antes de enviar: obrigatórios e formato do e-mail |
| Backend fora do ar | sem resposta | "Não foi possível conectar ao servidor…" |

O login **não** devolve nome nem perfil, só o token.

## O token (JWT)

- Payload: `{ iss: "imobiliaria-api", sub: "<e-mail>", tipo: "ADMIN" | "CORRETOR" | "USER", iat, exp }`, com `iat`/`exp` em segundos e validade de **2 h**.
- O front decodifica o payload (sem validar a assinatura, quem valida é o backend) para saber o perfil e quando expira.
- `tipo` vem como está no banco. O backend faz `toUpperCase()` e trata vazio como `USER`; o front segue a mesma regra: `ADMIN` vai para o painel, `CORRETOR` (Aula 3) vai para as ofertas, qualquer outro valor é cliente.

## Requisições autenticadas

| Situação | Resposta |
|---|---|
| Rota protegida sem token | `401 { "mensagem": "Token não informado" }` |
| Token com assinatura inválida | `401 { "mensagem": "Token inválido" }` |
| Token expirado | `401 { "mensagem": "Token expirado" }` |
| Usuário do token foi apagado | `401 { "mensagem": "Usuário do token não existe mais" }` |
| Token válido, perfil sem permissão (ex.: USER em `/users`) | `403 { "mensagem": "Você não tem permissão para acessar este recurso" }` |

**Detalhe importante:** nas rotas **públicas** (`GET /imoveis`, `/bairros`, `/fotos`…) um token vencido ou inválido é ignorado e a resposta é `200`. Ou seja, quem só navega pela vitrine nunca recebe 401. Por isso o front:

1. confere o `exp` sozinho e desloga no instante em que o token vence (timer no `AuthProvider`);
2. não envia token vencido (interceptor de requisição);
3. trata o 401 das rotas protegidas como sessão encerrada (interceptor de resposta).

## Endpoints acrescentados no backend nesta aula

| Endpoint | Acesso | Para quê |
|---|---|---|
| `GET /imoveis/busca` | público | Vitrine com filtros, ordenação e paginação. Antes não existia; `GET /imoveis` continua igual |
| `GET /me` | qualquer logado | `{ id, nome, email, tipo }` de quem está logado: nome no menu e checagem do token ao abrir o site |
| `POST /imoveis/{id}/contato` | público | Formulário "Entrar em contato" do imóvel: envia para a imobiliária |
| `POST /contato` | público | Contato geral (página Contato) |

### Contato: `POST /imoveis/{id}/contato` e `POST /contato`

Body: `{ nome, email, telefone (opcional), assunto, mensagem }`. Assunto e mensagem vêm pré-preenchidos na tela (código, tipo, bairro, valor) e o cliente edita antes de enviar.

O e-mail vai para `EMAIL_IMOBILIARIA` (definido no `backend/.env`), com **Reply-To** no e-mail do cliente: quem responde na imobiliária fala direto com ele. Foi feito assim por causa do sandbox do Mailgun, que só entrega para "Authorized Recipients": um destino fixo, autorizado uma vez, funciona sempre.

| Situação | Resposta |
|---|---|
| Enviado | `200 { "mensagem": "Mensagem enviada." }` |
| Campo faltando ou inválido | `400 { "mensagem": "Informe seu nome." }` (e similares) |
| Imóvel não existe | `404 { "mensagem": "Imóvel não encontrado." }` |
| `EMAIL_IMOBILIARIA` vazio | `503 { "mensagem": "O envio de e-mail ainda não foi configurado no servidor." }` |
| Mailgun recusou ou não respondeu (10 s) | `502 { "mensagem": "Não foi possível enviar o e-mail agora…" }`, com o motivo real no console do backend |

### `GET /imoveis/busca`

Parâmetros, todos opcionais e combináveis:

| Parâmetro | Valores | Padrão |
|---|---|---|
| `bairroId` | id do bairro | todos |
| `finalidade` | `VENDA` ou `ALUGUEL` | as duas |
| `precoMin`, `precoMax` | número, inclusivo | sem limite |
| `ordem` | `recentes`, `preco_asc`, `preco_desc` | `recentes` |
| `apenasDisponiveis` | `true` / `false` | `true` |
| `pagina` | começa em **0** | 0 |
| `tamanho` | 1 a 50 | 9 |

Resposta: `{ conteudo: [imóveis], pagina, tamanho, totalElementos, totalPaginas }`. Cada imóvel traz `capaUrl` (antes o card fazia uma chamada `/fotos/imovel/{id}` para cada imóvel).

Regras que levam em conta os dados atuais do banco:
- `status` "Disponível" e "DISPONIVEL" contam igual (sem diferenciar acento nem maiúsculas).
- Imóvel com finalidade fora do padrão (ex.: "Residencial") entra no filtro da finalidade cujo preço estiver preenchido.
- O preço usado na faixa e na ordenação é o da finalidade filtrada; sem filtro, é o mesmo valor que o card mostra. Imóvel sem preço ("sob consulta") fica fora da faixa de preço e vai para o fim na ordenação.

Erros: `400 { "mensagem": "..." }` para `precoMin` maior que `precoMax`, valor negativo ou finalidade inválida. O front valida tudo isso antes de enviar.

## Outras respostas que o front trata

| Requisição | Resposta | Tela |
|---|---|---|
| `GET /imoveis/{id}` inexistente | `404` **sem corpo** | "Imóvel não encontrado" |
| `GET /imoveis/abc` | `400` (id não numérico) | "Imóvel não encontrado" |
| `GET /fotos/imovel/{id}` sem fotos | `200 []` | Ilustração "sem fotos" |
| Qualquer `5xx` | | "O servidor encontrou um problema. Tente novamente em instantes." |

## Aula 3: ofertas, contratos, favoritos e painel

Conferido na seção 8 do `npm run testar:api`. Erros de regra de negócio respondem **409** com `mensagem` (a tela mostra a frase do backend); validação responde **400**; oferta ou contrato de outra pessoa responde **404** (como se não existisse).

### Perfis

| Perfil (`tipo`) | Pode |
|---|---|
| `USER` (cliente) | fazer e cancelar ofertas, favoritos, assinar os próprios contratos |
| `CORRETOR` | listar, aceitar e recusar ofertas; preparar contratos; ver o painel |
| `ADMIN` | tudo do corretor + aprovar, recusar e cancelar contratos; usuários e imóveis |

### Endpoints

| Requisição | Quem | Resposta |
|---|---|---|
| `POST /ofertas` `{ imovelId, tipo: VENDA\|ALUGUEL, valor, mensagem? }` | USER | `201` oferta |
| `GET /ofertas/minhas?status=&imovelId=&pagina=&tamanho=` | USER | página `{ conteudo, pagina, tamanho, totalElementos, totalPaginas }` |
| `PATCH /ofertas/{id}/cancelar` | USER (dono) | oferta |
| `GET /ofertas?status=&imovelId=&pagina=&tamanho=` | ADMIN, CORRETOR | página |
| `PATCH /ofertas/{id}/aceitar` · `/recusar` | ADMIN, CORRETOR | oferta |
| `POST /contratos` (multipart: `ofertaId`, `arquivo?` PDF) | ADMIN, CORRETOR | `201` contrato; sem arquivo, o PDF é gerado |
| `GET /contratos?status=` · `GET /contratos/meus?status=` | equipe · USER | página |
| `PATCH /contratos/{id}/aprovar` · `/recusar` `{motivo}` · `/cancelar` `{motivo}` | ADMIN | contrato |
| `PATCH /contratos/{id}/assinar` `{ nome, aceite: true }` | USER (dono) | contrato |
| `GET /contratos/{id}/pdf` | dono ou equipe | `application/pdf` |
| `GET /favoritos` · `GET /favoritos/ids` · `POST`/`DELETE /favoritos/{imovelId}` | USER | lista · ids · `201`/`200` · `204` |
| `GET /painel` | ADMIN, CORRETOR | `{ totais, imoveisPorBairro, ofertasPorSituacao, imoveisPorFinalidade, imoveisPorStatus }` |

Na vitrine, `GET /imoveis/busca?apenasDisponiveis=false` traz também os imóveis reservados, alugados e vendidos, **depois** dos disponíveis (cada grupo na ordem pedida). O card mostra "Disponível" ou "Indisponível no momento"; o filtro "Só disponíveis" manda `apenasDisponiveis=true` (o padrão da API).

O filtro `status` aceita o nome do enum em qualquer caixa (`pendente`, `Em espera`, `EM_ESPERA`). Os JSON de oferta/contrato nunca trazem a senha do usuário nem o caminho do PDF no servidor.

### Situações e o que muda no imóvel

```
Oferta:   PENDENTE ──aceitar──▶ ACEITA            (imóvel RESERVADO; outras PENDENTES ▶ EM_ESPERA)
          PENDENTE/EM_ESPERA ──recusar/cancelar──▶ RECUSADA/CANCELADA
          ACEITA sem contrato ──recusar──▶ RECUSADA (desfaz a reserva)

Contrato: AGUARDANDO_APROVACAO ──admin aprova──▶ AGUARDANDO_ASSINATURA ──cliente assina──▶ ASSINADO
             │                                        │       (imóvel ALUGADO/VENDIDO; outras ofertas ▶ RECUSADA)
             ├─admin recusa──▶ RECUSADO (o corretor prepara outro para a mesma oferta)
             └─admin cancela (cliente desistiu), também a partir de AGUARDANDO_ASSINATURA ──▶ CANCELADO
                                   (oferta CANCELADA; imóvel DISPONIVEL; EM_ESPERA ▶ PENDENTE)
```

| Situação | Resposta |
|---|---|
| Oferta em imóvel reservado/alugado/vendido | `409` "Este imóvel não está disponível para ofertas (situação: reservado)." |
| Oferta de compra em imóvel só de aluguel (ou o contrário) | `409` |
| Segunda oferta em andamento do mesmo cliente no mesmo imóvel | `409` (vários clientes no mesmo imóvel pode) |
| Aceitar oferta que não está pendente | `409` |
| Cliente cancelar oferta já aceita | `409` (quem desfaz é o admin, cancelando o contrato) |
| Preparar contrato de oferta não aceita, ou com contrato em andamento | `409` |
| Assinar antes da aprovação | `409` |
| Assinar sem `aceite: true` ou com nome diferente do cadastro | `400` |
| Cancelar contrato assinado | `409` |
| Arquivo enviado que não é PDF | `400`; maior que 10 MB: `413` |
| Admin excluir a si mesmo / tirar o próprio perfil de admin | `409` |

E-mails ao cliente (oferta aceita/recusada, contrato aprovado/recusado/cancelado) saem em segundo plano. Se o envio falhar (no sandbox do Mailgun, o e-mail do cliente precisa estar em *Authorized Recipients*), a operação vale do mesmo jeito e o motivo aparece só no console.

## Ainda em aberto no backend

- `POST /public/register` aceita `role: "ADMIN"` sem token, então qualquer pessoa pode se cadastrar como admin. A tela de cadastro de cliente (se for feita) deve mandar sempre `USER`, e o ideal é o backend forçar `USER` nessa rota.
- `finalidade` e `status` do imóvel continuam texto livre (ofertas e contratos já usam enum). O fluxo grava `DISPONIVEL`, `RESERVADO`, `ALUGADO` e `VENDIDO`.
- `PATCH /imoveis/{id}/status` (exigência da atividade 4) aceita qualquer usuário logado e permite mudar o status por fora do fluxo de ofertas. Na tela, só o fluxo muda o status.
