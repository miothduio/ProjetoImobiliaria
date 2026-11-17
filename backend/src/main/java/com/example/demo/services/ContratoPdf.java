package com.example.demo.services;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;

/**
 * Gera o PDF do contrato sem biblioteca externa: escreve o formato PDF "na mão"
 * (texto com as fontes padrão Helvetica, quebra de linha e de página).
 * Os acentos funcionam porque o texto vai em WinAnsiEncoding (Latin-1).
 *
 * É um modelo simples, para o fluxo do trabalho. Se o corretor preferir,
 * ele envia o próprio PDF ao preparar o contrato.
 */
public final class ContratoPdf {

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    // A4 em pontos (1/72 de polegada)
    private static final int LARGURA = 595;
    private static final int ALTURA = 842;
    private static final int MARGEM = 60;

    private ContratoPdf() {}

    /** Texto do contrato a partir da oferta (e, se já assinado, com o registro da assinatura). */
    public static byte[] gerar(ContratoModel contrato) {
        OfertaModel oferta = contrato.getOferta();
        ImovelModel imovel = oferta.getImovel();
        UserModel cliente = oferta.getUsuario();
        boolean aluguel = "ALUGUEL".equals(oferta.getTipo());

        Documento doc = new Documento();
        doc.titulo(aluguel ? "CONTRATO DE LOCAÇÃO DE IMÓVEL" : "CONTRATO DE PROMESSA DE COMPRA E VENDA");
        doc.subtitulo("Contrato nº " + contrato.getId() + "  |  Oferta nº " + oferta.getId()
                + "  |  Emitido em " + DATA.format(LocalDateTime.now()));

        doc.secao("1. PARTES");
        doc.paragrafo("IMOBILIÁRIA (intermediadora): Imobiliária, Panambi/RS, neste ato representada pelo seu corretor responsável"
                + (contrato.getPreparadoPor() != null ? ", " + contrato.getPreparadoPor().getNome() : "") + ".");
        doc.paragrafo((aluguel ? "LOCATÁRIO(A): " : "COMPRADOR(A): ") + valor(cliente.getNome(), "(nome não informado)")
                + ", e-mail " + cliente.getEmail() + ".");

        doc.secao("2. IMÓVEL");
        doc.paragrafo("Código " + imovel.getId() + ": " + valor(imovel.getTitulo(), "imóvel sem título") + ".");
        String tipo = imovel.getTipoImovel() != null ? imovel.getTipoImovel().getNome() : null;
        String endereco = endereco(imovel);
        if (tipo != null) doc.paragrafo("Tipo: " + tipo + ".");
        if (!endereco.isBlank()) doc.paragrafo("Endereço: " + endereco + ".");

        doc.secao("3. VALOR E CONDIÇÕES");
        if (aluguel) {
            doc.paragrafo("O aluguel mensal acordado é de " + moeda(oferta.getValor())
                    + ", com vencimento todo dia 10, pelo prazo inicial de 30 (trinta) meses, reajustado anualmente pelo IGP-M.");
        } else {
            doc.paragrafo("O preço total acordado é de " + moeda(oferta.getValor())
                    + ", a ser pago na forma combinada entre as partes até a lavratura da escritura pública.");
        }
        if (oferta.getMensagem() != null && !oferta.getMensagem().isBlank()) {
            doc.paragrafo("Observações do cliente na oferta: \"" + oferta.getMensagem().trim() + "\"");
        }

        doc.secao("4. CLÁUSULAS GERAIS");
        doc.paragrafo("4.1. Com a assinatura deste contrato, o imóvel deixa de receber novas ofertas e passa à situação "
                + (aluguel ? "ALUGADO" : "VENDIDO") + ".");
        doc.paragrafo("4.2. As despesas de " + (aluguel ? "consumo (água, luz e gás) e o IPTU ficam a cargo do LOCATÁRIO."
                : "escritura, registro e ITBI ficam a cargo do COMPRADOR, salvo acordo diferente por escrito."));
        doc.paragrafo("4.3. A desistência antes da assinatura cancela este contrato sem custo, e o imóvel volta a ficar disponível.");
        doc.paragrafo("4.4. Fica eleito o foro da comarca de Panambi/RS para dirimir dúvidas deste contrato.");

        doc.secao("5. ASSINATURA ELETRÔNICA");
        if (contrato.getDataAssinatura() != null) {
            doc.paragrafo("Assinado eletronicamente por " + contrato.getAssinadoComo() + " (" + cliente.getEmail()
                    + ") em " + DATA_HORA.format(contrato.getDataAssinatura()) + ", na área do cliente do site.");
        } else {
            doc.paragrafo("O cliente assina este contrato na área do cliente do site, digitando o nome completo depois de aprovado "
                    + "pelo administrador. A data e o nome da assinatura ficam registrados no sistema.");
        }
        if (contrato.getDataAprovacao() != null) {
            doc.paragrafo("Aprovado pela administração em " + DATA_HORA.format(contrato.getDataAprovacao()) + ".");
        }

        doc.espaco(28);
        doc.linhaAssinatura(aluguel ? "Locatário(a)" : "Comprador(a)", "Imobiliária");
        doc.espaco(18);
        doc.nota("Documento gerado automaticamente para o projeto final de Web4 (IFFar Panambi). Modelo sem validade jurídica.");

        return doc.pdf();
    }

