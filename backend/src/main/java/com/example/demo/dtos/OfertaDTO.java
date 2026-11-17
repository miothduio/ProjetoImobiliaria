package com.example.demo.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Oferta como ela sai da API.
 * "contrato" é o contrato mais recente da oferta (ou null): o front usa para saber
 * se ainda falta preparar o contrato e em que pé ele está.
 */
public record OfertaDTO(
    Integer id,
    String tipo,
    BigDecimal valor,
    String mensagem,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    ImovelResumoDTO imovel,
    PessoaDTO cliente,
    ContratoResumoDTO contrato
) {
    public record ContratoResumoDTO(Integer id, String status) {}
}
