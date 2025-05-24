package org.lowcoder.api;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.servers.ServerVariable;
import io.swagger.v3.oas.models.servers.ServerVariables;
import io.swagger.v3.oas.models.tags.Tag;
import org.lowcoder.sdk.config.CommonConfig;
import org.springdoc.api.OpenApiCustomiser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.Comparator;
import java.util.Map;
import java.util.TreeMap;

@Configuration
public class OpenAPIDocsConfiguration {

    @Autowired
    private CommonConfig commonConfig;

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${spring.webflux.base-path:/}")
    private String contextPath;

    /**
     * Configures the core OpenAPI spec including servers, security and info.
     */
    @Bean
    public OpenAPI customizeOpenAPI() {
        final String securitySchemeName = commonConfig.getCookieName();

        return new OpenAPI()
            .info(new Info()
                .title("Lowcoder Open Rest API")
                .version(commonConfig.getApiVersion()))
            .addServersItem(createCustomServer())
            .addServersItem(new Server()
                .url("https://api-service.lowcoder.cloud/")
                .description("Lowcoder Community Edition: Public Cloud API Access"))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes("API Key", new SecurityScheme()
                    .name("Authorization")
                    .type(SecurityScheme.Type.APIKEY)
                    .in(SecurityScheme.In.HEADER)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("API Key Authentication with a Bearer token. Copy your API Key and prefix it here with 'Bearer ' (e.g. 'Bearer eyJhbGciO...')")));
    }

    /**
     * Creates a dynamic server entry using server variables.
     */
    private Server createCustomServer() {
        String url = "{scheme}://{domain}:{port}{basePath}";

        return new Server()
            .description("Lowcoder Self-hosted Installation API Access")
            .url(url)
            .variables(new ServerVariables()
                .addServerVariable("scheme", new ServerVariable()
                    ._default("http")
                    .description("HTTP scheme")
                    ._enum(Arrays.asList("http", "https")))
                .addServerVariable("domain", new ServerVariable()
                    .description("Lowcoder IP address or domain")
                    ._default("localhost"))
                .addServerVariable("port", new ServerVariable()
                    .description("Port")
                    ._default("3000"))
                .addServerVariable("basePath", new ServerVariable()
                    .description("Base path")
                    ._default(contextPath)));
    }

    /**
     * Customizes the OpenAPI spec at runtime to sort tags and paths.
     */
    @Bean
    public OpenApiCustomiser sortOpenApiSpec() {
        return openApi -> {
            // Sort tags alphabetically
            if (openApi.getTags() != null) {
                openApi.getTags().sort(Comparator.comparing(Tag::getName));
            }

            // Sort paths alphabetically by their URL
            if (openApi.getPaths() != null) {
                Map<String, PathItem> sorted = new TreeMap<>(openApi.getPaths());
                Paths sortedPaths = new Paths();
                sorted.forEach(sortedPaths::addPathItem);
                openApi.setPaths(sortedPaths);
            }
        };
    }
}
