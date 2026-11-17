package com.example.demo.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.PainelDTO;
import com.example.demo.dtos.PainelDTO.Contagem;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.StatusContrato;
import com.example.demo.models.StatusOferta;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

/**
 * Números do painel do administrador.
 * As contagens de imóveis são feitas em memória pelo mesmo motivo da busca da vitrine:
 * os dados antigos misturam formatos ("Disponível"/"DISPONIVEL", "Residencial"/"VENDA").
 */
@Service
public class PainelService {

    private final ImovelRepository imovelRepository;
    private final OfertaRepository ofertaRepository;
    private final ContratoRepository contratoRepository;

    public PainelService(ImovelRepository imovelRepository, OfertaRepository ofertaRepository,
                         ContratoRepository contratoRepository) {
        this.imovelRepository = imovelRepository;
        this.ofertaRepository = ofertaRepository;
        this.contratoRepository = contratoRepository;
    }

    @Transactional(readOnly = true)
    public PainelDTO montar() {
        List<ImovelModel> imoveis = imovelRepository.findAll();

        PainelDTO.Totais totais = new PainelDTO.Totais(
                imoveis.size(),
                imoveis.stream().filter(ImovelService::estaDisponivel).count(),
                ofertaRepository.countByStatus(StatusOferta.PENDENTE),
                contratoRepository.countByStatus(StatusContrato.AGUARDANDO_APROVACAO),
                contratoRepository.countByStatus(StatusContrato.AGUARDANDO_ASSINATURA),
                contratoRepository.countByStatus(StatusContrato.ASSINADO));

        // ofertas: todas as situações, mesmo as zeradas, sempre na mesma ordem
        List<Contagem> ofertas = new ArrayList<>();
        for (StatusOferta s : StatusOferta.values()) {
            String rotulo = OfertaService.rotulo(s);
            ofertas.add(new Contagem(s.name(), Character.toUpperCase(rotulo.charAt(0)) + rotulo.substring(1),
                    ofertaRepository.countByStatus(s)));
        }

        List<Contagem> porBairro = agrupar(imoveis,
                i -> i.getBairro() != null && i.getBairro().getNome() != null ? i.getBairro().getNome().trim() : "Sem bairro");
        porBairro.sort(Comparator.comparingLong(Contagem::total).reversed().thenComparing(Contagem::rotulo));

        List<Contagem> porFinalidade = agrupar(imoveis, PainelService::finalidade);
        porFinalidade.sort(Comparator.comparingLong(Contagem::total).reversed());

        List<Contagem> porStatus = agrupar(imoveis, i -> {
            String s = ImovelService.normalizar(i.getStatus());
            return s.isEmpty() ? "SEM SITUAÇÃO" : s;
        });
        porStatus.sort(Comparator.comparingLong(Contagem::total).reversed());

        return new PainelDTO(totais, porBairro, ofertas, porFinalidade, porStatus);
    }

    /** VENDA, ALUGUEL, ou "Venda e aluguel" para os cadastros antigos com os dois preços. */
    private static String finalidade(ImovelModel i) {
        boolean venda = ImovelService.oferecePara(i, "VENDA");
        boolean aluguel = ImovelService.oferecePara(i, "ALUGUEL");
        if (venda && aluguel) return "Venda e aluguel";
        if (venda) return "Venda";
        if (aluguel) return "Aluguel";
        return "Sem finalidade";
    }

    private static List<Contagem> agrupar(List<ImovelModel> imoveis, Function<ImovelModel, String> chave) {
        Map<String, Long> contagem = new LinkedHashMap<>();
        for (ImovelModel i : imoveis) {
            contagem.merge(chave.apply(i), 1L, Long::sum);
        }
        List<Contagem> lista = new ArrayList<>();
        contagem.forEach((k, v) -> lista.add(new Contagem(k, rotular(k), v)));
        return lista;
    }

    private static String rotular(String chave) {
        if (chave.equals("DISPONIVEL")) return "Disponível";
        if (chave.equals(chave.toUpperCase()) && chave.length() > 1) {
            String minusculo = chave.toLowerCase().replace('_', ' ');
            return Character.toUpperCase(minusculo.charAt(0)) + minusculo.substring(1);
        }
        return chave;
    }
}
