package com.example.demo.excecoes;

/** Dado enviado em formato errado (ex.: valor negativo, arquivo que não é PDF). Vira 400 Bad Request. */
public class DadosInvalidosException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public DadosInvalidosException(String mensagem) {
        super(mensagem);
    }
}
