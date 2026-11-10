package com.example.demo.dtos;

import java.util.List;

/**
 * Resposta paginada com nomes fixos, independente da versão do Spring Data
 * (o JSON de Page/PageImpl muda entre versões).
 *
 * Exemplo: { "conteudo": [...], "pagina": 0, "tamanho": 9, "totalElementos": 23, "totalPaginas": 3 }
 * "pagina" começa em 0.
 */
public record PaginaDTO<T>(
    List<T> conteudo,
    int pagina,
    int tamanho,
    long totalElementos,
    int totalPaginas
) {}
