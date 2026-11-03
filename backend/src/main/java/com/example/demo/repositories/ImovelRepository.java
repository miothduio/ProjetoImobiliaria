package com.example.demo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.ImovelModel;

public interface  ImovelRepository extends JpaRepository<ImovelModel, Integer>{
    
}