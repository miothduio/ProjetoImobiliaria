package com.example.demo.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.PainelDTO;
import com.example.demo.services.PainelService;

/** GET /painel (ADMIN e CORRETOR): totais e dados dos gráficos do painel. */
@RestController
public class PainelController {

    private final PainelService service;

    public PainelController(PainelService service) {
        this.service = service;
    }

    @GetMapping("/painel")
    public PainelDTO painel() {
        return service.montar();
    }
}
