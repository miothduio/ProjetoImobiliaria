#!/usr/bin/env node
/**
 * Roteiro automático das regras de segurança do backend (TESTES-JWT.md).
 *
 * Uso (com o backend rodando):
 *   npm run testar:api
 *   npm run testar:api -- http://localhost:8080
 *
 * Variáveis opcionais: API_URL, ADMIN_EMAIL, ADMIN_SENHA, ORIGEM_FRONT
 *
 * O script cria seus próprios dados de teste (usuários e um imóvel) e apaga tudo no final.
 */

import { createHmac } from 'node:crypto'

const API_URL = (process.argv[2] || process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com'
const ADMIN_SENHA = process.env.ADMIN_SENHA || 'admin123'
const ORIGEM_FRONT = process.env.ORIGEM_FRONT || 'http://localhost:5173'

const cor = (codigo) => (texto) => (process.stdout.isTTY ? `\x1b[${codigo}m${texto}\x1b[0m` : texto)
const verde = cor(32)
const vermelho = cor(31)
const cinza = cor(90)
const negrito = cor(1)

const resultados = []
const sufixo = Date.now()

async function chamar(metodo, caminho, { token, body, headers = {} } = {}) {
  const opcoes = { method: metodo, headers: { ...headers } }
  if (token) opcoes.headers.Authorization = `Bearer ${token}`
  if (body !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json'
    opcoes.body = JSON.stringify(body)
  }
  const resposta = await fetch(API_URL + caminho, opcoes)
  const texto = await resposta.text()
  let dados = texto
  try {
    dados = texto ? JSON.parse(texto) : null
  } catch {
    /* corpo não é JSON */
  }
  return { status: resposta.status, dados, headers: resposta.headers }
}

function lerPayload(token) {
  if (!token) return null
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

/**
 * Token já vencido, assinado com a mesma chave do backend (padrão do application.properties).
 * Se você definiu JWT_SECRET no backend, rode com a mesma variável.
 */
function gerarTokenVencido(email, tipo) {
  const segredo = process.env.JWT_SECRET || 'imobiliaria-chave-secreta-trocar-em-producao-2026'
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const agora = Math.floor(Date.now() / 1000)
  const corpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iss: 'imobiliaria-api', sub: email, tipo, iat: agora - 7200, exp: agora - 60 })}`
  const assinatura = createHmac('sha256', segredo).update(corpo).digest('base64url')
  return `${corpo}.${assinatura}`
}

function idDoLocation(resposta) {
  const location = resposta.headers.get('location') || ''
  const id = Number(location.split('/').pop())
  return Number.isFinite(id) && id > 0 ? id : resposta.dados?.id
}

async function caso(secao, descricao, esperado, executar, conferirExtra) {
  try {
    const resposta = await executar()
    let ok = resposta.status === esperado
    let detalhe = `recebido ${resposta.status}`
    if (ok && conferirExtra) {
      const problema = conferirExtra(resposta)
      if (problema) {
        ok = false
        detalhe = problema
      }
    }
    resultados.push({ secao, descricao, esperado, ok, detalhe })
    return resposta
  } catch (erro) {
    resultados.push({ secao, descricao, esperado, ok: false, detalhe: `erro: ${erro.message}` })
    return null
  }
}

const temMensagem = (r) =>
  r.dados && typeof r.dados === 'object' && r.dados.mensagem ? null : 'corpo do erro sem "mensagem"'

async function main() {
  console.log(negrito(`\nTestando ${API_URL}\n`))

  try {
    await fetch(API_URL + '/imoveis')
  } catch {
    console.log(vermelho(`Não foi possível conectar em ${API_URL}. O backend está rodando? (MySQL do XAMPP ligado?)\n`))
    process.exit(1)
  }

  const emailRegistro = `registro.${sufixo}@teste.com`
  const emailUser = `user.${sufixo}@teste.com`
  const emailApagar = `apagar.${sufixo}@teste.com`

  // ---------------- 0. Preparação ----------------
  const S0 = '0. Preparação'
  await caso(S0, 'POST /public/register (sem token)', 200, () =>
    chamar('POST', '/public/register', {
      body: { nome: 'Registro Teste', email: emailRegistro, password: '123', role: 'USER' },
    }),
  )

  const loginAdmin = await caso(
    S0,
    `POST /public/login (${ADMIN_EMAIL})`,
    200,
    () => chamar('POST', '/public/login', { body: { email: ADMIN_EMAIL, password: ADMIN_SENHA } }),
    (r) => (r.dados?.token ? null : 'resposta sem token'),
  )
  const tokenAdmin = loginAdmin?.dados?.token
  if (!tokenAdmin) {
    imprimir()
    console.log(vermelho('\nSem token de ADMIN não dá para continuar. Confira ADMIN_EMAIL / ADMIN_SENHA.\n'))
    process.exit(1)
  }

  const criadoUser = await caso(S0, 'POST /users cria USER (ADMIN)', 201, () =>
    chamar('POST', '/users', {
      token: tokenAdmin,
      body: { nome: 'Usuario Teste', email: emailUser, senha: '123', tipo: 'USER' },
    }),
  )
  const idUser = criadoUser ? idDoLocation(criadoUser) : null

  const criadoApagar = await caso(S0, 'POST /users cria usuário a apagar (ADMIN)', 201, () =>
    chamar('POST', '/users', {
      token: tokenAdmin,
      body: { nome: 'Apagar Teste', email: emailApagar, senha: '123', tipo: 'USER' },
    }),
  )
  const idApagar = criadoApagar ? idDoLocation(criadoApagar) : null

  const loginUser = await caso(
    S0,
    'POST /public/login (USER)',
    200,
    () => chamar('POST', '/public/login', { body: { email: emailUser, password: '123' } }),
    (r) => (r.dados?.token ? null : 'resposta sem token'),
  )
  const tokenUser = loginUser?.dados?.token

  // ---------------- 1. Login ----------------
  const S1 = '1. Login (todos, sem token)'
  await caso(
    S1,
    'POST /public/login senha errada',
    401,
    () => chamar('POST', '/public/login', { body: { email: ADMIN_EMAIL, password: 'senha-errada' } }),
    temMensagem,
  )

  // ---------------- 2. Listar ----------------
  const S2 = '2. Listar imóveis (todos, sem token)'
  const lista = await caso(
    S2,
    'GET /imoveis',
    200,
    () => chamar('GET', '/imoveis'),
    (r) => (Array.isArray(r.dados) ? null : 'resposta não é uma lista'),
  )
  const primeiroId = Array.isArray(lista?.dados) && lista.dados[0]?.id

  // ---------------- 3. CRUD imóveis ----------------
  const S3 = '3. Cadastrar/alterar/remover imóveis (ADMIN)'
  const imovel = {
    titulo: `Casa teste ${sufixo}`,
    finalidade: 'VENDA',
    status: 'DISPONIVEL',
    precoVenda: 350000,
    dormitorios: 3,
  }
  await caso(S3, 'POST /imoveis sem token', 401, () => chamar('POST', '/imoveis', { body: imovel }), temMensagem)
  await caso(
    S3,
    'POST /imoveis token inválido',
    401,
    () => chamar('POST', '/imoveis', { token: 'token.invalido.123', body: imovel }),
    temMensagem,
  )
  await caso(
    S3,
    'POST /imoveis USER',
    403,
    () => chamar('POST', '/imoveis', { token: tokenUser, body: imovel }),
    temMensagem,
  )
  const criadoImovel = await caso(S3, 'POST /imoveis ADMIN', 201, () =>
    chamar('POST', '/imoveis', { token: tokenAdmin, body: imovel }),
  )
  const idImovel = criadoImovel ? idDoLocation(criadoImovel) : null

  await caso(S2, 'GET /imoveis/{id}', 200, () => chamar('GET', `/imoveis/${idImovel || primeiroId}`))

  const alterado = { ...imovel, titulo: `${imovel.titulo} (alterado)` }
  await caso(S3, 'PUT /imoveis/{id} USER', 403, () =>
    chamar('PUT', `/imoveis/${idImovel}`, { token: tokenUser, body: alterado }),
  )
  await caso(S3, 'PUT /imoveis/{id} ADMIN', 204, () =>
    chamar('PUT', `/imoveis/${idImovel}`, { token: tokenAdmin, body: alterado }),
  )

  // ---------------- 5. Status ----------------
  const S5 = '5. Alterar status (qualquer autenticado)'
  await caso(S5, 'PATCH /imoveis/{id}/status sem token', 401, () =>
    chamar('PATCH', `/imoveis/${idImovel}/status`, { body: { status: 'VENDIDO' } }),
  )
  await caso(
    S5,
    'PATCH /imoveis/{id}/status USER',
    200,
    () => chamar('PATCH', `/imoveis/${idImovel}/status`, { token: tokenUser, body: { status: 'VENDIDO' } }),
    (r) => (r.dados?.status === 'VENDIDO' ? null : 'status não foi alterado'),
  )
  await caso(S5, 'PATCH /imoveis/{id}/status ADMIN', 200, () =>
    chamar('PATCH', `/imoveis/${idImovel}/status`, { token: tokenAdmin, body: { status: 'DISPONIVEL' } }),
  )

  await caso(S3, 'DELETE /imoveis/{id} USER', 403, () =>
    chamar('DELETE', `/imoveis/${idImovel}`, { token: tokenUser }),
  )
  await caso(S3, 'DELETE /imoveis/{id} ADMIN', 204, () =>
    chamar('DELETE', `/imoveis/${idImovel}`, { token: tokenAdmin }),
  )
  await caso(S3, 'GET /imoveis/{id} apagado', 404, () => chamar('GET', `/imoveis/${idImovel}`))

  // ---------------- 4. Usuários ----------------
  const S4 = '4. Gerenciar usuários (ADMIN)'
  await caso(S4, 'GET /users sem token', 401, () => chamar('GET', '/users'), temMensagem)
  await caso(S4, 'GET /users USER', 403, () => chamar('GET', '/users', { token: tokenUser }), temMensagem)
  const usuarios = await caso(
    S4,
    'GET /users ADMIN (lista sem senha)',
    200,
    () => chamar('GET', '/users', { token: tokenAdmin }),
    (r) => {
      if (!Array.isArray(r.dados)) return 'resposta não é uma lista'
      return r.dados.some((u) => 'senha' in u || 'password' in u) ? 'a lista expõe a senha' : null
    },
  )
  await caso(S4, 'POST /users USER', 403, () =>
    chamar('POST', '/users', {
      token: tokenUser,
      body: { nome: 'X', email: `x.${sufixo}@teste.com`, senha: '123', tipo: 'USER' },
    }),
  )
  await caso(S4, 'PUT /users/{id} ADMIN', 204, () =>
    chamar('PUT', `/users/${idUser}`, {
      token: tokenAdmin,
      body: { nome: 'Usuario Teste (alterado)', email: emailUser, tipo: 'USER' },
    }),
  )
  await caso(S4, 'DELETE /users/{id} USER', 403, () => chamar('DELETE', `/users/${idApagar}`, { token: tokenUser }))
  await caso(S4, 'DELETE /users/{id} ADMIN', 204, () =>
    chamar('DELETE', `/users/${idApagar}`, { token: tokenAdmin }),
  )

  // ---------------- 7. Comportamentos que o front trata (Aula 2) ----------------
  const S7 = '7. Comportamentos que o front trata (Aula 2)'
  await caso(S7, 'POST /public/login campos vazios', 400, () =>
    chamar('POST', '/public/login', { body: { email: '', password: '' } }),
  )
  await caso(
    S7,
    'POST /public/login e-mail inexistente',
    401,
    () => chamar('POST', '/public/login', { body: { email: `ninguem.${sufixo}@teste.com`, password: '123' } }),
    (r) => (r.dados?.mensagem === 'E-mail ou senha inválidos' ? null : 'mensagem diferente do login com senha errada'),
  )
  await caso(
    S7,
    'payload do token (sub, tipo, exp de 2 h)',
    200,
    async () => ({ status: 200, dados: lerPayload(tokenUser) }),
    ({ dados: payload }) => {
      if (!payload) return 'token ilegível (o login do USER falhou?)'
      if (payload.sub !== emailUser) return `sub = ${payload.sub}`
      if (String(payload.tipo).toUpperCase() !== 'USER') return `tipo = ${payload.tipo}`
      const horas = (payload.exp - payload.iat) / 3600
      return Math.round(horas) === 2 ? null : `validade de ${horas.toFixed(1)} h`
    },
  )

  const tokenVencido = gerarTokenVencido(emailUser, 'USER')
  await caso(
    S7,
    'GET /users token expirado',
    401,
    () => chamar('GET', '/users', { token: tokenVencido }),
    (r) => (r.dados?.mensagem === 'Token expirado' ? null : `mensagem "${r.dados?.mensagem}" (JWT_SECRET diferente?)`),
  )
  await caso(S7, 'GET /imoveis token expirado (público ignora)', 200, () =>
    chamar('GET', '/imoveis', { token: tokenVencido }),
  )

  await caso(S7, 'GET /me sem token', 401, () => chamar('GET', '/me'), temMensagem)
  await caso(
    S7,
    'GET /me USER',
    200,
    () => chamar('GET', '/me', { token: tokenUser }),
    (r) => (r.dados?.email === emailUser && !('senha' in r.dados) ? null : 'dados do usuário errados ou com senha'),
  )

  await caso(
    S7,
    'GET /imoveis/busca?tamanho=2',
    200,
    () => chamar('GET', '/imoveis/busca?tamanho=2&ordem=preco_asc'),
    (r) => {
      const d = r.dados
      if (!d || !Array.isArray(d.conteudo)) return 'resposta sem "conteudo"'
      if (d.conteudo.length > 2) return `veio ${d.conteudo.length} itens com tamanho=2`
      if (typeof d.totalPaginas !== 'number' || typeof d.totalElementos !== 'number') return 'sem totais'
      return d.conteudo.every((i) => 'capaUrl' in i) ? null : 'imóvel sem "capaUrl"'
    },
  )
  await caso(
    S7,
    'GET /imoveis/busca precoMin > precoMax',
    400,
    () => chamar('GET', '/imoveis/busca?precoMin=500&precoMax=100'),
    temMensagem,
  )
  await caso(S7, 'GET /imoveis/busca finalidade inválida', 400, () => chamar('GET', '/imoveis/busca?finalidade=XYZ'), temMensagem)
  await caso(S7, 'GET /imoveis/abc (id não numérico)', 400, () => chamar('GET', '/imoveis/abc'))
  // não envia e-mail de verdade: a validação recusa antes
  await caso(
    S7,
    'POST /imoveis/{id}/contato sem nome (sem token)',
    400,
    () =>
      chamar('POST', `/imoveis/${primeiroId}/contato`, {
        body: { nome: '', email: 'cliente@teste.com', assunto: 'Teste', mensagem: 'Teste' },
      }),
    temMensagem,
  )
  await caso(
    S7,
    'POST /contato e-mail inválido',
    400,
    () => chamar('POST', '/contato', { body: { nome: 'Teste', email: 'invalido', assunto: 'Teste', mensagem: 'Teste' } }),
    temMensagem,
  )

  // ---------------- 6. CORS ----------------
  const S6 = `6. CORS para o front (${ORIGEM_FRONT})`
  const conferirOrigem = (r) =>
    r.headers.get('access-control-allow-origin') === ORIGEM_FRONT
      ? null
      : `sem Access-Control-Allow-Origin (recebido ${r.status})`
  await caso(
    S6,
    'OPTIONS /imoveis (preflight)',
    200,
    () =>
      chamar('OPTIONS', '/imoveis', {
        headers: {
          Origin: ORIGEM_FRONT,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      }),
    conferirOrigem,
  )
  await caso(S6, 'GET /imoveis com Origin', 200, () => chamar('GET', '/imoveis', { headers: { Origin: ORIGEM_FRONT } }), conferirOrigem)

  // ---------------- Limpeza ----------------
  const lixo = (Array.isArray(usuarios?.dados) ? usuarios.dados : []).filter((u) =>
    [emailRegistro, emailUser].includes(u.email),
  )
  for (const u of lixo) {
    await chamar('DELETE', `/users/${u.id}`, { token: tokenAdmin }).catch(() => {})
  }

  imprimir()
}

function imprimir() {
  let secaoAtual = null
  // agrupa por seção (a execução intercala seções porque um teste depende do outro)
  const ordenados = [...resultados].sort((a, b) => a.secao.localeCompare(b.secao, 'pt-BR', { numeric: true }))
  for (const r of ordenados) {
    if (r.secao !== secaoAtual) {
      secaoAtual = r.secao
      console.log(negrito(`\n${r.secao}`))
    }
    const marca = r.ok ? verde('✓') : vermelho('✗')
    const extra = r.ok ? cinza(`${r.esperado}`) : vermelho(`esperado ${r.esperado}, ${r.detalhe}`)
    console.log(`  ${marca} ${r.descricao.padEnd(46)} ${extra}`)
  }
  const falhas = resultados.filter((r) => !r.ok).length
  const total = resultados.length
  console.log(
    '\n' + (falhas === 0 ? verde(negrito(`Tudo certo: ${total}/${total} testes passaram.`)) : vermelho(negrito(`${falhas} de ${total} testes falharam.`))) + '\n',
  )
  process.exitCode = falhas === 0 ? 0 : 1
}

main()
