package com.example.demo.excecoes;

/** Usuário logado tentando mexer no que não é dele. Vira 403 Forbidden. */
public class AcessoNegadoException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
