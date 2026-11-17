package com.example.demo.services;

import java.util.EnumSet;
import java.util.List;

import org.springframework.stereotype.Component;

import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.StatusOferta;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

/**
 * As três mudanças de situação do imóvel que as regras de negócio pedem.
 * Fica separado para ofertas, contratos e exclusões usarem exatamente a mesma regra.
 *
 *  reservar -> oferta aceita: imóvel RESERVADO e as outras pendentes vão para EM_ESPERA
 *  concluir -> contrato assinado: imóvel ALUGADO/VENDIDO e as outras ofertas são RECUSADAS
 *  liberar  -> contrato cancelado (cliente desistiu): imóvel DISPONÍVEL e quem estava EM_ESPERA volta a PENDENTE
 */
@Component
public class FluxoDoImovel {

    private final ImovelRepository imovelRepository;
    private final OfertaRepository ofertaRepository;

    public FluxoDoImovel(ImovelRepository imovelRepository, OfertaRepository ofertaRepository) {
        this.imovelRepository = imovelRepository;
        this.ofertaRepository = ofertaRepository;
    }

    public void reservar(OfertaModel aceita) {
        ImovelModel imovel = aceita.getImovel();
        imovel.setStatus(ImovelService.STATUS_RESERVADO);
        imovelRepository.save(imovel);

        List<OfertaModel> outras = ofertaRepository.findByImovelIdAndStatusIn(imovel.getId(),
                EnumSet.of(StatusOferta.PENDENTE));
        for (OfertaModel o : outras) {
            if (!o.getId().equals(aceita.getId())) {
                o.setStatus(StatusOferta.EM_ESPERA);
            }
        }
        ofertaRepository.saveAll(outras);
    }

    public void concluir(OfertaModel assinada) {
        ImovelModel imovel = assinada.getImovel();
        imovel.setStatus("ALUGUEL".equals(assinada.getTipo())
                ? ImovelService.STATUS_ALUGADO
                : ImovelService.STATUS_VENDIDO);
        imovelRepository.save(imovel);

        List<OfertaModel> outras = ofertaRepository.findByImovelIdAndStatusIn(imovel.getId(),
                EnumSet.of(StatusOferta.PENDENTE, StatusOferta.EM_ESPERA));
        for (OfertaModel o : outras) {
            if (!o.getId().equals(assinada.getId())) {
                o.setStatus(StatusOferta.RECUSADA);
            }
        }
        ofertaRepository.saveAll(outras);
    }

    public void liberar(ImovelModel imovel) {
        imovel.setStatus(ImovelService.STATUS_DISPONIVEL);
        imovelRepository.save(imovel);

        List<OfertaModel> esperando = ofertaRepository.findByImovelIdAndStatusIn(imovel.getId(),
                EnumSet.of(StatusOferta.EM_ESPERA));
        esperando.forEach(o -> o.setStatus(StatusOferta.PENDENTE));
        ofertaRepository.saveAll(esperando);
    }
}
