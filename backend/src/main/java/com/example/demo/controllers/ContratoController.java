package com.example.demo.controllers;

import java.net.URI;
import java.nio.charset.StandardCharsets;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.AssinaturaDTO;
import com.example.demo.dtos.ContratoDTO;
import com.example.demo.dtos.MotivoDTO;
import com.example.demo.dtos.PaginaDTO;
import com.example.demo.services.ContratoService;
import com.example.demo.services.UsuarioLogadoService;

/**
 * Contratos (ver regras de acesso no SecurityConfig).
 *
 * Corretor e Admin
 *   POST  /contratos                 multipart: ofertaId, arquivo? (PDF; sem arquivo o sistema gera) -> 201
 *   GET   /contratos                 ?status=&pagina=&tamanho= -> PaginaDTO
 * Admin
 *   PATCH /contratos/{id}/aprovar    -> AGUARDANDO_ASSINATURA, e-mail para o cliente
 *   PATCH /contratos/{id}/recusar    { motivo? } -> RECUSADO
 *   PATCH /contratos/{id}/cancelar   { motivo? } -> CANCELADO, imóvel volta a DISPONÍVEL
 * Cliente (USER)
 *   GET   /contratos/meus            ?status=&pagina=&tamanho=
 *   PATCH /contratos/{id}/assinar    { nome, aceite: true } -> ASSINADO, imóvel ALUGADO/VENDIDO
 * Todos os logados (dono ou equipe)
 *   GET   /contratos/{id}/pdf        -> application/pdf
 */
@RestController
@RequestMapping("/contratos")
public class ContratoController {

    private final ContratoService service;
    private final UsuarioLogadoService usuarios;

    public ContratoController(ContratoService service, UsuarioLogadoService usuarios) {
        this.service = service;
        this.usuarios = usuarios;
    }

    @PostMapping
    public ResponseEntity<ContratoDTO> preparar(@RequestParam(required = false) Integer ofertaId,
                                                @RequestParam(value = "arquivo", required = false) MultipartFile arquivo,
                                                @AuthenticationPrincipal UserDetails principal) {
        ContratoDTO criado = service.preparar(ofertaId, arquivo, usuarios.atual(principal));
        return ResponseEntity.created(URI.create("/contratos/" + criado.id())).body(criado);
    }

    @GetMapping
    public PaginaDTO<ContratoDTO> todos(@RequestParam(required = false) String status,
                                        @RequestParam(defaultValue = "0") int pagina,
                                        @RequestParam(defaultValue = "10") int tamanho) {
        return service.listarTodos(status, pagina, tamanho);
    }

    @GetMapping("/meus")
    public PaginaDTO<ContratoDTO> meus(@RequestParam(required = false) String status,
                                       @RequestParam(defaultValue = "0") int pagina,
                                       @RequestParam(defaultValue = "10") int tamanho,
                                       @AuthenticationPrincipal UserDetails principal) {
        return service.listarDoCliente(usuarios.atual(principal), status, pagina, tamanho);
    }

    @PatchMapping("/{id}/aprovar")
    public ContratoDTO aprovar(@PathVariable Integer id, @AuthenticationPrincipal UserDetails principal) {
        return service.aprovar(id, usuarios.atual(principal));
    }

    @PatchMapping("/{id}/recusar")
    public ContratoDTO recusar(@PathVariable Integer id, @RequestBody(required = false) MotivoDTO dto,
                               @AuthenticationPrincipal UserDetails principal) {
        return service.recusar(id, dto == null ? null : dto.motivo(), usuarios.atual(principal));
    }

    @PatchMapping("/{id}/cancelar")
    public ContratoDTO cancelar(@PathVariable Integer id, @RequestBody(required = false) MotivoDTO dto,
                                @AuthenticationPrincipal UserDetails principal) {
        return service.cancelar(id, dto == null ? null : dto.motivo(), usuarios.atual(principal));
    }

    @PatchMapping("/{id}/assinar")
    public ContratoDTO assinar(@PathVariable Integer id, @RequestBody(required = false) AssinaturaDTO dto,
                               @AuthenticationPrincipal UserDetails principal) {
        return service.assinar(id, dto, usuarios.atual(principal));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Integer id, @AuthenticationPrincipal UserDetails principal) {
        ContratoService.ArquivoPdf arquivo = service.pdf(id, usuarios.atual(principal));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(arquivo.nome(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.conteudo());
    }
}
