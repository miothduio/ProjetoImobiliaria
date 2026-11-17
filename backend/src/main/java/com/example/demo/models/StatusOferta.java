package com.example.demo.models;

/**
 * Situação de uma oferta.
 *
 * PENDENTE  -> acabou de ser enviada, aguarda o corretor
 * ACEITA    -> o corretor aceitou: o imóvel fica RESERVADO e o contrato é preparado
 * EM_ESPERA -> havia outra oferta aceita no mesmo imóvel; volta a PENDENTE se aquele contrato for cancelado
 * RECUSADA  -> recusada pelo corretor, ou porque o imóvel foi alugado/vendido para outra pessoa
 * CANCELADA -> o cliente desistiu (ou o contrato dela foi cancelado)
 */
public enum StatusOferta {
    PENDENTE, ACEITA, EM_ESPERA, RECUSADA, CANCELADA
}
