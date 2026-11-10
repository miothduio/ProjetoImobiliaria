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

- Payload: `{ iss: "imobiliaria-api", sub: "<e-mail>", tipo: "ADMIN" | "USER", iat, exp }`, com `iat`/`exp` em segundos e validade de **2 h**.
- O front decodifica o payload (sem validar a assinatura, quem valida é o backend) para saber o perfil e quando expira.
- `tipo` vem como está no banco. O backend faz `toUpperCase()` e trata vazio como `USER`; o front segue a mesma regra: `ADMIN` vai para o painel, qualquer outro valor é cliente.

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

## Ainda em aberto no backend

- `POST /public/register` aceita `role: "ADMIN"` sem token, então qualquer pessoa pode se cadastrar como admin. A tela de cadastro de cliente (se for feita) deve mandar sempre `USER`, e o ideal é o backend forçar `USER` nessa rota.
- `finalidade` e `status` continuam texto livre; padronizar (enum) quando as tabelas de ofertas e contratos entrarem.
