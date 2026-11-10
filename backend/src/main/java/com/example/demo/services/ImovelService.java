package com.example.demo.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.PaginaDTO;
import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;

@Service
public class ImovelService {
    private final ImovelRepository repository;
    private final FotoImovelRepository fotoRepository;

    public ImovelService(ImovelRepository repository, FotoImovelRepository fotoRepository) {
        this.repository = repository;
        this.fotoRepository = fotoRepository;
    }

    public List<ImovelModel> getAll() {
        List<ImovelModel> list = repository.findAll();
        return list;
    }

    public ImovelModel find(Integer id) {
        Optional<ImovelModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public ImovelModel insert(ImovelModel model) {
        return repository.save(model);
    }

    public ImovelModel update(ImovelModel model) {
        try {
            if (find(model.getId()) != null) {
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Remove o imóvel. Antes apaga as fotos dele (registros e arquivos),
     * senão o banco bloqueia a exclusão por causa da chave estrangeira
     * fotos_imoveis.imovel_id.
     */
    @Transactional
    public void delete(Integer id) {
        List<FotoImovelModel> fotos = fotoRepository.findByImovelIdOrderByOrdemAscIdAsc(id);
        for (FotoImovelModel foto : fotos) {
            try {
                if (foto.getCaminho() != null) {
                    Files.deleteIfExists(Paths.get(foto.getCaminho()));
                }
            } catch (IOException e) {
                System.out.println("Não foi possível apagar o arquivo: " + foto.getCaminho());
            }
        }
        fotoRepository.deleteAll(fotos);
        repository.deleteById(id);
    }

    /** Altera apenas o status do imóvel. Retorna null se o imóvel não existir. */
    public ImovelModel alterarStatus(Integer id, String status) {
        ImovelModel model = find(id);
        if (model == null) {
            return null;
        }
        model.setStatus(status);
        return repository.save(model);
    }

    // ---------- Busca da vitrine: filtros, ordenação e paginação ----------

    /** Tamanho máximo de página aceito, para ninguém pedir a tabela inteira de uma vez. */
    public static final int TAMANHO_MAXIMO = 50;

    /**
     * Busca da vitrine. Todos os filtros são opcionais e se combinam (E).
     *
     * O filtro é feito em memória, e não numa query, porque os dados atuais misturam
     * formatos ("Disponível" e "DISPONIVEL", "Residencial" e "VENDA") e o valor
     * comparado depende da finalidade (aluguel ou venda). Para o volume de uma
     * imobiliária pequena isso é suficiente; com milhares de imóveis o próximo passo
     * seria padronizar os dados e trocar por uma Specification do JPA.
     *
     * @param bairroId          id do bairro
     * @param finalidade        VENDA ou ALUGUEL (sem diferenciar maiúsculas/acentos)
     * @param precoMin          valor mínimo (inclusive)
     * @param precoMax          valor máximo (inclusive)
     * @param ordem             preco_asc, preco_desc ou recentes (padrão)
     * @param apenasDisponiveis true = só status DISPONIVEL
     * @param pagina            começa em 0
     * @param tamanho           itens por página (1 a 50)
     */
    @Transactional(readOnly = true)
    public PaginaDTO<ImovelModel> buscar(Integer bairroId, String finalidade,
                                        BigDecimal precoMin, BigDecimal precoMax,
                                        String ordem, boolean apenasDisponiveis,
                                        int pagina, int tamanho) {

        String fin = normalizar(finalidade);
        if (!fin.isEmpty() && !fin.equals("VENDA") && !fin.equals("ALUGUEL")) {
            throw new IllegalArgumentException("Finalidade inválida. Use VENDA ou ALUGUEL.");
        }
        if ((precoMin != null && precoMin.signum() < 0) || (precoMax != null && precoMax.signum() < 0)) {
            throw new IllegalArgumentException("Os valores não podem ser negativos.");
        }
        if (precoMin != null && precoMax != null && precoMin.compareTo(precoMax) > 0) {
            throw new IllegalArgumentException("O valor mínimo não pode ser maior que o máximo.");
        }

        int tam = Math.max(1, Math.min(tamanho, TAMANHO_MAXIMO));
        int pag = Math.max(0, pagina);

        List<ImovelModel> filtrados = repository.findAll().stream()
                .filter(i -> !apenasDisponiveis || "DISPONIVEL".equals(normalizar(i.getStatus())))
                .filter(i -> bairroId == null || (i.getBairro() != null && bairroId.equals(i.getBairro().getId())))
                .filter(i -> fin.isEmpty() || oferecePara(i, fin))
                .filter(i -> {
                    if (precoMin == null && precoMax == null) return true;
                    BigDecimal valor = valorDeReferencia(i, fin);
                    if (valor == null) return false;   // "sob consulta" não entra em faixa de preço
                    if (precoMin != null && valor.compareTo(precoMin) < 0) return false;
                    return precoMax == null || valor.compareTo(precoMax) <= 0;
                })
                .sorted(comparador(ordem, fin))
                .toList();

        long total = filtrados.size();
        int totalPaginas = (int) Math.ceil(total / (double) tam);
        int inicio = (int) Math.min((long) pag * tam, total);
        int fim = (int) Math.min((long) inicio + tam, total);

        List<ImovelModel> conteudo = filtrados.subList(inicio, fim);
        conteudo.forEach(this::preencherCapa);

        return new PaginaDTO<>(conteudo, pag, tam, total, totalPaginas);
    }

    /** Coloca em capaUrl a foto marcada como capa (ou a primeira da ordem). */
    private void preencherCapa(ImovelModel imovel) {
        List<FotoImovelModel> fotos = fotoRepository.findByImovelIdOrderByOrdemAscIdAsc(imovel.getId());
        fotos.stream()
                .filter(f -> Boolean.TRUE.equals(f.getCapa()))
                .findFirst()
                .or(() -> fotos.stream().findFirst())
                .ifPresent(f -> imovel.setCapaUrl(f.getUrl()));
    }

    /**
     * O imóvel serve para essa finalidade?
     * VENDA/ALUGUEL explícitos valem como estão; outros valores (ex.: "Residencial")
     * contam para a finalidade cujo preço estiver preenchido.
     */
    private static boolean oferecePara(ImovelModel i, String finalidade) {
        String propria = normalizar(i.getFinalidade());
        if (propria.equals("VENDA") || propria.equals("ALUGUEL")) {
            return propria.equals(finalidade);
        }
        return finalidade.equals("VENDA") ? i.getPrecoVenda() != null : i.getPrecoAluguel() != null;
    }

    /**
     * Valor usado na faixa de preço e na ordenação.
     * Com filtro de finalidade: o preço daquela finalidade.
     * Sem filtro: o mesmo valor que o card mostra (aluguel se for ALUGUEL, senão venda, senão aluguel).
     */
    private static BigDecimal valorDeReferencia(ImovelModel i, String finalidade) {
        if (finalidade.equals("VENDA")) return i.getPrecoVenda();
        if (finalidade.equals("ALUGUEL")) return i.getPrecoAluguel();
        if (normalizar(i.getFinalidade()).equals("ALUGUEL") && i.getPrecoAluguel() != null) {
            return i.getPrecoAluguel();
        }
        return i.getPrecoVenda() != null ? i.getPrecoVenda() : i.getPrecoAluguel();
    }

    private static Comparator<ImovelModel> comparador(String ordem, String finalidade) {
        Comparator<ImovelModel> recentes = Comparator.comparing(
                ImovelModel::getId, Comparator.nullsLast(Comparator.reverseOrder()));

        Comparator<ImovelModel> porPreco = Comparator.comparing(
                (ImovelModel i) -> valorDeReferencia(i, finalidade), Comparator.nullsLast(Comparator.naturalOrder()));

        return switch (normalizar(ordem)) {
            case "PRECO_ASC" -> porPreco.thenComparing(recentes);
            // reversed() levaria os "sob consulta" (null) para o topo; mantém no fim
            case "PRECO_DESC" -> Comparator.comparing(
                    (ImovelModel i) -> valorDeReferencia(i, finalidade),
                    Comparator.nullsLast(Comparator.<BigDecimal>reverseOrder())).thenComparing(recentes);
            default -> recentes;
        };
    }

    /** "Disponível " -> "DISPONIVEL"; null -> "". */
    private static String normalizar(String texto) {
        if (texto == null) return "";
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase();
    }
}
