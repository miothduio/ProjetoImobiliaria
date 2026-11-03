package com.example.demo.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotBlank;

/** Corpo do POST /public/login. Aceita "password" ou "senha". */
public record LoginDTO(
    @NotBlank String email,
    @NotBlank @JsonAlias("senha") String password
) {}
