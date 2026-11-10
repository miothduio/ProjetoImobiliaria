package com.example.demo.controllers;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.ContatoDTO;
import com.example.demo.models.ImovelModel;
import com.example.demo.services.EmailService;
import com.example.demo.services.ImovelService;

import jakarta.validation.Valid;

/**
 * "Entrar em contato" do site: o cliente edita assunto e mensagem e a API envia
 * para a caixa da imobiliária (EMAIL_IMOBILIARIA), com Reply-To no e-mail do cliente.
 *
 * POST /imoveis/{id}/contato  -> sobre um imóvel (o e-mail leva os dados e o link dele)
 * POST /contato               -> contato geral (página Contato)
 * Body: { nome, email, telefone?, assunto, mensagem }
 *
 * Respostas: 200 { mensagem } | 400 { mensagem } validação | 404 imóvel não existe
 *            503 e-mail da imobiliária não configurado | 502 o provedor de e-mail recusou/falhou
 *
 * Por que mandar para a imobiliária e não para o cliente: no sandbox do Mailgun só é
 * possível enviar para "Authorized Recipients". Um destino fixo (autorizado uma vez) funciona
 * sempre; o e-mail digitado por cada cliente, não.
 */
@RestController
public class ContatoController {

    private static final Logger log = LoggerFactory.getLogger(ContatoController.class);

    @Autowired
    private EmailService emailService;

    @Autowired
    private ImovelService imovelService;

    /** Endereço do front, para o link do imóvel no e-mail. */
    @Value("${app.front-url:http://localhost:5173}")
    private String frontUrl;

    @PostMapping("/imoveis/{id}/contato")
    public ResponseEntity<?> sobreImovel(@PathVariable Integer id,
                                         @Valid @RequestBody ContatoDTO dto, BindingResult erros) {
        if (erros.hasErrors()) {
            return erroDeValidacao(erros);
        }
        ImovelModel imovel = imovelService.find(id);
        if (imovel == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", "Imóvel não encontrado."));
        }

        Map<String, Object> variaveis = variaveisDoCliente(dto);
        variaveis.put("temImovel", true);
        variaveis.put("imovelCodigo", imovel.getId());
        variaveis.put("imovelTitulo", imovel.getTitulo());
        variaveis.put("imovelTipo", imovel.getTipoImovel() != null ? imovel.getTipoImovel().getNome() : null);
        variaveis.put("imovelBairro", imovel.getBairro() != null ? imovel.getBairro().getNome() : null);
        variaveis.put("imovelCidade", imovel.getBairro() != null ? imovel.getBairro().getCidade() : null);
        variaveis.put("imovelFinalidade", imovel.getFinalidade());
        variaveis.put("imovelVenda", moeda(imovel.getPrecoVenda()));
        variaveis.put("imovelAluguel", moeda(imovel.getPrecoAluguel()));
        variaveis.put("imovelLink", frontUrl.replaceAll("/+$", "") + "/imoveis/" + imovel.getId());

        return enviar(dto, variaveis);
    }

    @PostMapping("/contato")
    public ResponseEntity<?> geral(@Valid @RequestBody ContatoDTO dto, BindingResult erros) {
        if (erros.hasErrors()) {
            return erroDeValidacao(erros);
        }
        Map<String, Object> variaveis = variaveisDoCliente(dto);
        variaveis.put("temImovel", false);
        return enviar(dto, variaveis);
    }

    private ResponseEntity<?> enviar(ContatoDTO dto, Map<String, Object> variaveis) {
        if (!emailService.imobiliariaConfigurada()) {
            log.warn("Contato não enviado: EMAIL_IMOBILIARIA não está definido no backend/.env");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("mensagem", "O envio de e-mail ainda não foi configurado no servidor."));
        }
        try {
            emailService.enviarParaImobiliaria(dto.email().trim(), dto.assunto().trim(), "email/contato", variaveis);
            return ResponseEntity.ok(Map.of("mensagem", "Mensagem enviada."));
        } catch (Exception e) {
            // o detalhe técnico fica só no console; o cliente recebe uma frase amigável
            log.error("Falha ao enviar contato: {}. Confira MAIL_USERNAME/MAIL_PASSWORD no backend/.env e, "
                    + "no sandbox do Mailgun, se o EMAIL_IMOBILIARIA está em Authorized Recipients.", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("mensagem", "Não foi possível enviar o e-mail agora. Tente novamente em instantes."));
        }
    }

    private static Map<String, Object> variaveisDoCliente(ContatoDTO dto) {
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("nome", dto.nome().trim());
        variaveis.put("email", dto.email().trim());
        variaveis.put("telefone", dto.telefone() == null || dto.telefone().isBlank() ? null : dto.telefone().trim());
        variaveis.put("assunto", dto.assunto().trim());
        variaveis.put("mensagem", dto.mensagem().trim());
        return variaveis;
    }

    private static ResponseEntity<?> erroDeValidacao(BindingResult erros) {
        String mensagem = erros.getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.badRequest().body(Map.of("mensagem", mensagem));
    }

    private static String moeda(BigDecimal valor) {
        // NumberFormat não é thread-safe: um por chamada
        return valor == null ? null : NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(valor);
    }
}
