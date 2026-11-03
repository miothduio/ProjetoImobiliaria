# Imobiliária: Frontend

Interface em **React + Vite** que consome a API do `backend/`. As instruções completas (banco, backend e front) estão no [README da raiz](../README.md).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:5173 (porta fixa por causa do CORS) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Verifica o código (oxlint) |
| `npm run testar:api` | Roteiro de testes de segurança da API (aceita `-- http://outro-endereco:8080`) |

Variáveis opcionais do `testar:api`: `ADMIN_EMAIL`, `ADMIN_SENHA`, `ORIGEM_FRONT`.

## Estrutura

```
src/
  components/   Layout, ImovelCard, Feedback (carregando / sem resultados / erro)
  pages/        Vitrine, NaoEncontrada
  services/     api.js (axios + token + mensagens de erro), imoveisService.js
  utils/        formatação de preço, finalidade e status
scripts/
  testar-api.mjs
```
