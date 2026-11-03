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
 */
@Configuration
public class DataSeeder {

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.senha}")
    private String adminSenha;

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
        };
    }
}
