package com.example.demo.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.ImovelResumoDTO;
import com.example.demo.services.FavoritoService;
import com.example.demo.services.UsuarioLogadoService;

/**
 * Favoritos do cliente (somente USER).
 *   GET    /favoritos              -> imóveis favoritados (mais recentes primeiro)
 *   GET    /favoritos/ids          -> [3, 8, 12]
 *   POST   /favoritos/{imovelId}   -> 201 (adicionou) ou 200 (já estava)
 *   DELETE /favoritos/{imovelId}   -> 204
 */
@RestController
@RequestMapping("/favoritos")
public class FavoritoController {

    private final FavoritoService service;
    private final UsuarioLogadoService usuarios;

    public FavoritoController(FavoritoService service, UsuarioLogadoService usuarios) {
        this.service = service;
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<ImovelResumoDTO> listar(@AuthenticationPrincipal UserDetails principal) {
        return service.listar(usuarios.atual(principal));
    }

    @GetMapping("/ids")
    public List<Integer> ids(@AuthenticationPrincipal UserDetails principal) {
        return service.ids(usuarios.atual(principal));
    }

    @PostMapping("/{imovelId}")
    public ResponseEntity<Map<String, Object>> adicionar(@PathVariable Integer imovelId,
                                                         @AuthenticationPrincipal UserDetails principal) {
        boolean novo = service.adicionar(usuarios.atual(principal), imovelId);
        return ResponseEntity.status(novo ? HttpStatus.CREATED : HttpStatus.OK)
                .body(Map.of("imovelId", imovelId, "favorito", true));
    }

    @DeleteMapping("/{imovelId}")
    public ResponseEntity<Void> remover(@PathVariable Integer imovelId, @AuthenticationPrincipal UserDetails principal) {
        service.remover(usuarios.atual(principal), imovelId);
        return ResponseEntity.noContent().build();
    }
}
