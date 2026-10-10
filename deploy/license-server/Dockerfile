# syntax=docker/dockerfile:1.7
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
COPY src ./src
COPY keygen-dependency.pom /tmp/keygen-dependency.pom
# Northflank Docker secret mount: Base64 of the private keygen JAR.
# Never copy this dependency or its signing key into the Git repository.
RUN --mount=type=secret,id=enterprise_keygen_base64,required=true \
    base64 -d /run/secrets/enterprise_keygen_base64 > /tmp/keygen.jar && \
    echo 'c338af8b809b4a33887d6080a11552d6e3d0dff923ed564dd8f5e2ee2fe19ad8  /tmp/keygen.jar' | sha256sum -c - && \
    mvn -B -ntp org.apache.maven.plugins:maven-install-plugin:3.1.2:install-file \
      -Dfile=/tmp/keygen.jar -DpomFile=/tmp/keygen-dependency.pom && \
    mvn -B -ntp -DskipTests package && \
    rm -f /tmp/keygen.jar && rm -rf /root/.m2/repository/com/lowcoder/pro/lowcoder-enterprise-license-keygen
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build --chown=10001:10001 /build/target/lowcoder-licensing-server-2.0.jar /app/app.jar
USER 10001:10001
ENV TZ=UTC SERVER_PORT=8080 DEBUG=false LOGGING_LEVEL_ROOT=INFO \
    SPRING_JPA_SHOW_SQL=false SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect \
    SERVER_ERROR_INCLUDE_EXCEPTION=false SERVER_ERROR_INCLUDE_MESSAGE=never SERVER_ERROR_INCLUDE_BINDING_ERRORS=never
EXPOSE 8080
ENTRYPOINT ["java","-Duser.timezone=UTC","-jar","/app/app.jar"]
