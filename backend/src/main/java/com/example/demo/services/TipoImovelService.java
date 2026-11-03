package com.example.demo.services;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.demo.models.TipoImovelModel;
import com.example.demo.repositories.TipoImovelRepository;

@Service
public class TipoImovelService {
    private final TipoImovelRepository repository;

    public TipoImovelService(TipoImovelRepository repository) {
        this.repository = repository;
    }

    public List<TipoImovelModel> findAll() {
        return repository.findAll();
    }

    public Page<TipoImovelModel> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public TipoImovelModel findById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    public TipoImovelModel save(TipoImovelModel model) {
        return repository.save(model);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }
}
