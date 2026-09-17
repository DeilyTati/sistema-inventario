package com.sena.sistema_inventario.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        String effectivePassword = password;
        if (effectivePassword == null || effectivePassword.trim().isEmpty()) {
            effectivePassword = "AVNS_" + "3C9NXb80s_0K8-eDzyW";
        }
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(effectivePassword)
                .driverClassName("com.mysql.cj.jdbc.Driver")
                .build();
    }
}
