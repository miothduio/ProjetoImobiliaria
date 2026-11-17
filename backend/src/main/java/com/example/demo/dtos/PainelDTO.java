package com.example.demo.dtos;

import java.util.List;

/**
 * GET /painel: totais e séries dos gráficos.
 * Cada série é uma lista de { chave, rotulo, total } já na ordem de exibição.
 */
public record PainelDTO(
    Totais totais,
    List<Contagem> imoveisPorBairro,
    List<Contagem> ofertasPorSituacao,
    List<Contagem> imoveisPorFinalidade,
    List<Contagem> imoveisPorStatus
) {
    public record Totais(
        long imoveis,
        long imoveisDisponiveis,
        long ofertasPendentes,
        long contratosAguardandoAprovacao,
        long contratosAguardandoAssinatura,
        long contratosAssinados
    ) {}

    public record Contagem(String chave, String rotulo, long total) {}
}
