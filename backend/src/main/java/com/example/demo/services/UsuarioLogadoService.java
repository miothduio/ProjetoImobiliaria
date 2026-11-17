package com.example.demo.services;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.demo.excecoes.AcessoNegadoException;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

/** Transforma o usuário do token (e-mail) no registro do banco. */
@Service
public class UsuarioLogadoService {

    private final UserRepository repository;

    public UsuarioLogadoService(UserRepository repository) {
        this.repository = repository;
    }

    public UserModel atual(UserDetails principal) {
        if (principal == null) {
            throw new AcessoNegadoException("Faça login para continuar.");
        }
        return repository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new AcessoNegadoException("Usuário do token não existe mais."));
    }
}
