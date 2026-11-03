package com.example.demo.dtos;

import com.example.demo.models.UserModel;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {
    private Integer id;
    private String nome;
    private String email;

    // Senha: só é RECEBIDA no JSON (cadastro/alteração), nunca é devolvida nas respostas.
    // Aceita tanto "senha" quanto "password".
    @JsonAlias("password")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    // Perfil do usuário: ADMIN ou USER. Aceita tanto "tipo" quanto "role".
    @JsonAlias("role")
    private String tipo;

    public UserDTO() {
    }

    public UserDTO(UserModel userModel) {
        this.id = userModel.getId();
        this.nome = userModel.getNome();
        this.email = userModel.getEmail();
        this.tipo = userModel.getTipo();
    }

    public UserDTO(Integer id, String nome, String email, String tipo) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.tipo = tipo;
    }

}
