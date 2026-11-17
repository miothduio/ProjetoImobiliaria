package com.example.demo.services;

import java.util.Locale;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.example.demo.dtos.PaginaDTO;
import com.example.demo.excecoes.DadosInvalidosException;

/** Utilitários das listas paginadas (mesmo formato da vitrine: PaginaDTO). */
final class Paginas {

    static final int TAMANHO_MAXIMO = 50;

    private Paginas() {}

    /** Mais recentes primeiro. pagina começa em 0; tamanho entre 1 e 50. */
    static Pageable pedido(int pagina, int tamanho) {
        return PageRequest.of(Math.max(0, pagina), Math.max(1, Math.min(tamanho, TAMANHO_MAXIMO)),
                Sort.by(Sort.Direction.DESC, "id"));
    }

    static <M, D> PaginaDTO<D> converter(Page<M> pagina, Function<M, D> conversao) {
        return new PaginaDTO<>(pagina.getContent().stream().map(conversao).toList(),
                pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    /** "pendente", "Em espera", "EM_ESPERA" -> EM_ESPERA. Vazio -> null (sem filtro). */
    static <E extends Enum<E>> E status(String texto, Class<E> tipo) {
        if (texto == null || texto.isBlank()) return null;
        String chave = ImovelService.normalizar(texto).replace(' ', '_').replace('-', '_').toUpperCase(Locale.ROOT);
        try {
            return Enum.valueOf(tipo, chave);
        } catch (IllegalArgumentException e) {
            throw new DadosInvalidosException("Situação inválida: " + texto + ".");
        }
    }
}
