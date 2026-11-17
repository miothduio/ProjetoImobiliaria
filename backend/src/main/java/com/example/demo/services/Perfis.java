package com.example.demo.services;

import com.example.demo.models.UserModel;

/**
 * Perfis do sistema (campo "tipo" do usuário):
 *  ADMIN    -> administra tudo e aprova contratos
 *  CORRETOR -> aceita/recusa ofertas e prepara contratos
 *  USER     -> cliente: faz ofertas, guarda favoritos e assina contratos
 */
public final class Perfis {
    public static final String ADMIN = "ADMIN";
    public static final String CORRETOR = "CORRETOR";
    public static final String CLIENTE = "USER";

    private Perfis() {}

    /** Tipo em maiúsculas; vazio conta como USER (mesma regra do AuthorizationService). */
    public static String de(UserModel u) {
        if (u == null || u.getTipo() == null || u.getTipo().isBlank()) return CLIENTE;
        return u.getTipo().trim().toUpperCase();
    }

    public static boolean ehAdmin(UserModel u) {
        return ADMIN.equals(de(u));
    }

    /** ADMIN ou CORRETOR: quem atende as ofertas. */
    public static boolean ehEquipe(UserModel u) {
        String p = de(u);
        return ADMIN.equals(p) || CORRETOR.equals(p);
    }

    public static boolean ehCliente(UserModel u) {
        return CLIENTE.equals(de(u));
    }
}
