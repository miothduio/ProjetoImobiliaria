package com.example.demo.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.example.demo.models.UserModel;

/**
 * Gera e valida os tokens JWT.
 *
 * Estrutura do token gerado:
 *  - Header : {"alg":"HS256","typ":"JWT"}
 *  - Payload: iss (emissor), sub (e-mail do usuário), tipo (ADMIN/USER), iat e exp
 *  - Assinatura: HMAC-SHA256 com a chave secreta definida no application.properties
 */
@Service
public class TokenService {

    private static final String ISSUER = "imobiliaria-api";

    @Value("${api.security.token.secret}")
    private String secret;

    @Value("${api.security.token.expiracao-horas:2}")
    private long expiracaoHoras;

    public String gerarToken(UserModel user) {
        Instant agora = Instant.now();
        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(user.getEmail())
                .withClaim("tipo", user.getTipo())
                .withIssuedAt(agora)
                .withExpiresAt(agora.plus(expiracaoHoras, ChronoUnit.HOURS))
                .sign(Algorithm.HMAC256(secret));
    }

    /**
     * Valida assinatura, emissor e expiração do token e devolve o e-mail (subject).
     * Lança JWTVerificationException (ou TokenExpiredException) se o token for inválido.
     */
    public String validarToken(String token) throws JWTVerificationException {
        return JWT.require(Algorithm.HMAC256(secret))
                .withIssuer(ISSUER)
                .build()
                .verify(token)
                .getSubject();
    }
}
