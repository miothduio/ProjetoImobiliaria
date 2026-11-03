package com.example.demo.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.services.EmailService;

@RestController 
@RequestMapping ("/email")
public class EnviarEmailController {
    
    @Autowired 
    private EmailService service;

    @GetMapping 
    public ResponseEntity<String> enviar() {
        try{
            //service.enviarEmailTexto("ederson.bastiani@iffarroupilha.edu.br", "Teste", "Olá, este é um teste!");
            
            service.enviarEmailComTemplate(
            "diullian.2021316871@aluno.iffar.edu.br",
            "Bem-vindo!",
            "email/template",  
            Map.of(
                "nome", "Diullian",
                "itens", List.of("Plano Pro", "Suporte 24h"),
                "link", "https://meusite.com"
            ));
            
         return ResponseEntity.ok("Enviado");
        }
        catch(Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
   
    }


}
