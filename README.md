# Imobiliária: Trabalho Final de Web4

Sistema de uma imobiliária. A **API REST em Spring Boot** foi construída na disciplina e o **front-end em React + Vite** consome essa API. IFFar Panambi, Tecnologia em Sistemas para Internet.

```
imobiliaria/
├── backend/    API REST (Java 17, Spring Boot, Spring Security + JWT, MySQL)
└── frontend/   Interface web (React 19 + Vite, React Router, Axios)
```

## Pré-requisitos

- Java 17 ou superior (o Maven Wrapper `mvnw` já vem no projeto)
- XAMPP com MySQL/MariaDB
- Node.js 20 ou superior

## 1. Banco de dados

1. Ligue o **MySQL** no painel do XAMPP.
2. No phpMyAdmin, crie o banco **`restaurante`** e importe `backend/banco/restaurante.sql`.
   Também funciona só criando o banco vazio: as tabelas são geradas pelo Hibernate (`ddl-auto=update`) e o admin inicial é criado sozinho.

Conexão padrão: `localhost:3306`, usuário `root`, sem senha (`backend/src/main/resources/application.properties`).

## 2. Backend (porta 8080)

```bash
cd backend
cp .env.example .env      # preencha a senha SMTP do Mailgun (usada no "saber mais")
./mvnw spring-boot:run    # no Windows: mvnw.cmd spring-boot:run
```

- Rode **a partir da pasta `backend/`**: o `.env` e a pasta `uploads/` são lidos dali. No VS Code, o `.vscode/launch.json` da raiz já aponta para `backend/`.
- Usuário ADMIN inicial: `admin@admin.com` / `admin123`.
- Sem o `.env` a API sobe normalmente, só o envio de e-mail não funciona.

### E-mail (Mailgun)

O "Entrar em contato" do site envia pela API para a caixa da imobiliária. No `backend/.env`:

```properties
MAIL_USERNAME=postmaster@sandboxXXXX.mailgun.org   # SMTP do Mailgun
MAIL_PASSWORD=...
EMAIL_IMOBILIARIA=seu-email@exemplo.com            # quem recebe os contatos
```

No **sandbox** do Mailgun, cadastre o `EMAIL_IMOBILIARIA` em *Sending → Domain settings → Authorized Recipients* e confirme o convite que chega nessa caixa; sem isso o Mailgun recusa o envio. Ao subir, o backend mostra no console se o e-mail está configurado (`>>> E-mail configurado…` ou `>>> E-MAIL DESATIVADO…`, com o caminho onde procurou o `.env`).

## 3. Frontend (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. Para mudar o endereço do backend (`VITE_API_URL`) ou o e-mail que recebe os contatos (`VITE_EMAIL_IMOBILIARIA`), copie `frontend/.env.example` para `frontend/.env.local` e ajuste.

### Telas e perfis

| Rota | Quem acessa |
|---|---|
| `/` vitrine (filtros, ordenação, paginação), `/imoveis/:id` detalhe, `/contato`, `/login` | todos |
| `/cliente` área do cliente | perfil `USER` |
| `/admin` painel | perfil `ADMIN` |

Sem login, as rotas protegidas mandam para `/login` e, depois de entrar, voltam para onde a pessoa estava. Com o perfil errado aparece "Acesso negado". Quando o token expira (2 h) ou o backend responde 401, a sessão é encerrada.

## Testes de segurança da API

Com o backend no ar:

```bash
cd frontend
npm run testar:api
```

O script roda o roteiro `backend/TESTES-JWT.md` inteiro e mostra ✓/✗ em cada linha. A seção 7 confere os comportamentos que o front-end trata (login vazio, token expirado em rota pública, `/me`, `/imoveis/busca`), descritos em [`docs/comportamento-da-api.md`](docs/comportamento-da-api.md). Se o backend usa um `JWT_SECRET` próprio, rode com a mesma variável: `JWT_SECRET=... npm run testar:api`. Ele cobre login, rotas públicas, 401 sem token ou com token inválido, 403 para perfil sem permissão, CRUD de imóveis e usuários, alteração de status e CORS. Os dados de teste são criados e apagados pelo próprio script. Há também a coleção do Insomnia em `backend/insomnia-testes-jwt.json`.

## Progresso

### Aula 1: Setup e testes do backend
- [x] Backend no ar e regras de segurança testadas (`npm run testar:api`)
- [x] Projeto front-end criado (React + Vite)
- [x] Primeira chamada à API: vitrine listando `GET /imoveis` com estados de carregando, sem resultados e erro
- [x] Repositório no GitHub e primeiro commit

### Aula 2: Vitrine e área do cliente
- [x] Comportamento da API confirmado antes das telas ([`docs/comportamento-da-api.md`](docs/comportamento-da-api.md) + seção 7 do `testar:api`)
- [x] Backend: `GET /imoveis/busca` (filtros, ordenação, paginação e capa) e `GET /me`
- [x] Vitrine com filtros combinados (bairro, finalidade, faixa de preço), ordenação por preço e paginação, tudo na URL
- [x] Detalhe do imóvel com galeria e "Entrar em contato": formulário com assunto e mensagem pré-preenchidos (código, tipo, bairro, valor) e editáveis, enviado pela API (`POST /imoveis/{id}/contato`)
- [x] Login com validação (obrigatórios, formato do e-mail) e mensagens para credencial errada e servidor fora do ar
- [x] JWT em toda requisição; rotas protegidas por perfil (cliente → `/cliente`, admin → `/admin`); sem token volta ao login
- [x] Token expirado ou 401 desloga; logout apaga o token e redireciona
- [x] Menu que muda conforme o login e o perfil, responsivo no celular
- [x] Visual de blog dos anos 2000 (estilo Blogspot): imóveis como posts com data, barra lateral com bairros e contador de visitas, janela de contato estilo Windows XP
