package com.example.demo.dtos;

/**
 * Corpo do PATCH /contratos/{id}/assinar.
 * Assinatura eletrônica simples: o cliente confirma que leu ("aceite": true)
 * e digita o nome completo, igual ao do cadastro.
 */
public record AssinaturaDTO(String nome, Boolean aceite) {}
