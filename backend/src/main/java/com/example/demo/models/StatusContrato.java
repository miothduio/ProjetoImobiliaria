package com.example.demo.models;

/**
 * Situação de um contrato.
 *
 * AGUARDANDO_APROVACAO  -> preparado pelo corretor, esperando o administrador
 * AGUARDANDO_ASSINATURA -> aprovado pelo administrador, esperando o cliente assinar
 * ASSINADO              -> o cliente assinou: o imóvel fica ALUGADO ou VENDIDO
 * RECUSADO              -> o administrador pediu correção; o corretor prepara outro para a mesma oferta
 * CANCELADO             -> o cliente desistiu: o imóvel volta a ficar DISPONÍVEL
 */
public enum StatusContrato {
    AGUARDANDO_APROVACAO, AGUARDANDO_ASSINATURA, ASSINADO, RECUSADO, CANCELADO
}
