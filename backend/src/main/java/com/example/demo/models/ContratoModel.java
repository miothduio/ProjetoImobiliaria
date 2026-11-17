package com.example.demo.models;

import java.io.Serializable;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/**
 * Contrato de uma oferta aceita (tabela "contratos").
 * Uma oferta pode ter mais de um contrato ao longo do tempo (ex.: o admin recusou o
 * primeiro e o corretor preparou outro), mas só um "ativo" por vez.
 * O PDF fica numa pasta privada do servidor (app.contratos-dir), fora de /uploads.
 */
@Entity
@Table(name = "contratos")
@Getter
@Setter
@EqualsAndHashCode(of = "id")
public class ContratoModel implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "oferta_id", nullable = false)
    private OfertaModel oferta;

    /** Caminho do PDF no disco do servidor (nunca vai para o JSON). */
    @Column(name = "pdf_caminho")
    private String pdfCaminho;

    /** Nome do arquivo mostrado no download. */
    @Column(name = "pdf_nome")
    private String pdfNome;

    /** true quando o PDF foi gerado pelo sistema; false quando o corretor enviou o arquivo. */
    @Column(name = "pdf_gerado")
    private Boolean pdfGerado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusContrato status;

    @ManyToOne
    @JoinColumn(name = "preparado_por_id")
    private UserModel preparadoPor;

    @Column(name = "data_aprovacao")
    private LocalDateTime dataAprovacao;

    @Column(name = "data_assinatura")
    private LocalDateTime dataAssinatura;

    /** Nome digitado pelo cliente ao assinar. */
    @Column(name = "assinado_como")
    private String assinadoComo;

    /** Motivo informado ao recusar ou cancelar. */
    @Column(columnDefinition = "TEXT")
    private String motivo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
