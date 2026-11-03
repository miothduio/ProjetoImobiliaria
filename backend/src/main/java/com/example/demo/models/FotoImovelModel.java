package com.example.demo.models;

import java.io.Serializable;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

@Entity 
@Table (name="fotos_imoveis")
@Getter 
@Setter 

public class FotoImovelModel implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nomeArquivo;
    private String caminho;
    private Boolean capa;
    private Integer ordem;

    @ManyToOne
    @JoinColumn (name="imovel_id", nullable = false)
    private ImovelModel imovel;

    /** Endereço público da imagem (servido pelo WebConfig). Vai no JSON como "url". */
    @Transient
    public String getUrl() {
        if (imovel == null || imovel.getId() == null || nomeArquivo == null) {
            return null;
        }
        return "/uploads/" + imovel.getId() + "/" + nomeArquivo;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((id == null) ? 0 : id.hashCode());
        return result;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        FotoImovelModel other = (FotoImovelModel) obj;
        if (id == null) {
            if (other.id != null)
                return false;
        } else if (!id.equals(other.id))
            return false;
        return true;
    }
}


