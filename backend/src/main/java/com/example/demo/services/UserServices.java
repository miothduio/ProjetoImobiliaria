package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Service 
public class UserServices {
    @Autowired 
    private UserRepository repository;

    public List<UserModel> getAllUsers() {
        List<UserModel>lista = repository.findAll();
        return lista;
    }

    public UserModel find(Integer id){
        Optional<UserModel> user = repository.findById(id);
        return user.orElse(null);
    }

    public UserModel insert(UserModel user){
        return repository.save(user);
    }
    
    public UserModel insert(UserDTO dto) {
        UserModel model = new UserModel();
        model.setNome(dto.getNome());
        model.setEmail(dto.getEmail());
        model.setTipo(dto.getTipo());
        return repository.save(model);
    }

    public UserModel update(UserModel user) {
    try {
        UserModel usuario = repository.findById(user.getId()).orElse(null);

        if (usuario == null) {
            return null;
        }


        usuario.setNome(user.getNome());
        usuario.setEmail(user.getEmail());
        usuario.setSenha(user.getSenha());
        usuario.setTipo(user.getTipo());

        return repository.save(usuario);

    } catch (Exception e) {
        return null;
    }
}
    public UserModel update(UserDTO dto) {
        UserModel model = find(dto.getId());
        try {
            if (model != null) {
                model.setNome(dto.getNome());
                model.setEmail(dto.getEmail());
                model.setTipo(dto.getTipo());
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public void delete(Integer id){
        repository.deleteById(id);
    }
   }
