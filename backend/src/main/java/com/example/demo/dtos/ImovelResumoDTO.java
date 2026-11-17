package com.example.demo.dtos;

import java.math.BigDecimal;

/** O mínimo do imóvel para as listas de ofertas, contratos e favoritos. */
public record ImovelResumoDTO(
    Integer id,
    String titulo,
    String status,
    String finalidade,
    BigDecimal precoVenda,
    BigDecimal precoAluguel,
    String tipo,
    String bairro,
    String cidade,
    String capaUrl
) {}
