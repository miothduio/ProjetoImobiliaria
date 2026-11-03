package com.example.demo.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.TokenDTO;
import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.TokenService;
import com.example.demo.services.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/public")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    /**
     * POST /public/register  (igual ao exemplo da atividade)
     * Body: { "nome": "teste", "email": "teste3@teste.com", "password": "123", "role": "ADMIN" }
     * Resposta: 200 OK sem corpo
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDTO dto) {
        try {
            userService.insert(dto);   // valida, criptografa a senha (BCrypt) e salva
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * POST /public/login
     * Body: { "email": "admin@admin.com", "password": "admin123" }
     * Resposta: { "token": "eyJhbGciOi..." }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto) {
        try {
            // O AuthenticationManager busca o usuário (AuthorizationService)
            // e compara a senha digitada com o hash BCrypt salvo no banco
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.email(), dto.password()));

            UserModel user = userRepository.findByEmail(dto.email()).orElseThrow();
            return ResponseEntity.ok(new TokenDTO(tokenService.gerarToken(user)));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", 401, "erro", "Unauthorized",
                                 "mensagem", "E-mail ou senha inválidos"));
        }
    }
}