    private static String valor(String texto, String padrao) {
        return texto == null || texto.isBlank() ? padrao : texto.trim();
    }

    private static String moeda(BigDecimal valor) {
        return valor == null ? "(a combinar)" : NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(valor);
    }

    private static String endereco(ImovelModel i) {
        List<String> partes = new ArrayList<>();
        String rua = (valor(i.getEndereco(), "") + (i.getNumero() != null && !i.getNumero().isBlank() ? ", " + i.getNumero() : "")).trim();
        if (!rua.isEmpty()) partes.add(rua);
        if (i.getComplemento() != null && !i.getComplemento().isBlank()) partes.add(i.getComplemento().trim());
        if (i.getBairro() != null) {
            String cidade = valor(i.getBairro().getCidade(), "");
            String uf = valor(i.getBairro().getEstado(), "").replaceAll("^[\\s-]+", "");
            partes.add(valor(i.getBairro().getNome(), "") + (cidade.isEmpty() ? "" : ", " + cidade + (uf.isEmpty() ? "" : "/" + uf)));
        }
        if (i.getCep() != null && !i.getCep().isBlank()) partes.add("CEP " + i.getCep().trim());
        return String.join(" - ", partes.stream().filter(p -> !p.isBlank()).toList());
    }

    // ------------------------------------------------------------------
    // Montagem do PDF
    // ------------------------------------------------------------------

    /** Acumula as linhas de cada página como comandos de texto do PDF. */
    static final class Documento {
        private final List<StringBuilder> paginas = new ArrayList<>();
        private StringBuilder atual;
        private float y;

        Documento() {
            novaPagina();
        }

        private void novaPagina() {
            atual = new StringBuilder();
            paginas.add(atual);
            y = ALTURA - MARGEM;
        }

        private void garantir(float altura) {
            if (y - altura < MARGEM) novaPagina();
        }

        private void texto(String fonte, float tamanho, float x, String conteudo) {
            atual.append("BT /").append(fonte).append(' ').append(tamanho).append(" Tf ")
                 .append(x).append(' ').append(y).append(" Td (").append(escapar(conteudo)).append(") Tj ET\n");
        }

        void titulo(String t) {
            garantir(24);
            y -= 16;
            float x = Math.max(MARGEM, (LARGURA - largura(t, 15)) / 2);
            texto("F2", 15, x, t);
            y -= 10;
        }

        void subtitulo(String t) {
            garantir(16);
            y -= 12;
            float x = Math.max(MARGEM, (LARGURA - largura(t, 9)) / 2);
            texto("F1", 9, x, t);
            y -= 14;
            atual.append("0.6 w ").append(MARGEM).append(' ').append(y).append(" m ")
                 .append(LARGURA - MARGEM).append(' ').append(y).append(" l S\n");
            y -= 6;
        }

        void secao(String t) {
            garantir(30);
            y -= 18;
            texto("F2", 11, MARGEM, t);
            y -= 4;
        }

        void paragrafo(String t) {
            for (String linha : quebrar(t, 10.5f, LARGURA - 2 * MARGEM)) {
                garantir(15);
                y -= 14.5f;
                texto("F1", 10.5f, MARGEM, linha);
            }
            y -= 4;
        }

        void nota(String t) {
            for (String linha : quebrar(t, 8, LARGURA - 2 * MARGEM)) {
                garantir(11);
                y -= 11;
                texto("F1", 8, MARGEM, linha);
            }
        }

        void espaco(float altura) {
            garantir(altura);
            y -= altura;
        }

        void linhaAssinatura(String esquerda, String direita) {
            garantir(40);
            y -= 26;
            float meio = LARGURA / 2f;
            atual.append("0.6 w ")
                 .append(MARGEM).append(' ').append(y).append(" m ").append(meio - 20).append(' ').append(y).append(" l S ")
                 .append(meio + 20).append(' ').append(y).append(" m ").append(LARGURA - MARGEM).append(' ').append(y).append(" l S\n");
            y -= 13;
            texto("F1", 9, MARGEM, esquerda);
            texto("F1", 9, meio + 20, direita);
        }

