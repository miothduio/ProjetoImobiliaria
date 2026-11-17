package com.example.demo.models;

import java.io.Serializable;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

/** Imóvel guardado por um cliente (tabela "favoritos"). Um mesmo imóvel só entra uma vez por usuário. */
@Entity
@Table(name = "favoritos",
       uniqueConstraints = @UniqueConstraint(name = "uk_favorito_usuario_imovel", columnNames = {"usuario_id", "imovel_id"}))
@Getter
@Setter
@EqualsAndHashCode(of = "id")
public class FavoritoModel implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    @ManyToOne
    @JoinColumn(name = "imovel_id", nullable = false)
    private ImovelModel imovel;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
