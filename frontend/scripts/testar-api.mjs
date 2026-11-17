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


  // ---------------- 8. Fluxo oferta -> contrato (Aula 3) ----------------
  const S8 = '8. Fluxo oferta → contrato e regras de negócio (Aula 3)'
  const criarUsuario = async (nome, email, tipo) => {
    const r = await chamar('POST', '/users', { token: tokenAdmin, body: { nome, email, senha: '123456', tipo } })
    return r.status === 201 ? idDoLocation(r) : null
  }
  const entrar = async (email) => (await chamar('POST', '/public/login', { body: { email, password: '123456' } })).dados?.token
  const emailCorretor = `corretor.${sufixo}@teste.com`
  const emailCliente1 = `cliente1.${sufixo}@teste.com`
  const emailCliente2 = `cliente2.${sufixo}@teste.com`
  const idsFluxo = {
    corretor: await criarUsuario('Corretor Teste', emailCorretor, 'CORRETOR'),
    cliente1: await criarUsuario('Cliente Um Teste', emailCliente1, 'USER'),
    cliente2: await criarUsuario('Cliente Dois Teste', emailCliente2, 'USER'),
  }
  await caso(S8, 'POST /users cria CORRETOR (novo perfil)', 200, async () => ({ status: idsFluxo.corretor ? 200 : 0 }))
  const tokCorretor = await entrar(emailCorretor)
  const tokC1 = await entrar(emailCliente1)
  const tokC2 = await entrar(emailCliente2)

  const novoImovel = async (dados) => {
    const r = await chamar('POST', '/imoveis', { token: tokenAdmin, body: { status: 'DISPONIVEL', dormitorios: 2, ...dados } })
    return r.status === 201 ? idDoLocation(r) : null
  }
  const imAluguel = await novoImovel({ titulo: `Apto aluguel ${sufixo}`, finalidade: 'ALUGUEL', precoAluguel: 1500 })
  const imVenda = await novoImovel({ titulo: `Casa venda ${sufixo}`, finalidade: 'VENDA', precoVenda: 300000 })
  const statusDoImovel = async (id) => (await chamar('GET', `/imoveis/${id}`)).dados?.status
  const situacaoDa = async (token, imovelId) =>
    (await chamar('GET', `/ofertas/minhas?imovelId=${imovelId}`, { token })).dados?.conteudo?.[0]?.status
  const ofertaAluguel = (valor) => ({ imovelId: imAluguel, tipo: 'ALUGUEL', valor, mensagem: 'Teste automático' })
  const esperaStatus = (s) => (r) => (r.dados?.status === s ? null : `status ${r.dados?.status}`)

  await caso(S8, 'POST /ofertas sem token', 401, () => chamar('POST', '/ofertas', { body: ofertaAluguel(1400) }))
  await caso(S8, 'POST /ofertas ADMIN (só cliente oferta)', 403, () => chamar('POST', '/ofertas', { token: tokenAdmin, body: ofertaAluguel(1400) }))
  await caso(S8, 'POST /ofertas valor negativo', 400, () => chamar('POST', '/ofertas', { token: tokC1, body: ofertaAluguel(-5) }), temMensagem)
  await caso(S8, 'POST /ofertas compra em imóvel só de aluguel', 409, () =>
    chamar('POST', '/ofertas', { token: tokC1, body: { ...ofertaAluguel(1400), tipo: 'VENDA' } }), temMensagem)
  const o1 = await caso(S8, 'POST /ofertas cliente 1', 201, () => chamar('POST', '/ofertas', { token: tokC1, body: ofertaAluguel(1400) }), esperaStatus('PENDENTE'))
  await caso(S8, 'POST /ofertas repetida no mesmo imóvel', 409, () => chamar('POST', '/ofertas', { token: tokC1, body: ofertaAluguel(1450) }), temMensagem)
  await caso(S8, 'POST /ofertas cliente 2 no mesmo imóvel', 201, () => chamar('POST', '/ofertas', { token: tokC2, body: ofertaAluguel(1500) }))
  await caso(S8, 'GET /ofertas/minhas traz só as do cliente', 200, () => chamar('GET', '/ofertas/minhas', { token: tokC1 }), (r) =>
    r.dados?.conteudo?.every((o) => o.cliente?.email === emailCliente1) && !JSON.stringify(r.dados).includes('senha') ? null : 'veio oferta de outro cliente ou senha')
  await caso(S8, 'GET /ofertas USER', 403, () => chamar('GET', '/ofertas', { token: tokC1 }))
  await caso(S8, 'GET /ofertas?status=pendente CORRETOR', 200, () => chamar('GET', '/ofertas?status=pendente', { token: tokCorretor }), (r) =>
    r.dados?.conteudo?.every((o) => o.status === 'PENDENTE') ? null : 'filtro não aplicado')

  const idO1 = o1?.dados?.id
  await caso(S8, 'PATCH /ofertas/{id}/aceitar USER', 403, () => chamar('PATCH', `/ofertas/${idO1}/aceitar`, { token: tokC1 }))
  await caso(S8, 'PATCH /ofertas/{id}/aceitar CORRETOR', 200, () => chamar('PATCH', `/ofertas/${idO1}/aceitar`, { token: tokCorretor }), esperaStatus('ACEITA'))
  await caso(S8, 'aceitar: imóvel fica RESERVADO', 200, async () => ({ status: 200, dados: { status: await statusDoImovel(imAluguel) } }), esperaStatus('RESERVADO'))
  await caso(S8, 'aceitar: a outra oferta fica EM_ESPERA', 200, async () => ({ status: 200, dados: { status: await situacaoDa(tokC2, imAluguel) } }), esperaStatus('EM_ESPERA'))
  await caso(S8, 'POST /ofertas em imóvel reservado', 409, () => chamar('POST', '/ofertas', { token: tokC2, body: ofertaAluguel(1600) }), temMensagem)

  const preparar = (token, ofertaId) => {
    const corpo = new FormData()
    corpo.append('ofertaId', String(ofertaId))
    return fetch(`${API_URL}/contratos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: corpo }).then(async (r) => ({
      status: r.status,
      dados: await r.json().catch(() => null),
    }))
  }
  await caso(S8, 'POST /contratos USER', 403, () => preparar(tokC1, idO1))
  const c1 = await caso(S8, 'POST /contratos CORRETOR (PDF gerado)', 201, () => preparar(tokCorretor, idO1), esperaStatus('AGUARDANDO_APROVACAO'))
  const idC1 = c1?.dados?.id
  await caso(S8, 'POST /contratos de novo na mesma oferta', 409, () => preparar(tokCorretor, idO1), temMensagem)
  await caso(S8, 'PATCH assinar antes da aprovação', 409, () =>
    chamar('PATCH', `/contratos/${idC1}/assinar`, { token: tokC1, body: { nome: 'Cliente Um Teste', aceite: true } }), temMensagem)
  await caso(S8, 'PATCH /contratos/{id}/aprovar CORRETOR', 403, () => chamar('PATCH', `/contratos/${idC1}/aprovar`, { token: tokCorretor }))
  await caso(S8, 'PATCH /contratos/{id}/aprovar ADMIN', 200, () => chamar('PATCH', `/contratos/${idC1}/aprovar`, { token: tokenAdmin }), esperaStatus('AGUARDANDO_ASSINATURA'))
  await caso(S8, 'GET /contratos/{id}/pdf de outro cliente', 404, () => chamar('GET', `/contratos/${idC1}/pdf`, { token: tokC2 }))
  await caso(S8, 'GET /contratos/{id}/pdf dono', 200, async () => {
    const r = await fetch(`${API_URL}/contratos/${idC1}/pdf`, { headers: { Authorization: `Bearer ${tokC1}` } })
    const inicio = Buffer.from(await r.arrayBuffer()).subarray(0, 4).toString()
    return { status: r.status, dados: { inicio, tipo: r.headers.get('content-type') } }
  }, (r) => (r.dados.inicio === '%PDF' && r.dados.tipo?.includes('pdf') ? null : `não é PDF (${r.dados.tipo})`))
  await caso(S8, 'PATCH assinar com nome diferente do cadastro', 400, () =>
    chamar('PATCH', `/contratos/${idC1}/assinar`, { token: tokC1, body: { nome: 'Outra Pessoa', aceite: true } }), temMensagem)
  await caso(S8, 'PATCH /contratos/{id}/assinar cliente', 200, () =>
    chamar('PATCH', `/contratos/${idC1}/assinar`, { token: tokC1, body: { nome: 'cliente um teste', aceite: true } }), esperaStatus('ASSINADO'))
  await caso(S8, 'assinar: imóvel fica ALUGADO', 200, async () => ({ status: 200, dados: { status: await statusDoImovel(imAluguel) } }), esperaStatus('ALUGADO'))
  await caso(S8, 'assinar: a oferta em espera é RECUSADA', 200, async () => ({ status: 200, dados: { status: await situacaoDa(tokC2, imAluguel) } }), esperaStatus('RECUSADA'))
  await caso(S8, 'PATCH cancelar contrato assinado', 409, () => chamar('PATCH', `/contratos/${idC1}/cancelar`, { token: tokenAdmin, body: {} }), temMensagem)

  // cliente desistiu: admin cancela e o imóvel volta
  const v2 = await chamar('POST', '/ofertas', { token: tokC2, body: { imovelId: imVenda, tipo: 'VENDA', valor: 290000 } })
  await chamar('POST', '/ofertas', { token: tokC1, body: { imovelId: imVenda, tipo: 'VENDA', valor: 280000 } })
  await chamar('PATCH', `/ofertas/${v2.dados?.id}/aceitar`, { token: tokenAdmin })
  const c2 = await preparar(tokenAdmin, v2.dados?.id)
  await chamar('PATCH', `/contratos/${c2.dados?.id}/aprovar`, { token: tokenAdmin })
  await caso(S8, 'PATCH /contratos/{id}/cancelar ADMIN (cliente desistiu)', 200, () =>
    chamar('PATCH', `/contratos/${c2.dados?.id}/cancelar`, { token: tokenAdmin, body: { motivo: 'Cliente desistiu' } }), esperaStatus('CANCELADO'))
  await caso(S8, 'cancelar: imóvel volta a DISPONIVEL', 200, async () => ({ status: 200, dados: { status: await statusDoImovel(imVenda) } }), esperaStatus('DISPONIVEL'))
  await caso(S8, 'cancelar: quem estava em espera volta a PENDENTE', 200, async () => ({ status: 200, dados: { status: await situacaoDa(tokC1, imVenda) } }), esperaStatus('PENDENTE'))

  // favoritos
  await caso(S8, 'POST /favoritos/{id}', 201, () => chamar('POST', `/favoritos/${imVenda}`, { token: tokC1 }))
  await caso(S8, 'POST /favoritos/{id} de novo (idempotente)', 200, () => chamar('POST', `/favoritos/${imVenda}`, { token: tokC1 }))
  await caso(S8, 'GET /favoritos/ids', 200, () => chamar('GET', '/favoritos/ids', { token: tokC1 }), (r) => (r.dados?.includes(imVenda) ? null : 'imóvel não está na lista'))
  await caso(S8, 'DELETE /favoritos/{id}', 204, () => chamar('DELETE', `/favoritos/${imVenda}`, { token: tokC1 }))
  await caso(S8, 'GET /favoritos ADMIN', 403, () => chamar('GET', '/favoritos', { token: tokenAdmin }))

  // painel e usuários
  await caso(S8, 'GET /painel CORRETOR', 200, () => chamar('GET', '/painel', { token: tokCorretor }), (r) =>
    typeof r.dados?.totais?.ofertasPendentes === 'number' && Array.isArray(r.dados?.imoveisPorBairro) ? null : 'painel sem totais/séries')
  await caso(S8, 'GET /painel USER', 403, () => chamar('GET', '/painel', { token: tokC1 }))
  const eu = (await chamar('GET', '/me', { token: tokenAdmin })).dados
  await caso(S8, 'DELETE /users/{id} o próprio admin', 409, () => chamar('DELETE', `/users/${eu?.id}`, { token: tokenAdmin }), temMensagem)

  // limpeza do fluxo: excluir imóvel e usuários leva junto ofertas, contratos e favoritos
  await caso(S8, 'DELETE /imoveis/{id} com ofertas e contrato', 204, () => chamar('DELETE', `/imoveis/${imAluguel}`, { token: tokenAdmin }))
  await chamar('DELETE', `/imoveis/${imVenda}`, { token: tokenAdmin })
  for (const id of Object.values(idsFluxo)) {
    if (id) await chamar('DELETE', `/users/${id}`, { token: tokenAdmin })
  }

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
