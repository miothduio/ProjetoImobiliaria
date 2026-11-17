package com.example.demo.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.ContratoModel;
import com.example.demo.models.StatusContrato;

public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {

    List<ContratoModel> findByOfertaId(Integer ofertaId);

    /** Contrato mais recente da oferta (o que aparece na lista de ofertas). */
    Optional<ContratoModel> findFirstByOfertaIdOrderByIdDesc(Integer ofertaId);

    boolean existsByOfertaIdAndStatusIn(Integer ofertaId, Collection<StatusContrato> status);

    long countByStatus(StatusContrato status);

    List<ContratoModel> findByPreparadoPorId(Integer usuarioId);

    Page<ContratoModel> findByStatus(StatusContrato status, Pageable pageable);

    Page<ContratoModel> findByOfertaUsuarioId(Integer usuarioId, Pageable pageable);

    Page<ContratoModel> findByOfertaUsuarioIdAndStatus(Integer usuarioId, StatusContrato status, Pageable pageable);
}
