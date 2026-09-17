# =====================================================
# ETAPA 1: Construcción de la aplicación (Maven + JDK 17)
# =====================================================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar configuración de dependencias y código fuente
COPY pom.xml .
COPY src ./src

# Compilar y empaquetar el archivo JAR (omitiendo pruebas unitarias)
RUN mvn clean package -DskipTests

# =====================================================
# ETAPA 2: Entorno de ejecución ligero (JRE 17)
# =====================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiar el archivo JAR generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Variable de entorno para el puerto de Render
ENV PORT=8081
EXPOSE 8081

# Comando de inicio del servidor Spring Boot
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
