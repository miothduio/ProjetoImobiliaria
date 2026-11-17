package com.example.demo.controllers;

import java.net.URI;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.NovaOfertaDTO;
import com.example.demo.dtos.OfertaDTO;
import com.example.demo.dtos.PaginaDTO;
import com.example.demo.services.OfertaService;
import com.example.demo.services.UsuarioLogadoService;

import jakarta.validation.Valid;

/**
 * Ofertas (ver regras de acesso no SecurityConfig).
 *
 * Cliente (USER)
 *   POST  /ofertas                    { imovelId, tipo, valor, mensagem? } -> 201 oferta
 *   GET   /ofertas/minhas             ?status=&imovelId=&pagina=&tamanho=  -> PaginaDTO
 *   PATCH /ofertas/{id}/cancelar      desiste de uma oferta pendente/em espera
 *
 * Corretor e Admin
 *   GET   /ofertas                    ?status=&imovelId=&pagina=&tamanho=  -> PaginaDTO
 *   PATCH /ofertas/{id}/aceitar       imóvel RESERVADO, outras pendentes EM_ESPERA
 *   PATCH /ofertas/{id}/recusar
 *
 * Erros: 400 validação | 403 perfil sem permissão | 404 não existe | 409 regra de negócio
 */
@RestController
@RequestMapping("/ofertas")
public class OfertaController {

    private final OfertaService service;
    private final UsuarioLogadoService usuarios;

    public OfertaController(OfertaService service, UsuarioLogadoService usuarios) {
        this.service = service;
        this.usuarios = usuarios;
    }

    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody NovaOfertaDTO dto, BindingResult erros,
                                   @AuthenticationPrincipal UserDetails principal) {
        if (erros.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", erros.getAllErrors().get(0).getDefaultMessage()));
        }
        OfertaDTO criada = service.criar(dto, usuarios.atual(principal));
        return ResponseEntity.created(URI.create("/ofertas/" + criada.id())).body(criada);
    }

    @GetMapping("/minhas")
    public PaginaDTO<OfertaDTO> minhas(@RequestParam(required = false) String status,
                                       @RequestParam(required = false) Integer imovelId,
                                       @RequestParam(defaultValue = "0") int pagina,
                                       @RequestParam(defaultValue = "10") int tamanho,
                                       @AuthenticationPrincipal UserDetails principal) {
        return service.listarDoCliente(usuarios.atual(principal), status, imovelId, pagina, tamanho);
    }

    @PatchMapping("/{id}/cancelar")
    public OfertaDTO cancelar(@PathVariable Integer id, @AuthenticationPrincipal UserDetails principal) {
        return service.cancelarPeloCliente(id, usuarios.atual(principal));
    }

    @GetMapping
    public PaginaDTO<OfertaDTO> todas(@RequestParam(required = false) String status,
                                      @RequestParam(required = false) Integer imovelId,
                                      @RequestParam(defaultValue = "0") int pagina,
                                      @RequestParam(defaultValue = "10") int tamanho) {
        return service.listarTodas(status, imovelId, pagina, tamanho);
    }

    @PatchMapping("/{id}/aceitar")
    public OfertaDTO aceitar(@PathVariable Integer id, @AuthenticationPrincipal UserDetails principal) {
        return service.aceitar(id, usuarios.atual(principal));
    }

    @PatchMapping("/{id}/recusar")
    public OfertaDTO recusar(@PathVariable Integer id, @AuthenticationPrincipal UserDetails principal) {
        return service.recusar(id, usuarios.atual(principal));
    }
}
