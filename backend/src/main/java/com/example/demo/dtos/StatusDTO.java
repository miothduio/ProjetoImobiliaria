package com.example.demo.dtos;

import jakarta.validation.constraints.NotBlank;

/** Corpo do PATCH /imoveis/{id}/status. Ex.: { "status": "VENDIDO" } */
public record StatusDTO(@NotBlank String status) {}
