package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.ImovelResumoDTO;
import com.example.demo.excecoes.AcessoNegadoException;
import com.example.demo.excecoes.NaoEncontradoException;
import com.example.demo.models.FavoritoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;

/**
 * Favoritos do cliente. Adicionar e remover são idempotentes:
 * favoritar duas vezes não duplica, e remover o que não está na lista não dá erro.
 */
@Service
public class FavoritoService {

    private final FavoritoRepository repository;
    private final ImovelRepository imovelRepository;
    private final Conversor conversor;

    public FavoritoService(FavoritoRepository repository, ImovelRepository imovelRepository, Conversor conversor) {
        this.repository = repository;
        this.imovelRepository = imovelRepository;
        this.conversor = conversor;
    }

    @Transactional(readOnly = true)
    public List<ImovelResumoDTO> listar(UserModel cliente) {
        exigirCliente(cliente);
        return repository.findByUsuarioIdOrderByIdDesc(cliente.getId()).stream()
                .map(f -> conversor.imovel(f.getImovel()))
                .toList();
    }

    /** Só os ids: o front usa para marcar a estrelinha na vitrine sem baixar tudo. */
    @Transactional(readOnly = true)
    public List<Integer> ids(UserModel cliente) {
        exigirCliente(cliente);
        return repository.findByUsuarioIdOrderByIdDesc(cliente.getId()).stream()
                .map(f -> f.getImovel().getId())
                .toList();
    }

    /** @return true se foi adicionado agora; false se já estava nos favoritos */
    @Transactional
    public boolean adicionar(UserModel cliente, Integer imovelId) {
        exigirCliente(cliente);
        ImovelModel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> new NaoEncontradoException("Imóvel não encontrado."));
        if (repository.findByUsuarioIdAndImovelId(cliente.getId(), imovelId).isPresent()) {
            return false;
        }
        FavoritoModel favorito = new FavoritoModel();
        favorito.setUsuario(cliente);
        favorito.setImovel(imovel);
        repository.save(favorito);
        return true;
    }

    @Transactional
    public void remover(UserModel cliente, Integer imovelId) {
        exigirCliente(cliente);
        repository.findByUsuarioIdAndImovelId(cliente.getId(), imovelId).ifPresent(repository::delete);
    }

    private static void exigirCliente(UserModel u) {
        if (!Perfis.ehCliente(u)) {
            throw new AcessoNegadoException("Favoritos são da área do cliente.");
        }
    }
}
