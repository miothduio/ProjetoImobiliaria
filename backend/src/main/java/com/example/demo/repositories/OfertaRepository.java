package com.example.demo.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.OfertaModel;
import com.example.demo.models.StatusOferta;

public interface OfertaRepository extends JpaRepository<OfertaModel, Integer> {

    List<OfertaModel> findByImovelIdAndStatusIn(Integer imovelId, Collection<StatusOferta> status);

    boolean existsByImovelIdAndUsuarioIdAndStatusIn(Integer imovelId, Integer usuarioId, Collection<StatusOferta> status);

    List<OfertaModel> findByImovelId(Integer imovelId);

    List<OfertaModel> findByUsuarioId(Integer usuarioId);

    long countByStatus(StatusOferta status);

    // listagens paginadas (filtros opcionais combinados no service)
    Page<OfertaModel> findByUsuarioId(Integer usuarioId, Pageable pageable);

    Page<OfertaModel> findByUsuarioIdAndStatus(Integer usuarioId, StatusOferta status, Pageable pageable);

    Page<OfertaModel> findByUsuarioIdAndImovelId(Integer usuarioId, Integer imovelId, Pageable pageable);

    Page<OfertaModel> findByStatus(StatusOferta status, Pageable pageable);

    Page<OfertaModel> findByImovelId(Integer imovelId, Pageable pageable);

    Page<OfertaModel> findByImovelIdAndStatus(Integer imovelId, StatusOferta status, Pageable pageable);
}
