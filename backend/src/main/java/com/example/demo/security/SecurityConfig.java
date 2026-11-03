package com.example.demo.security;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Regras de acesso (atividade 4):
 *
 * | Ação                                  | Quem acessa                 | Token? |
 * |---------------------------------------|-----------------------------|--------|
 * | Login                                 | Todos                       | Não    |
 * | Listar imóveis / um imóvel            | Todos                       | Não    |
 * | Cadastrar, alterar e remover imóveis  | ADMIN                       | Sim    |
 * | Cadastrar e gerenciar usuários        | ADMIN                       | Sim    |
 * | Alterar status de imóvel              | Qualquer usuário autenticado| Sim    |
 *
 * 401 -> rota protegida sem token, ou token inválido/expirado
 * 403 -> token válido, mas o perfil não tem permissão (ex.: USER cadastrando imóvel)
 *
 * IMPORTANTE: o Spring usa a PRIMEIRA regra que casar, então as mais específicas vêm antes.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            // CORS: libera o front (React + Vite) a chamar a API a partir de outra porta
            .cors(Customizer.withDefaults())
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            // API stateless: nenhuma sessão no servidor, cada requisição traz o próprio token
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/error").permitAll()

                // Preflight do CORS (o navegador manda OPTIONS antes de PUT/PATCH/DELETE)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Arquivos das fotos (para o front exibir as imagens com <img src>)
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                // Registro e login -> todos, sem token (como nos exemplos da atividade)
                .requestMatchers(HttpMethod.POST, "/public/register", "/public/login").permitAll()

                // Listar imóveis / um imóvel -> todos, sem token
                .requestMatchers(HttpMethod.GET, "/imoveis", "/imoveis/*").permitAll()
                // Formulário "saber mais" do site -> visitante, sem token
                .requestMatchers(HttpMethod.POST, "/imoveis/sabermais/*").permitAll()

                // Alterar status de imóvel -> qualquer usuário autenticado
                // (precisa vir ANTES da regra de ADMIN de /imoveis/**)
                .requestMatchers(HttpMethod.PATCH, "/imoveis/*/status").authenticated()

                // Cadastrar, alterar e remover imóveis -> ADMIN
                .requestMatchers("/imoveis/**").hasRole("ADMIN")

                // Cadastrar e gerenciar usuários -> ADMIN
                .requestMatchers("/users/**").hasRole("ADMIN")

                // Dados auxiliares do imóvel: consulta pública, alteração só ADMIN
                .requestMatchers(HttpMethod.GET, "/bairros/**", "/tipos-imoveis/**", "/fotos/**").permitAll()
                .requestMatchers("/bairros/**", "/tipos-imoveis/**", "/fotos/**").hasRole("ADMIN")

                // Rota de teste de e-mail -> ADMIN
                .requestMatchers("/email/**").hasRole("ADMIN")

                // Qualquer outra rota exige estar logado
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // 401 Unauthorized: sem token, token inválido ou expirado
                .authenticationEntryPoint((request, response, e) -> {
                    Object motivo = request.getAttribute(SecurityFilter.ATRIBUTO_ERRO);
                    String mensagem = motivo != null ? motivo.toString() : "Token não informado";
                    escreverErro(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", mensagem);
                })
                // 403 Forbidden: token válido, mas sem permissão
                .accessDeniedHandler((request, response, e) ->
                    escreverErro(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                            "Você não tem permissão para acessar este recurso"))
            )
            .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    private static void escreverErro(HttpServletResponse response, int status,
                                     String erro, String mensagem) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"status\":" + status + ",\"erro\":\"" + erro + "\",\"mensagem\":\"" + mensagem + "\"}");
    }

    /**
     * Origens que podem chamar a API pelo navegador.
     * Padrão: o servidor de desenvolvimento do Vite (http://localhost:5173).
     * Para liberar outras, defina app.cors.origens separando por vírgula.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.origens:http://localhost:5173,http://127.0.0.1:5173}") String[] origens) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(origens));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setExposedHeaders(List.of("Location"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
