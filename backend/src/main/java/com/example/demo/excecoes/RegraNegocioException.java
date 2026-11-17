package com.example.demo.excecoes;

/** Pedido que quebra uma regra do sistema (ex.: oferta em imóvel reservado). Vira 409 Conflict. */
public class RegraNegocioException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
