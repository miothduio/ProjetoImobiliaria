package com.example.demo.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serve os arquivos da pasta de upload como estáticos:
 *   ./uploads/3/abc_foto.png  ->  GET http://localhost:8080/uploads/3/abc_foto.png
 * Assim o front exibe a foto direto com <img src="...">.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path pasta = Paths.get(uploadDir).toAbsolutePath().normalize();
        String local = pasta.toUri().toString();
        if (!local.endsWith("/")) {
            local = local + "/";
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(local);
    }
}
