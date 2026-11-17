import { decodificarJwt } from './jwt.js'

/** Evento disparado pelo axios quando o backend responde 401 numa rota protegida. */
export const EVENTO_SESSAO_EXPIRADA = 'sessao-expirada'

export function avisarSessaoExpirada() {
  window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA))
}

/**
 * Perfis do front. No backend: tipo ADMIN -> ADMIN; CORRETOR -> CORRETOR; USER (ou vazio) -> CLIENTE.
 * O corretor usa a área /admin, mas só vê ofertas, contratos e o painel.
 */
export const PERFIS = { ADMIN: 'ADMIN', CORRETOR: 'CORRETOR', CLIENTE: 'CLIENTE' }

/** ADMIN e CORRETOR: quem atende as ofertas. */
export const EQUIPE = [PERFIS.ADMIN, PERFIS.CORRETOR]

/** Página inicial de cada perfil depois do login. */
export const ROTA_INICIAL = {
  [PERFIS.ADMIN]: '/admin',
  [PERFIS.CORRETOR]: '/admin/ofertas',
  [PERFIS.CLIENTE]: '/cliente',
}

const NOMES = { ADMIN: 'admin', CORRETOR: 'corretor', CLIENTE: 'cliente' }
export const nomeDoPerfil = (perfil) => NOMES[perfil] ?? ''

/**
 * Transforma o token numa sessão { token, email, perfil, expiraEm }.
 * Devolve null se o token for ilegível ou já estiver expirado.
 */
export function sessaoDoToken(token) {
  const payload = decodificarJwt(token)
  if (!payload?.sub || typeof payload.exp !== 'number') return null

  const expiraEm = payload.exp * 1000
  if (expiraEm <= Date.now()) return null

  // o backend faz toUpperCase() no tipo e trata vazio como USER; o front segue a mesma regra
  const tipo = String(payload.tipo ?? '').trim().toUpperCase()

  return {
    token,
    email: payload.sub,
    perfil: PERFIS[tipo] && tipo !== 'CLIENTE' ? PERFIS[tipo] : PERFIS.CLIENTE,
    expiraEm,
  }
}

export function tokenExpirado(token) {
  return sessaoDoToken(token) === null
}

/**
 * Para onde ir depois do login.
 * Volta para a página que a pessoa tentou abrir, se ela tiver acesso; senão, a área do perfil.
 */
export function destinoAposLogin(sessao, de) {
  const inicial = ROTA_INICIAL[sessao.perfil]
  if (!de || de === '/login') return inicial

  if (de.startsWith('/admin') && !podeAbrirAdmin(sessao.perfil, de)) return inicial
  if (de.startsWith('/cliente') && sessao.perfil !== PERFIS.CLIENTE) return inicial
  return de
}

/** Telas da área /admin que o corretor também abre. */
const TELAS_DO_CORRETOR = ['/admin', '/admin/ofertas', '/admin/contratos']

function podeAbrirAdmin(perfil, caminho) {
  if (perfil === PERFIS.ADMIN) return true
  if (perfil !== PERFIS.CORRETOR) return false
  const semQuery = caminho.split(/[?#]/)[0].replace(/\/$/, '')
  return TELAS_DO_CORRETOR.includes(semQuery)
}
