package com.example.demo.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Contrato como ele sai da API. O PDF é baixado à parte: GET /contratos/{id}/pdf. */
public record ContratoDTO(
    Integer id,
    String status,
    LocalDateTime createdAt,
    LocalDateTime dataAprovacao,
    LocalDateTime dataAssinatura,
    String assinadoComo,
    String motivo,
    String pdfNome,
    Boolean pdfGerado,
    PessoaDTO preparadoPor,
    OfertaDoContratoDTO oferta,
    ImovelResumoDTO imovel,
    PessoaDTO cliente
) {
    public record OfertaDoContratoDTO(Integer id, String tipo, BigDecimal valor, String status) {}
}
