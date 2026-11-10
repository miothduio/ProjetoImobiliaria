package com.example.demo.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String remetente;

    /** Caixa que recebe o "Entrar em contato" do site (EMAIL_IMOBILIARIA no backend/.env). */
    @Value("${app.email.imobiliaria:}")
    private String emailImobiliaria;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    /** Envia para um destinatário qualquer (ex.: "saber mais", que responde ao cliente). */
    public void enviarEmailComTemplate(String para, String assunto,
                                       String template, Map<String, Object> variaveis)
            throws MessagingException {
        enviar(para, null, assunto, template, variaveis);
    }

    /**
     * Envia para a caixa da imobiliária. "responderPara" vira o Reply-To:
     * ao clicar em "Responder", a resposta vai direto para o cliente.
     */
    public void enviarParaImobiliaria(String responderPara, String assunto,
                                      String template, Map<String, Object> variaveis)
            throws MessagingException {
        enviar(emailImobiliaria.trim(), responderPara, assunto, template, variaveis);
    }

    public boolean imobiliariaConfigurada() {
        return emailImobiliaria != null && !emailImobiliaria.isBlank();
    }

    private void enviar(String para, String responderPara, String assunto,
                        String template, Map<String, Object> variaveis) throws MessagingException {
        if (remetente == null || remetente.isBlank()) {
            throw new IllegalStateException("MAIL_USERNAME não configurado (arquivo backend/.env)");
        }

        Context context = new Context();
        context.setVariables(variaveis);
        String html = templateEngine.process(template, context);

        MimeMessage mime = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
        helper.setFrom(remetente);
        helper.setTo(para);
        if (responderPara != null && !responderPara.isBlank()) {
            helper.setReplyTo(responderPara);
        }
        helper.setSubject(assunto);
        helper.setText(html, true);

        mailSender.send(mime);
    }

    /**
     * Ao subir a aplicação, avisa no console se o e-mail não vai funcionar.
     * Causa mais comum: rodar o backend fora da pasta backend/, e aí o .env não é encontrado.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void conferirConfiguracao() {
        Path pasta = Path.of("").toAbsolutePath();
        boolean temEnv = Files.exists(pasta.resolve(".env"));

        if (remetente == null || remetente.isBlank()) {
            log.warn(">>> E-MAIL DESATIVADO: MAIL_USERNAME está vazio. O backend procura o .env em {} ({}). "
                    + "Rode o backend a partir da pasta backend/.",
                    pasta.resolve(".env"), temEnv ? "encontrado, mas sem MAIL_USERNAME" : "NÃO encontrado");
        } else if (!imobiliariaConfigurada()) {
            log.warn(">>> Formulário de contato sem destino: defina EMAIL_IMOBILIARIA no backend/.env.");
        } else {
            log.info(">>> E-mail configurado: remetente {}, contatos do site vão para {}", remetente, emailImobiliaria);
        }
    }
}
