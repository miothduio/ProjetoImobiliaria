package com.example.demo.controllers;

import java.math.BigDecimal;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.demo.dtos.PaginaDTO;
import com.example.demo.dtos.SaberMaisDTO;
import com.example.demo.dtos.StatusDTO;
import com.example.demo.models.ImovelModel;
import com.example.demo.services.EmailService;
import com.example.demo.services.ImovelService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/imoveis")
public class ImovelController {

    @Autowired 
    private ImovelService service;

    @Autowired
    private EmailService emailService;

    @GetMapping
    public ResponseEntity<List<ImovelModel>> getAll() {
        List<ImovelModel> list = service.getAll();
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }

    /**
     * GET /imoveis/busca  (público, usado pela vitrine)
     * Parâmetros opcionais: bairroId, finalidade (VENDA|ALUGUEL), precoMin, precoMax,
     * ordem (recentes|preco_asc|preco_desc), apenasDisponiveis (padrão true),
     * pagina (começa em 0), tamanho (padrão 9, máximo 50).
     * Resposta: { conteudo, pagina, tamanho, totalElementos, totalPaginas }; cada imóvel traz "capaUrl".
     * Filtro inválido -> 400 { "mensagem": "..." }
     */
    @GetMapping("/busca")
    public ResponseEntity<?> buscar(
            @RequestParam(required = false) Integer bairroId,
            @RequestParam(required = false) String finalidade,
            @RequestParam(required = false) BigDecimal precoMin,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(defaultValue = "recentes") String ordem,
            @RequestParam(defaultValue = "true") boolean apenasDisponiveis,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "9") int tamanho) {
        try {
            PaginaDTO<ImovelModel> resultado = service.buscar(bairroId, finalidade, precoMin, precoMax,
                    ordem, apenasDisponiveis, pagina, tamanho);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @GetMapping(value = "/{id}")
    public ResponseEntity<ImovelModel> find(@PathVariable Integer id) {
        ImovelModel model = service.find(id);
        if (model != null) {
            return ResponseEntity.status(HttpStatus.OK).body(model);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> insert(@RequestBody ImovelModel model) {
        model = service.insert(model);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(model.getId()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @PutMapping(value = "/{id}")
    public ResponseEntity<Void> update(@RequestBody ImovelModel model, @PathVariable Integer id) {
        try {
            model.setId(id);
            model = service.update(model);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (service.find(id) == null) {
            return ResponseEntity.notFound().build();
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Alterar status (qualquer usuário autenticado) ----------

    /**
     * PATCH /imoveis/{id}/status
     * Body: { "status": "VENDIDO" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ImovelModel> alterarStatus(@PathVariable Integer id,
                                                     @Valid @RequestBody StatusDTO dto) {
        ImovelModel model = service.alterarStatus(id, dto.status());
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(model);
    }

    // ---------- Saber mais (envia e-mail com os dados do imóvel) ----------

    @PostMapping("/sabermais/{id}")
    public ResponseEntity<String> saberMais(@PathVariable Integer id,
                                            @Valid @RequestBody SaberMaisDTO dto) {
        ImovelModel imovel = service.find(id);
        if (imovel == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Imóvel não encontrado");
        }

        try {
            Map<String, Object> variaveis = new HashMap<>();
            variaveis.put("nomeCliente", dto.nome());
            variaveis.put("mensagemCliente", dto.mensagem());
            variaveis.put("mensagemImobiliaria",
                    "Obrigado pelo seu interesse! Um de nossos corretores entrará em contato em breve pelo telefone "
                    + dto.telefone() + ".");

            variaveis.put("titulo", imovel.getTitulo());
            variaveis.put("descricao", imovel.getDescricao());
            variaveis.put("finalidade", imovel.getFinalidade());
            variaveis.put("precoVenda", imovel.getPrecoVenda());
            variaveis.put("precoAluguel", imovel.getPrecoAluguel());
            variaveis.put("dormitorios", imovel.getDormitorios());
            variaveis.put("banheiros", imovel.getBanheiros());
            variaveis.put("garagem", imovel.getGaragem());
            variaveis.put("areaTotal", imovel.getAreaTotal());
            variaveis.put("areaConstruida", imovel.getAreaConstruida());
            variaveis.put("caracteristicas", imovel.getCaracteristicas());
            variaveis.put("endereco", montarEndereco(imovel));
            variaveis.put("tipo", imovel.getTipoImovel() != null ? imovel.getTipoImovel().getNome() : null);
            variaveis.put("bairro", imovel.getBairro() != null ? imovel.getBairro().getNome() : null);

            emailService.enviarEmailComTemplate(
                    dto.email(),
                    "Informações sobre o imóvel: " + imovel.getTitulo(),
                    "email/saber-mais",
                    variaveis);

            return ResponseEntity.ok("E-mail enviado");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Falha ao enviar e-mail: " + e.getMessage());
        }
    }

    private String montarEndereco(ImovelModel i) {
        StringBuilder sb = new StringBuilder();
        if (i.getEndereco() != null) sb.append(i.getEndereco());
        if (i.getNumero() != null) sb.append(", ").append(i.getNumero());
        if (i.getComplemento() != null && !i.getComplemento().isBlank()) sb.append(" - ").append(i.getComplemento());
        if (i.getCep() != null) sb.append(" (CEP ").append(i.getCep()).append(")");
        return sb.toString();
    }
}