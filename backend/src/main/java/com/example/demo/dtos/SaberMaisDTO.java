package com.example.demo.dtos;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SaberMaisDTO(
    @NotBlank String nome,
    @NotBlank String telefone,
    @NotBlank @Email String email,
    @NotBlank String mensagem,
    LocalDateTime createdAt
) {
    // Se o cliente não enviar createdAt, preenche com o momento atual
    public SaberMaisDTO {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}