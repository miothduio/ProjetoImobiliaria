package com.example.demo.dtos;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Corpo do POST /ofertas. Ex.: { "imovelId": 3, "tipo": "ALUGUEL", "valor": 1800, "mensagem": "..." } */
public record NovaOfertaDTO(
    @NotNull(message = "Informe o imóvel.")
    Integer imovelId,

    @NotBlank(message = "Escolha se a oferta é para alugar ou comprar.")
    String tipo,

    @NotNull(message = "Informe o valor da oferta.")
    @Positive(message = "O valor da oferta precisa ser maior que zero.")
    @DecimalMax(value = "9999999999999.99", message = "Valor alto demais.")
    BigDecimal valor,

    @Size(max = 1000, message = "A mensagem pode ter no máximo 1000 caracteres.")
    String mensagem
) {}
