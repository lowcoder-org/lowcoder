package org.lowcoder.api;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.servers.ServerVariable;
import io.swagger.v3.oas.models.servers.ServerVariables;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class OpenAPIDocsConfiguration {
    @Autowired
    private CommonConfig commonConfig;

    @Value("${server.port:8080}")
    private int serverPort;
    
    @Value("${spring.webflux.base-path:/}")
    private String contextPath;
    
    @Bean
    OpenAPI customizeOpenAPI() {

        final String securitySchemeName = commonConfig.getCookieName();

        return new OpenAPI()
			.info(new Info()
			.title("Lowcoder Open Rest API")
			.version(commonConfig.getApiVersion()))
			/*.addServersItem(new Server()
					.url(createLocalServerUrl("localhost", serverPort, contextPath))
					.description("Local development API service")
			) */
			.addServersItem(createCustomServer())
			.addServersItem(new Server()
					.url("https://api-service.lowcoder.cloud/")
					.description("Lowcoder Community Edition: Public Cloud API Access")
			)
			.addSecurityItem(new SecurityRequirement()
					.addList(securitySchemeName)).components(new Components()
					/* .addSecuritySchemes(
						securitySchemeName,
						new SecurityScheme()
							.name(securitySchemeName)
							.type(SecurityScheme.Type.HTTP) // HTTP-based authentication
							.scheme("cookie") // Specify the authentication scheme as "cookie"
							.description("Cookie-based authentication. Please ensure the client sends cookies with each request after authentication.")
					) */
					.addSecuritySchemes(
						"API Key",
						new SecurityScheme()
							.name("Authorization")
							.type(SecurityScheme.Type.APIKEY)
							.in(SecurityScheme.In.HEADER)
							.scheme("bearer")
							.bearerFormat("JWT")
							.description("API Key Authentication with a Bearer token. Copy your API Key and prefix it here with 'Bearer ' (e.g. 'Bearer eyJhbGciO...'")
					)
			);
    }
    
    
    /* private static String createLocalServerUrl(String domain, int port, String contextPath)    
    {
    	StringBuilder sb = new StringBuilder("http");
    	
    	if (port == 443)
    	{
    		sb.append("s");
    	}
    	sb.append("://").append(domain);

    	if (port != 80 && port != 443)
    	{
    		sb.append(":").append(port);
    	}
    	sb.append(contextPath);
    	
    	return sb.toString();
    } */
    
    private Server createCustomServer()
    {
    	String url = "{scheme}://{domain}:{port}{basePath}";
    	
    	Server server = new Server()
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
    							._default(contextPath))    					
    			);
    	return server;
    }
}