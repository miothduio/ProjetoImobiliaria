package com.example.demo.services;

import org.springframework.stereotype.Component;

import com.example.demo.dtos.ContratoDTO;
import com.example.demo.dtos.ImovelResumoDTO;
import com.example.demo.dtos.OfertaDTO;
import com.example.demo.dtos.PessoaDTO;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;

/**
 * Monta os DTOs de resposta. Os models nunca vão direto para o JSON:
 * o UserModel tem a senha (hash) e o contrato tem o caminho do arquivo no servidor.
 */
@Component
public class Conversor {

    private final ImovelService imovelService;
    private final ContratoRepository contratoRepository;

    public Conversor(ImovelService imovelService, ContratoRepository contratoRepository) {
        this.imovelService = imovelService;
        this.contratoRepository = contratoRepository;
    }

    public ImovelResumoDTO imovel(ImovelModel i) {
        if (i == null) return null;
        return new ImovelResumoDTO(
                i.getId(),
                i.getTitulo(),
                i.getStatus(),
                i.getFinalidade(),
                i.getPrecoVenda(),
                i.getPrecoAluguel(),
                i.getTipoImovel() != null ? i.getTipoImovel().getNome() : null,
                i.getBairro() != null ? i.getBairro().getNome() : null,
                i.getBairro() != null ? i.getBairro().getCidade() : null,
                imovelService.urlDaCapa(i.getId()));
    }

    public PessoaDTO pessoa(UserModel u) {
        return u == null ? null : new PessoaDTO(u.getId(), u.getNome(), u.getEmail());
    }

    public OfertaDTO oferta(OfertaModel o) {
        OfertaDTO.ContratoResumoDTO contrato = contratoRepository.findFirstByOfertaIdOrderByIdDesc(o.getId())
                .map(c -> new OfertaDTO.ContratoResumoDTO(c.getId(), c.getStatus().name()))
                .orElse(null);
        return new OfertaDTO(
                o.getId(),
                o.getTipo(),
                o.getValor(),
                o.getMensagem(),
                o.getStatus().name(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                imovel(o.getImovel()),
                pessoa(o.getUsuario()),
                contrato);
    }

    public ContratoDTO contrato(ContratoModel c) {
        OfertaModel o = c.getOferta();
        return new ContratoDTO(
                c.getId(),
                c.getStatus().name(),
                c.getCreatedAt(),
                c.getDataAprovacao(),
                c.getDataAssinatura(),
                c.getAssinadoComo(),
                c.getMotivo(),
                c.getPdfNome(),
                c.getPdfGerado(),
                pessoa(c.getPreparadoPor()),
                new ContratoDTO.OfertaDoContratoDTO(o.getId(), o.getTipo(), o.getValor(), o.getStatus().name()),
                imovel(o.getImovel()),
                pessoa(o.getUsuario()));
    }
}
