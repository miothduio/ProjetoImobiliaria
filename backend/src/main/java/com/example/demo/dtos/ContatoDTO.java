package com.example.demo.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corpo do formulário "Entrar em contato" (POST /imoveis/{id}/contato e POST /contato).
 * Assunto e mensagem chegam já editados pelo cliente na tela.
 */
public record ContatoDTO(
    @NotBlank(message = "Informe seu nome.")
    @Size(max = 120, message = "O nome pode ter no máximo 120 caracteres.")
    String nome,

    @NotBlank(message = "Informe seu e-mail.")
    @Email(message = "Digite um e-mail válido.")
    @Size(max = 160, message = "O e-mail pode ter no máximo 160 caracteres.")
    String email,

    @Size(max = 30, message = "O telefone pode ter no máximo 30 caracteres.")
    String telefone,

    @NotBlank(message = "Informe o assunto.")
    @Size(max = 150, message = "O assunto pode ter no máximo 150 caracteres.")
    String assunto,

    @NotBlank(message = "Escreva a mensagem.")
    @Size(max = 5000, message = "A mensagem pode ter no máximo 5000 caracteres.")
    String mensagem
) {}
