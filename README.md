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

- Rode **a partir da pasta `backend/`**: o `.env` e a pasta `uploads/` são lidos dali.
- Usuário ADMIN inicial: `admin@admin.com` / `admin123`.
- Sem o `.env` a API sobe normalmente, só o envio de e-mail não funciona.

## 3. Frontend (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. Se o backend estiver em outro endereço, copie `frontend/.env.example` para `frontend/.env.local` e ajuste `VITE_API_URL`.

## Testes de segurança da API

Com o backend no ar:

```bash
cd frontend
npm run testar:api
```

O script roda o roteiro `backend/TESTES-JWT.md` inteiro e mostra ✓/✗ em cada linha. Ele cobre login, rotas públicas, 401 sem token ou com token inválido, 403 para perfil sem permissão, CRUD de imóveis e usuários, alteração de status e CORS. Os dados de teste são criados e apagados pelo próprio script. Há também a coleção do Insomnia em `backend/insomnia-testes-jwt.json`.

## Progresso

### Aula 1: Setup e testes do backend
- [x] Backend no ar e regras de segurança testadas (`npm run testar:api`)
- [x] Projeto front-end criado (React + Vite)
- [x] Primeira chamada à API: vitrine listando `GET /imoveis` com estados de carregando, sem resultados e erro
- [x] Repositório no GitHub e primeiro commit
