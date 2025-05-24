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
import org.springdoc.core.customizers.OpenApiCustomiser;
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
                .addSecuritySchemes("APIKey", new SecurityScheme()
                    .name("Authorization")
                    .type(SecurityScheme.Type.APIKEY)
                    .in(SecurityScheme.In.HEADER)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("API Key Authentication with a Bearer token. Copy your API Key and prefix it here with 'Bearer ' (e.g. 'Bearer eyJhbGciO...')"))
                    
            )
            .tags(Arrays.asList(
    
                new Tag().name("Application APIs").description("Application APIs"),
                new Tag().name("Application History APIs").description("Application History APIs"),
                new Tag().name("Application Permissions APIs").description("Application Permissions APIs"),
                new Tag().name("Application Record APIs").description("Application Record APIs"),
                
                new Tag().name("Bundle APIs").description("Bundle APIs"),
                new Tag().name("Bundle Permissions APIs").description("Bundle Permissions APIs"),

                new Tag().name("Folder APIs").description("Folder APIs"),
                new Tag().name("Folder Permissions APIs").description("Folder Permissions APIs"),
                
                new Tag().name("Data Source APIs").description("Data Source APIs"),
                new Tag().name("Data Source Permissions APIs").description("Data Source Permissions APIs"),

                new Tag().name("Query Execution APIs").description("Query Execution APIs"),
                new Tag().name("Query Library APIs").description("Query Library APIs"),
                new Tag().name("Library Queries Record APIs").description("Library Queries Record APIs"),

                new Tag().name("File APIs").description("File APIs"),
                new Tag().name("Meta APIs").description("Meta APIs"),
                new Tag().name("Image Assets APIs").description("Image Assets APIs"),
                        
                new Tag().name("User APIs").description("User APIs"),
                new Tag().name("User Password APIs").description("User Password APIs"),
                new Tag().name("User Profile Photo APIs").description("User Profile Photo APIs"),
                new Tag().name("User invitation APIs").description("User invitation APIs"),
                new Tag().name("Authentication APIs").description("Authentication APIs"),
                
                new Tag().name("Group APIs").description("Group APIs"),
                new Tag().name("Group Members APIs").description("Group Members APIs"),

                new Tag().name("Organization APIs").description("Organization APIs"),
                new Tag().name("Organization Member APIs").description("Organization Member APIs"),
                new Tag().name("Configuration APIs").description("Configuration APIs"),

                new Tag().name("API Root Endpoint").description("API Root Endpoint"),
                new Tag().name("Status checks APIs").description("Status checks APIs"),
                new Tag().name("Server Setting APIs").description("Server Setting APIs"),
                new Tag().name("Private NPM registry APIs").description("Private NPM registry APIs"),
                new Tag().name("Javascript Library APIs").description("Javascript Library APIs")
            ));
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
