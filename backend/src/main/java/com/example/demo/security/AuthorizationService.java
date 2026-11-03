package com.example.demo.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

/**
 * Ensina o Spring Security a buscar o usuário no banco pelo e-mail.
 * O campo "tipo" do UserModel (ADMIN ou USER) vira a role (ROLE_ADMIN / ROLE_USER).
 */
@Service
public class AuthorizationService implements UserDetailsService {

    @Autowired
    private UserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserModel user = repository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        String tipo = (user.getTipo() == null || user.getTipo().isBlank())
                ? "USER"
                : user.getTipo().toUpperCase();

        return User.withUsername(user.getEmail())
                .password(user.getSenha() == null ? "" : user.getSenha())
                .roles(tipo)
                .build();
    }
}
