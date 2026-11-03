package com.example.demo.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.exceptions.TokenExpiredException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Executa em toda requisição: lê o header "Authorization: Bearer <token>",
 * valida o token e, se estiver tudo certo, marca o usuário como autenticado.
 *
 * Se o token não vier ou for inválido, o usuário NÃO é autenticado e a requisição segue.
 * Quem decide se a rota pode ou não ser acessada é o SecurityConfig
 * (rota pública passa; rota protegida devolve 401).
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    /** Nome do atributo usado para levar o motivo do erro até o 401. */
    public static final String ATRIBUTO_ERRO = "erro_token";

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AuthorizationService authorizationService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            try {
                String email = tokenService.validarToken(token);
                UserDetails user = authorizationService.loadUserByUsername(email);

                var authentication = new UsernamePasswordAuthenticationToken(
                        user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (TokenExpiredException e) {
                request.setAttribute(ATRIBUTO_ERRO, "Token expirado");
            } catch (JWTVerificationException e) {
                request.setAttribute(ATRIBUTO_ERRO, "Token inválido");
            } catch (UsernameNotFoundException e) {
                request.setAttribute(ATRIBUTO_ERRO, "Usuário do token não existe mais");
            }
        }

        filterChain.doFilter(request, response);
    }
}
