package com.example.demo.excecoes;

/** Registro que não existe (ou que a pessoa não pode ver). Vira 404 Not Found. */
public class NaoEncontradoException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public NaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
