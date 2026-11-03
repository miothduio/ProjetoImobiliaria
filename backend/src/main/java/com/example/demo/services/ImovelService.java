package com.example.demo.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
