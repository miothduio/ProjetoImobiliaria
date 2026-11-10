import api from './api.js'

/**
 * POST /public/login  { email, password } -> { token }
 * Erros: 401 { mensagem: "E-mail ou senha inválidos" } (também para e-mail que não existe);
 *        400 sem "mensagem" quando algum campo vai vazio (por isso a tela valida antes).
 */
export async function login(email, senha) {
  const { data } = await api.post('/public/login', { email: email.trim(), password: senha })
  if (!data?.token) throw new Error('O servidor não devolveu o token de acesso.')
  return data.token
}

/** GET /me (autenticado) -> { id, nome, email, tipo } */
export async function buscarUsuarioLogado() {
  const { data } = await api.get('/me')
  return data
}
