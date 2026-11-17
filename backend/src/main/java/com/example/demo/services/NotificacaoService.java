package com.example.demo.services;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.models.UserModel;

/**
 * Avisa o cliente por e-mail quando a oferta ou o contrato dele muda.
 *
 * O envio roda em segundo plano e nunca derruba a operação: se o SMTP falhar
 * (ou, no sandbox do Mailgun, o e-mail do cliente não estiver em "Authorized Recipients"),
 * a aprovação/assinatura continua valendo e o motivo aparece só no console.
 */
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    private final EmailService emailService;

    @Value("${app.front-url:http://localhost:5173}")
    private String frontUrl;

    public NotificacaoService(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * @param caminho rota do front para o botão do e-mail (ex.: "/cliente/contratos")
     */
    public void avisarCliente(UserModel cliente, String assunto, String titulo, String mensagem,
                              String detalhe, String rotuloBotao, String caminho) {
        if (cliente == null || cliente.getEmail() == null || cliente.getEmail().isBlank()) return;

        // monta tudo agora (dentro da transação); a thread do envio não acessa o banco
        String para = cliente.getEmail().trim();
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("assunto", assunto);
        variaveis.put("nomeCliente", primeiroNome(cliente.getNome()));
        variaveis.put("titulo", titulo);
        variaveis.put("mensagem", mensagem);
        variaveis.put("detalhe", detalhe);
        variaveis.put("rotuloBotao", rotuloBotao);
        variaveis.put("link", frontUrl.replaceAll("/+$", "") + caminho);

        CompletableFuture.runAsync(() -> {
            try {
                emailService.enviarEmailComTemplate(para, assunto, "email/aviso", variaveis);
                log.info("Aviso \"{}\" enviado para {}", assunto, para);
            } catch (Exception e) {
                log.warn("Aviso \"{}\" NÃO enviado para {}: {}. A operação foi concluída mesmo assim.",
                        assunto, para, e.getMessage());
            }
        });
    }

    private static String primeiroNome(String nome) {
        if (nome == null || nome.isBlank()) return "cliente";
        return nome.trim().split("\\s+")[0];
    }
}
