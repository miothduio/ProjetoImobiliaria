package com.example.demo.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

/**
 * Como só ADMIN pode cadastrar usuários, alguém precisa existir antes.
 * Ao subir a aplicação, se não houver nenhum ADMIN no banco, cria um
 * com os dados definidos no application.properties.
 *
 * Também cria um CORRETOR e um cliente de demonstração (para o checkpoint da Aula 3),
 * a menos que app.demo.criar-usuarios=false.
 */
@Configuration
public class DataSeeder {

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.senha}")
    private String adminSenha;

    // Contas de demonstração do fluxo da Aula 3 (corretor e cliente)
    @Value("${app.demo.criar-usuarios:true}")
    private boolean criarDemo;

    @Value("${app.demo.corretor.email:corretor@imobiliaria.com}")
    private String corretorEmail;

    @Value("${app.demo.corretor.senha:corretor123}")
    private String corretorSenha;

    @Value("${app.demo.cliente.email:cliente@imobiliaria.com}")
    private String clienteEmail;

    @Value("${app.demo.cliente.senha:cliente123}")
    private String clienteSenha;

    @Bean
    CommandLineRunner criarAdminInicial(UserRepository repository, PasswordEncoder encoder) {
        return args -> {
            if (!repository.existsByTipo("ADMIN") && !repository.existsByEmail(adminEmail)) {
                UserModel admin = new UserModel();
                admin.setNome("Administrador");
                admin.setEmail(adminEmail);
                admin.setSenha(encoder.encode(adminSenha));
                admin.setTipo("ADMIN");
                repository.save(admin);
                System.out.println(">>> ADMIN inicial criado: " + adminEmail);
            }

            // Sem nenhum CORRETOR no banco, cria um para demonstrar o fluxo de ofertas e contratos
            if (criarDemo && !repository.existsByTipo("CORRETOR") && !repository.existsByEmail(corretorEmail)) {
                repository.save(novo("Carla Corretora", corretorEmail, encoder.encode(corretorSenha), "CORRETOR"));
                System.out.println(">>> CORRETOR de demonstração criado: " + corretorEmail + " / " + corretorSenha);
            }
            // Cliente de demonstração (o nome dele é o que se digita para assinar o contrato)
            if (criarDemo && !repository.existsByEmail(clienteEmail)) {
                repository.save(novo("Cliente Demonstração", clienteEmail, encoder.encode(clienteSenha), "USER"));
                System.out.println(">>> Cliente de demonstração criado: " + clienteEmail + " / " + clienteSenha);
            }
        };
    }

    private static UserModel novo(String nome, String email, String senhaCriptografada, String tipo) {
        UserModel u = new UserModel();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenha(senhaCriptografada);
        u.setTipo(tipo);
        return u;
    }
}
