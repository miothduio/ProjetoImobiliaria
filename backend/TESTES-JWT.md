# Roteiro de testes: Atividade 4 (JWT)

## Antes de começar
1. Inicie o MySQL no XAMPP (banco `restaurante`).
2. Rode o projeto. Na primeira vez aparece no console: `>>> ADMIN inicial criado: admin@admin.com`
3. No Insomnia: **Import** → arquivo `insomnia-testes-jwt.json` (está na raiz do projeto).
4. Em **Manage Environments (Base Environment)** ficam as variáveis:
   - `token_admin` / `token_user`: cole aqui os tokens obtidos no login
   - `id_imovel`: um imóvel que existe (veja em GET /imoveis)
   - `id_imovel_apagar`: um imóvel que pode ser apagado (ex.: o criado no teste de cadastro)
   - `id_user`: id do usuário user@teste.com (veja em GET /users)
   - `id_user_apagar`: id do usuário apagar@teste.com

Token no Insomnia: aba **Auth → Bearer Token**. Sem token: **Auth → No Auth**.

## 0. Preparação
| # | Requisição | Token | Esperado |
|---|---|---|---|
| 0.1 | POST /public/register `{"nome":"teste","email":"teste3@teste.com","password":"123","role":"ADMIN"}` | nenhum | 200 (sem corpo) |
| 0.2 | POST /public/login `{"email":"admin@admin.com","password":"admin123"}` → copie para `token_admin` | nenhum | 200 + token |
| 0.3 | POST /users `{"nome":"Usuario","email":"user@teste.com","senha":"123","tipo":"USER"}` | ADMIN | 201 |
| 0.4 | POST /public/login `{"email":"user@teste.com","password":"123"}` → copie para `token_user` | nenhum | 200 + token |

## Linha 1: Login (todos, sem token)
| Requisição | Token | Esperado | ✓ |
|---|---|---|---|
| POST /public/login (senha certa) | nenhum | 200 + token | ☐ |
| POST /public/login (senha errada) | nenhum | 401 | ☐ |

## Linha 2: Listar imóveis / um imóvel (todos, sem token)
| Requisição | Token | Esperado | ✓ |
|---|---|---|---|
| GET /imoveis | nenhum | 200 | ☐ |
| GET /imoveis/{id} | nenhum | 200 | ☐ |

## Linha 3: Cadastrar, alterar e remover imóveis (ADMIN)
Body: `{"titulo":"Casa teste","finalidade":"VENDA","status":"DISPONIVEL","precoVenda":350000,"dormitorios":3}`

| Requisição | Token | Esperado | ✓ |
|---|---|---|---|
| POST /imoveis | nenhum | 401 | ☐ |
| POST /imoveis | inválido | 401 | ☐ |
| POST /imoveis | USER | 403 | ☐ |
| POST /imoveis | ADMIN | 201 | ☐ |
| PUT /imoveis/{id} | USER | 403 | ☐ |
| PUT /imoveis/{id} | ADMIN | 204 | ☐ |
| DELETE /imoveis/{id} | USER | 403 | ☐ |
| DELETE /imoveis/{id} | ADMIN | 204 | ☐ |

## Linha 4: Cadastrar e gerenciar usuários (ADMIN)
| Requisição | Token | Esperado | ✓ |
|---|---|---|---|
| GET /users | nenhum | 401 | ☐ |
| GET /users | USER | 403 | ☐ |
| GET /users | ADMIN | 200 (lista sem senha) | ☐ |
| POST /users | USER | 403 | ☐ |
| POST /users | ADMIN | 201 | ☐ |
| PUT /users/{id} | ADMIN | 204 | ☐ |
| DELETE /users/{id} | USER | 403 | ☐ |
| DELETE /users/{id} | ADMIN | 204 | ☐ |

## Linha 5: Alterar status de imóvel (qualquer usuário autenticado)
Body: `{"status":"VENDIDO"}`

| Requisição | Token | Esperado | ✓ |
|---|---|---|---|
| PATCH /imoveis/{id}/status | nenhum | 401 | ☐ |
| PATCH /imoveis/{id}/status | USER | 200 | ☐ |
| PATCH /imoveis/{id}/status | ADMIN | 200 | ☐ |

## Corpo dos erros
```json
{ "status": 401, "erro": "Unauthorized", "mensagem": "Token não informado" }
{ "status": 401, "erro": "Unauthorized", "mensagem": "Token inválido" }
{ "status": 401, "erro": "Unauthorized", "mensagem": "Token expirado" }
{ "status": 403, "erro": "Forbidden", "mensagem": "Você não tem permissão para acessar este recurso" }
```

## Prints para a entrega (como nos exemplos da atividade)
1. Registro: 0.1
2. Login: 0.2
3. Acesso sem token: GET /users sem token → 401
4. Acesso com token válido: GET /users com token ADMIN → 200
5. Extra: POST /imoveis com token USER → 403
