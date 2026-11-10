package com.example.demo.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.UserDTO;
import com.example.demo.repositories.UserRepository;

/**
 * GET /me  (qualquer usuário autenticado: ADMIN ou USER)
 * Devolve os dados de quem está logado, a partir do token: { id, nome, email, tipo }.
 * O front usa para mostrar o nome no menu e para conferir, ao abrir o site,
 * se o token salvo ainda é aceito pelo backend (senão recebe 401).
 *
 * Não precisa de regra no SecurityConfig: cai em anyRequest().authenticated().
 */
@RestController
public class PerfilController {

    @Autowired
    private UserRepository repository;

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails usuario) {
        return repository.findByEmail(usuario.getUsername())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(new UserDTO(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("status", 401, "erro", "Unauthorized",
                                     "mensagem", "Usuário do token não existe mais")));
    }
}
