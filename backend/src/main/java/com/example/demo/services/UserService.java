package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserModel> getAllUsers() {
        return repository.findAll();
    }

    public UserModel find(Integer id) {
        Optional<UserModel> user = repository.findById(id);
        return user.orElse(null);
    }

    public UserModel insert(UserDTO dto) {
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório");
        }
        if (dto.getSenha() == null || dto.getSenha().isBlank()) {
            throw new IllegalArgumentException("Senha é obrigatória");
        }
        if (repository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Já existe um usuário com este e-mail");
        }

        UserModel user = new UserModel();
        user.setNome(dto.getNome());
        user.setEmail(dto.getEmail());
        user.setTipo(normalizarTipo(dto.getTipo()));
        // Nunca salvar a senha em texto puro: guarda o hash BCrypt
        user.setSenha(passwordEncoder.encode(dto.getSenha()));

        return repository.save(user);
    }

    public UserModel update(UserDTO dto) {
        UserModel user = find(dto.getId());

        if (user == null) {
            return null;
        }

        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())
                && repository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Já existe um usuário com este e-mail");
        }

        user.setNome(dto.getNome());
        user.setEmail(dto.getEmail());
        user.setTipo(normalizarTipo(dto.getTipo()));

        // Só troca a senha se uma nova foi enviada
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            user.setSenha(passwordEncoder.encode(dto.getSenha()));
        }

        return repository.save(user);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    /** Aceita "admin", "ADMIN", "user"... Se não vier nada, o usuário é USER. */
    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return "USER";
        }
        String t = tipo.trim().toUpperCase();
        if (!t.equals("ADMIN") && !t.equals("USER")) {
            throw new IllegalArgumentException("Tipo inválido: use ADMIN ou USER");
        }
        return t;
    }
}
