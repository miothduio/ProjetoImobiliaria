package com.example.demo.dtos;

/** Cliente ou corretor numa oferta/contrato. Nunca leva a senha. */
public record PessoaDTO(Integer id, String nome, String email) {}
