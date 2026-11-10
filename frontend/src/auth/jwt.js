/**
 * Lê o payload de um JWT no navegador (sem validar a assinatura: quem valida é o backend).
 * Serve só para o front saber o perfil e quando o token expira.
 *
 * Payload gerado pelo backend: { iss: "imobiliaria-api", sub: "<e-mail>", tipo: "ADMIN" | "USER", iat, exp }
 * iat/exp estão em SEGUNDOS desde 1970.
 */
export function decodificarJwt(token) {
  if (typeof token !== 'string') return null
  const partes = token.split('.')
  if (partes.length !== 3) return null

  try {
    // base64url -> base64 com padding
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const comPadding = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    // atob devolve bytes; TextDecoder garante acentos corretos (UTF-8)
    const bytes = Uint8Array.from(atob(comPadding), (c) => c.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes))
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}