        byte[] pdf() {
            ByteArrayOutputStream saida = new ByteArrayOutputStream();
            List<Integer> posicoes = new ArrayList<>();
            int totalObjetos = 4 + paginas.size() * 2;

            escrever(saida, "%PDF-1.4\n%âãÏÓ\n");

            // 1: catálogo, 2: lista de páginas, 3 e 4: fontes; depois, para cada página, a página e o conteúdo
            posicoes.add(saida.size());
            escrever(saida, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            StringBuilder kids = new StringBuilder();
            for (int i = 0; i < paginas.size(); i++) kids.append(5 + i * 2).append(" 0 R ");
            posicoes.add(saida.size());
            escrever(saida, "2 0 obj\n<< /Type /Pages /Kids [" + kids.toString().trim() + "] /Count " + paginas.size() + " >>\nendobj\n");

            posicoes.add(saida.size());
            escrever(saida, "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");
            posicoes.add(saida.size());
            escrever(saida, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");

            for (int i = 0; i < paginas.size(); i++) {
                int pagina = 5 + i * 2;
                int conteudo = pagina + 1;
                String rodape = "BT /F1 8 Tf " + (LARGURA - MARGEM - 60) + " 30 Td (Página " + (i + 1) + " de " + paginas.size() + ") Tj ET\n";
                byte[] stream = (paginas.get(i) + rodape).getBytes(StandardCharsets.ISO_8859_1);

                posicoes.add(saida.size());
                escrever(saida, pagina + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + LARGURA + " " + ALTURA
                        + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + conteudo + " 0 R >>\nendobj\n");
                posicoes.add(saida.size());
                escrever(saida, conteudo + " 0 obj\n<< /Length " + stream.length + " >>\nstream\n");
                saida.writeBytes(stream);
                escrever(saida, "\nendstream\nendobj\n");
            }

            int inicioXref = saida.size();
            StringBuilder xref = new StringBuilder("xref\n0 " + (totalObjetos + 1) + "\n0000000000 65535 f \n");
            for (int p : posicoes) xref.append(String.format("%010d 00000 n \n", p));
            escrever(saida, xref.toString());
            escrever(saida, "trailer\n<< /Size " + (totalObjetos + 1) + " /Root 1 0 R >>\nstartxref\n" + inicioXref + "\n%%EOF\n");
            return saida.toByteArray();
        }

        private static void escrever(ByteArrayOutputStream saida, String texto) {
            saida.writeBytes(texto.getBytes(StandardCharsets.ISO_8859_1));
        }
    }

    /** Troca caracteres fora do Latin-1 (aspas curvas, travessão...) e escapa \ ( ). */
    static String escapar(String texto) {
        return limpar(texto).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private static String limpar(String texto) {
        StringBuilder sb = new StringBuilder();
        for (char c : texto.toCharArray()) {
            switch (c) {
                case '‘', '’' -> sb.append('\'');
                case '“', '”' -> sb.append('"');
                case '–', '—' -> sb.append('-');
                case '…' -> sb.append("...");
                case '\n', '\r', '\t' -> sb.append(' ');
                default -> sb.append(c <= 0xFF && (c >= 0x20 && (c < 0x7F || c >= 0xA0)) ? c : '?');
            }
        }
        return sb.toString();
    }

    /** Largura aproximada do texto em Helvetica (média por tipo de caractere). */
    static float largura(String texto, float tamanho) {
        float soma = 0;
        for (char c : texto.toCharArray()) {
            if (c == ' ' || c == 'i' || c == 'l' || c == 'j' || c == '.' || c == ',' || c == '|' || c == 'I' || c == '\'') soma += 0.28f;
            else if (c == 'm' || c == 'w' || c == 'M' || c == 'W') soma += 0.85f;
            else if (Character.isUpperCase(c)) soma += 0.70f;
            else if (Character.isDigit(c)) soma += 0.56f;
            else soma += 0.52f;
        }
        return soma * tamanho;
    }

    /** Quebra o parágrafo em linhas que cabem na largura útil da página. */
    static List<String> quebrar(String texto, float tamanho, float larguraMaxima) {
        List<String> linhas = new ArrayList<>();
        StringBuilder linha = new StringBuilder();
        for (String palavra : limpar(texto).trim().split("\\s+")) {
            String tentativa = linha.length() == 0 ? palavra : linha + " " + palavra;
            if (largura(tentativa, tamanho) > larguraMaxima && linha.length() > 0) {
                linhas.add(linha.toString());
                linha = new StringBuilder(palavra);
            } else {
                linha = new StringBuilder(tentativa);
            }
        }
        if (linha.length() > 0) linhas.add(linha.toString());
        return linhas;
    }
}
