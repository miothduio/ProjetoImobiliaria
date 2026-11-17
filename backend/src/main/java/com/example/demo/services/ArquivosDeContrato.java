package com.example.demo.services;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Guarda os PDFs dos contratos numa pasta PRIVADA (app.contratos-dir, padrão ./contratos).
 * Diferente das fotos (/uploads, públicas), o PDF só sai pela API, conferindo o token:
 * GET /contratos/{id}/pdf.
 */
@Component
public class ArquivosDeContrato {

    private final Path pasta;

    public ArquivosDeContrato(@Value("${app.contratos-dir:./contratos}") String pasta) {
        this.pasta = Paths.get(pasta).toAbsolutePath().normalize();
    }

    public String salvar(Integer contratoId, byte[] conteudo) {
        try {
            Files.createDirectories(pasta);
            Path arquivo = pasta.resolve("contrato-" + contratoId + "-" + System.currentTimeMillis() + ".pdf");
            Files.write(arquivo, conteudo);
            return arquivo.toString();
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível gravar o PDF do contrato", e);
        }
    }

    public byte[] ler(String caminho) {
        try {
            return caminho == null ? null : Files.readAllBytes(Paths.get(caminho));
        } catch (IOException e) {
            return null;
        }
    }

    public void apagar(String caminho) {
        if (caminho == null) return;
        try {
            Files.deleteIfExists(Paths.get(caminho));
        } catch (IOException e) {
            System.out.println("Não foi possível apagar o arquivo: " + caminho);
        }
    }

    /** Confere a "assinatura" de arquivo PDF: todo PDF começa com %PDF. */
    public static boolean pareceUmPdf(byte[] conteudo) {
        return conteudo != null && conteudo.length > 4
                && conteudo[0] == '%' && conteudo[1] == 'P' && conteudo[2] == 'D' && conteudo[3] == 'F';
    }
}
