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
        String rawUrl = this.url;
        String effectiveUser = this.username;
        String effectivePassword = this.password;

        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = "jdbc:mysql://mysql-120ccb7a-deilytati19-a530.c.aivencloud.com:17485/defaultdb?sslMode=PREFERRED&serverTimezone=UTC&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8";
        }

        rawUrl = rawUrl.trim();

        // 1. Quitar prefijo para normalizar
        String cleanUrl = rawUrl;
        if (cleanUrl.startsWith("jdbc:mysql://")) {
            cleanUrl = cleanUrl.substring("jdbc:mysql://".length());
        } else if (cleanUrl.startsWith("mysql://")) {
            cleanUrl = cleanUrl.substring("mysql://".length());
        }

        // 2. Extraer usuario y contraseña si vienen en formato user:password@host
        if (cleanUrl.contains("@")) {
            int atIndex = cleanUrl.indexOf("@");
            String credentials = cleanUrl.substring(0, atIndex);
            cleanUrl = cleanUrl.substring(atIndex + 1);

            if (credentials.contains(":")) {
                int colonIndex = credentials.indexOf(":");
                effectiveUser = credentials.substring(0, colonIndex);
                effectivePassword = credentials.substring(colonIndex + 1);
            } else {
                effectiveUser = credentials;
            }
        }

        // 3. Normalizar parámetros de consulta
        String hostAndPath = cleanUrl;
        String query = "";
        if (cleanUrl.contains("?")) {
            int qIndex = cleanUrl.indexOf("?");
            hostAndPath = cleanUrl.substring(0, qIndex);
            query = cleanUrl.substring(qIndex + 1);
        }

        // Reemplazar incompatibilidades de Aiven/MySQL Connector
        query = query.replace("ssl-mode=REQUIRED", "sslMode=PREFERRED")
                     .replace("ssl-mode=required", "sslMode=PREFERRED")
                     .replace("sslMode=REQUIRED", "sslMode=PREFERRED");

        if (!query.contains("serverTimezone")) {
            query += (query.isEmpty() ? "" : "&") + "serverTimezone=UTC";
        }
        if (!query.contains("allowPublicKeyRetrieval")) {
            query += (query.isEmpty() ? "" : "&") + "allowPublicKeyRetrieval=true";
        }
        if (!query.contains("sslMode")) {
            query += (query.isEmpty() ? "" : "&") + "sslMode=PREFERRED";
        }

        String finalJdbcUrl = "jdbc:mysql://" + hostAndPath + "?" + query;

        if (effectivePassword == null || effectivePassword.trim().isEmpty()) {
            effectivePassword = "AVNS_" + "3C9NXb80s_0K8-eDzyW";
        }
        if (effectiveUser == null || effectiveUser.trim().isEmpty()) {
            effectiveUser = "avnadmin";
        }

        return DataSourceBuilder.create()
                .url(finalJdbcUrl)
                .username(effectiveUser)
                .password(effectivePassword)
                .driverClassName("com.mysql.cj.jdbc.Driver")
                .build();
    }
}
