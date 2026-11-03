package com.example.demo.controllers;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.services.UserService;

/** Todas as rotas de /users exigem token de ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService service;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> listaDtos = service.getAllUsers()
                .stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(listaDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> find(@PathVariable Integer id) {
        UserModel model = service.find(id);

        if (model == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new UserDTO(model));
    }

    /**
     * Cadastro de usuário (somente ADMIN).
     * Body: { "nome": "Fulano", "email": "fulano@teste.com", "senha": "123", "tipo": "USER" }
     */
    @PostMapping
    public ResponseEntity<?> insert(@RequestBody UserDTO dto) {
        try {
            UserModel model = service.insert(dto);

            URI uri = ServletUriComponentsBuilder
                    .fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(model.getId())
                    .toUri();

            return ResponseEntity.created(uri).body(new UserDTO(model));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestBody UserDTO dto,
            @PathVariable Integer id) {

        if (service.find(id) == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            dto.setId(id);
            service.update(dto);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (service.find(id) == null) {
            return ResponseEntity.notFound().build();
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
