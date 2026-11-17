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
- Usuários criados ao subir (se ainda não existirem):

  | Perfil | E-mail | Senha |
  |---|---|---|
  | Administrador | `admin@admin.com` | `admin123` |
  | Corretor | `corretor@imobiliaria.com` | `corretor123` |
  | Cliente | `cliente@imobiliaria.com` | `cliente123` (nome para assinar: **Cliente Demonstração**) |

  Para não criar o corretor e o cliente de demonstração: `app.demo.criar-usuarios=false`.
- Os PDFs dos contratos ficam em `backend/contratos/` (pasta privada, fora do Git; só saem pela API com token).
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
| `/` vitrine (filtros, ordenação, paginação, ☆ favoritar), `/imoveis/:id` detalhe (fazer oferta), `/contato`, `/login` | todos |
| `/cliente` resumo, `/cliente/ofertas`, `/cliente/favoritos`, `/cliente/contratos` (assinar) | cliente (`USER`) |
| `/admin` painel com gráficos, `/admin/ofertas`, `/admin/contratos` | admin e corretor |
| `/admin/usuarios` | só admin |

Sem login, as rotas protegidas mandam para `/login` e, depois de entrar, voltam para onde a pessoa estava. Com o perfil errado aparece "Acesso negado". Quando o token expira (2 h) ou o backend responde 401, a sessão é encerrada.

### Demonstração do checkpoint da Aula 3

1. **Cliente** (`cliente@imobiliaria.com`): abre um imóvel disponível › **Fazer oferta**.
2. **Corretor** (`corretor@imobiliaria.com`): Painel › Ofertas › **Aceitar** (o imóvel fica reservado e as outras ofertas dele ficam em espera) › **Preparar contrato** (gera o PDF ou envia um pronto).
3. **Admin** (`admin@admin.com`): Painel › Contratos › **Aprovar** (o cliente recebe e-mail).
4. **Cliente**: Minha área › Contratos › **Assinar** (marca "li e concordo" e digita o nome do cadastro). O imóvel passa a alugado/vendido e as outras ofertas são recusadas.

As regras e respostas da API estão em [`docs/comportamento-da-api.md`](docs/comportamento-da-api.md#aula-3-ofertas-contratos-favoritos-e-painel).

## Testes de segurança da API

Com o backend no ar:

```bash
cd frontend
npm run testar:api
```

O script roda o roteiro `backend/TESTES-JWT.md` inteiro e mostra ✓/✗ em cada linha. A seção 8 percorre o fluxo da Aula 3 (oferta → aceite → contrato → aprovação → assinatura, cancelamento, favoritos, painel) e as regras de negócio. A seção 7 confere os comportamentos que o front-end trata (login vazio, token expirado em rota pública, `/me`, `/imoveis/busca`), descritos em [`docs/comportamento-da-api.md`](docs/comportamento-da-api.md). Se o backend usa um `JWT_SECRET` próprio, rode com a mesma variável: `JWT_SECRET=... npm run testar:api`. Ele cobre login, rotas públicas, 401 sem token ou com token inválido, 403 para perfil sem permissão, CRUD de imóveis e usuários, alteração de status e CORS. Os dados de teste são criados e apagados pelo próprio script. Há também a coleção do Insomnia em `backend/insomnia-testes-jwt.json`.

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

### Aula 3: Desenvolvimento e integração
- [x] Perfis: cliente, **corretor** (novo) e administrador, cada um com o seu menu e área inicial
- [x] Backend: tabelas `ofertas`, `contratos` e `favoritos`; regras de negócio com respostas 409 e mensagem
- [x] Ofertas: o cliente oferta no detalhe (só em imóvel disponível), acompanha e desiste; corretor/admin filtram por situação, aceitam e recusam, com paginação
- [x] Favoritos: estrela na vitrine e no detalhe, lista na área do cliente
- [x] Contratos: o corretor prepara (PDF gerado pelo sistema ou enviado), o admin aprova/recusa/cancela e o cliente recebe e-mail; o cliente lê o PDF e assina
- [x] Painel com totais e gráficos (imóveis por bairro, ofertas por situação, imóveis por finalidade e por situação), com dica ao passar o mouse e tabela
- [x] Vitrine mostra a situação em cada card ("Disponível" ou "Indisponível no momento"); os disponíveis vêm primeiro e o filtro "Situação › Só disponíveis" esconde os outros
- [x] Usuários: cadastrar, buscar, editar, trocar perfil e excluir com confirmação (o admin não exclui a si mesmo)
- [x] Carregando, sem resultados e erro amigável em todas as telas novas; regras testadas na seção 8 do `npm run testar:api`


//users exemplo
- ana.souza@exemplo.com
- bruno.lima@exemplo.com
- carla.mendes@exemplo.com
- diego.rocha@exemplo.com

(senha:cliente123)