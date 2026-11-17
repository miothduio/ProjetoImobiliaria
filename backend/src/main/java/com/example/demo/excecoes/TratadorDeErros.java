package com.example.demo.excecoes;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Converte as exceções das regras de negócio em respostas JSON no mesmo formato
 * dos erros de segurança: { "status": 409, "erro": "Conflict", "mensagem": "..." }.
 * O front mostra só a "mensagem" (nunca o JSON).
 *
 * Só trata as exceções do próprio sistema: os demais erros continuam com o
 * comportamento padrão do Spring (ex.: /imoveis/abc segue respondendo 400).
 */
@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> regra(RegraNegocioException e) {
        return corpo(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(NaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> naoEncontrado(NaoEncontradoException e) {
        return corpo(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<Map<String, Object>> acessoNegado(AcessoNegadoException e) {
        return corpo(HttpStatus.FORBIDDEN, e.getMessage());
    }

    @ExceptionHandler(DadosInvalidosException.class)
    public ResponseEntity<Map<String, Object>> dadosInvalidos(DadosInvalidosException e) {
        return corpo(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> arquivoGrande(MaxUploadSizeExceededException e) {
        return corpo(HttpStatus.CONTENT_TOO_LARGE, "Arquivo grande demais. O limite é 10 MB.");
    }

    public static ResponseEntity<Map<String, Object>> corpo(HttpStatus status, String mensagem) {
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("status", status.value());
        json.put("erro", status.getReasonPhrase());
        json.put("mensagem", mensagem);
        return ResponseEntity.status(status).body(json);
    }
}
