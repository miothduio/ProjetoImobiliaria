import { decodificarJwt } from './jwt.js'

/** Evento disparado pelo axios quando o backend responde 401 numa rota protegida. */
export const EVENTO_SESSAO_EXPIRADA = 'sessao-expirada'

export function avisarSessaoExpirada() {
  window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA))
}

/** Perfis do front. No backend: tipo ADMIN -> ADMIN; USER (ou vazio) -> CLIENTE. */
export const PERFIS = { ADMIN: 'ADMIN', CLIENTE: 'CLIENTE' }

/** Página inicial de cada perfil depois do login. */
export const ROTA_INICIAL = {
  [PERFIS.ADMIN]: '/admin',
  [PERFIS.CLIENTE]: '/cliente',
}

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
    perfil: tipo === 'ADMIN' ? PERFIS.ADMIN : PERFIS.CLIENTE,
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

  const areaAdmin = de.startsWith('/admin')
  const areaCliente = de.startsWith('/cliente')
  if (areaAdmin && sessao.perfil !== PERFIS.ADMIN) return inicial
  if (areaCliente && sessao.perfil !== PERFIS.CLIENTE) return inicial
  return de
}
