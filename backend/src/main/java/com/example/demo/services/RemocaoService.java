package com.example.demo.services;

import java.util.EnumSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.models.ContratoModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.StatusContrato;
import com.example.demo.models.StatusOferta;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.OfertaRepository;

/**
 * Apaga o que depende de um imóvel ou de um usuário antes de excluí-lo
 * (senão as chaves estrangeiras de ofertas, contratos e favoritos bloqueiam o DELETE).
 * A tela do admin avisa, na confirmação, que ofertas e contratos também serão apagados.
 */
@Service
public class RemocaoService {

    private final OfertaRepository ofertaRepository;
    private final ContratoRepository contratoRepository;
    private final FavoritoRepository favoritoRepository;
    private final FluxoDoImovel fluxo;
    private final ArquivosDeContrato arquivos;

    public RemocaoService(OfertaRepository ofertaRepository, ContratoRepository contratoRepository,
                          FavoritoRepository favoritoRepository, FluxoDoImovel fluxo, ArquivosDeContrato arquivos) {
        this.ofertaRepository = ofertaRepository;
        this.contratoRepository = contratoRepository;
        this.favoritoRepository = favoritoRepository;
        this.fluxo = fluxo;
        this.arquivos = arquivos;
    }

    @Transactional
    public void dependenciasDoImovel(Integer imovelId) {
        favoritoRepository.deleteAll(favoritoRepository.findByImovelId(imovelId));
        apagarOfertas(ofertaRepository.findByImovelId(imovelId));
    }

    /**
     * Ao excluir um cliente com oferta aceita (e contrato ainda não assinado),
     * o imóvel não pode ficar reservado para sempre: volta a ficar disponível.
     */
    @Transactional
    public void dependenciasDoUsuario(Integer usuarioId) {
        favoritoRepository.deleteAll(favoritoRepository.findByUsuarioId(usuarioId));

        // corretor/admin excluído: os contratos que ele preparou ficam, só sem o nome dele
        List<ContratoModel> preparados = contratoRepository.findByPreparadoPorId(usuarioId);
        preparados.forEach(c -> c.setPreparadoPor(null));
        contratoRepository.saveAll(preparados);

        List<OfertaModel> ofertas = ofertaRepository.findByUsuarioId(usuarioId);
        for (OfertaModel o : ofertas) {
            boolean assinada = contratoRepository.existsByOfertaIdAndStatusIn(o.getId(),
                    EnumSet.of(StatusContrato.ASSINADO));
            if (o.getStatus() == StatusOferta.ACEITA && !assinada) {
                fluxo.liberar(o.getImovel());
            }
        }
        apagarOfertas(ofertas);
    }

    private void apagarOfertas(List<OfertaModel> ofertas) {
        for (OfertaModel o : ofertas) {
            List<ContratoModel> contratos = contratoRepository.findByOfertaId(o.getId());
            contratos.forEach(c -> arquivos.apagar(c.getPdfCaminho()));
            contratoRepository.deleteAll(contratos);
        }
        ofertaRepository.deleteAll(ofertas);
    }
}
