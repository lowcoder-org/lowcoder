package org.lowcoder.api.framework.security;


import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.framework.filter.APIKeyAuthFilter;
import org.lowcoder.api.framework.filter.UserSessionPersistenceFilter;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity.CsrfSpec;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;

import java.util.List;

import static org.lowcoder.infra.constant.NewUrl.GITHUB_STAR;
import static org.lowcoder.infra.constant.Url.*;
import static org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER;
import static org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID;

@RequiredArgsConstructor
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity(useAuthorizationManager = true)
public class SecurityConfig {

    private final CommonConfig commonConfig;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final AccessDeniedHandler accessDeniedHandler;
    private final ServerAuthenticationEntryPoint serverAuthenticationEntryPoint;
    private final CookieHelper cookieHelper;
    private final AuthenticationService authenticationService;
    private final AuthenticationApiServiceImpl authenticationApiService;
    private final AuthRequestFactory<AuthRequestContext> authRequestFactory;
    private final JWTUtils jwtUtils;

    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

    	if (!commonConfig.getSecurity().getForbiddenEndpoints().isEmpty())
    	{
    		http.authorizeExchange(customizer -> customizer
	    		.matchers(commonConfig.getSecurity().getForbiddenEndpoints().stream()
		        		.map(apiEndpoint -> ServerWebExchangeMatchers.pathMatchers(apiEndpoint.getMethod(), apiEndpoint.getUri()))
		        		.toArray(size -> new ServerWebExchangeMatcher[size])
				).denyAll()
	    	);
    	}
    	
    	http
    		.cors(cors -> cors.configurationSource(buildCorsConfigurationSource()))
            .csrf(CsrfSpec::disable)
            .anonymous(anonymous -> anonymous.principal(createAnonymousUser()))
            .httpBasic(Customizer.withDefaults())
            .authorizeExchange(customizer -> customizer
                .matchers(
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/home"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/home")
                )
                    .authenticated()
                .matchers(
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/otp/send"), // sms verification
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/phone/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/ldap/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/tp/login/**"), // third party login
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/callback/tp/login/**"), // third party login callback
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/form/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, INVITATION_URL + "/**"), // invitation
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, CUSTOM_AUTH + "/logout"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.HEAD, STATE_URL + "/healthCheck"),
                        // used in public viewed apps
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, CONFIG_URL), // system config
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, SERVER_SETTING_URL), // system env
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, FLOW_URL), // system config
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, CONFIG_URL + "/deploymentId"), // system config
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*"), // application view
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/view"), // application view
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/icons"), // app icons list
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/icons/**"), // app icons
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/view_marketplace"), // application view
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/icons"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/icons/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/manifest.json"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/marketplace-apps"), // marketplace apps

                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/me"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/currentUser"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/lost-password"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/reset-lost-password"),

                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, GROUP_URL + "/list"), // application view
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, QUERY_URL + "/execute"), // application view
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ORGANIZATION_URL + "/*/datasourceTypes"), // datasource types
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ORGANIZATION_URL + "/byuser/*"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, DATASOURCE_URL + "/jsDatasourcePlugins"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, META_URL + "/"),

                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, GITHUB_STAR),

                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/otp/send"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/phone/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/ldap/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/tp/login/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/jwt/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/callback/tp/login/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/form/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/cas/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.INVITATION_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.CUSTOM_AUTH + "/logout"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.CONFIG_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.SERVER_SETTING_URL), // system env
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.FLOW_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.CONFIG_URL + "/deploymentId"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.HEAD, NewUrl.STATE_URL + "/healthCheck"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.PREFIX + "/status/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/view"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/icons"), // app icons list
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/icons/**"), // app icons
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/view_marketplace"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/icons"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/icons/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/manifest.json"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/marketplace-apps"), // marketplace apps
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.USER_URL + "/me"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.USER_URL + "/currentUser"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.USER_URL + "/lost-password"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.USER_URL + "/reset-lost-password"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.GROUP_URL + "/list"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.QUERY_URL + "/execute"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.MATERIAL_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.ORGANIZATION_URL + "/*/datasourceTypes"), // datasource types
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.ORGANIZATION_URL + "/byuser/*"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.DATASOURCE_URL + "/jsDatasourcePlugins"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, NewUrl.META_URL + "/"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.NPM_REGISTRY + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, "/api/docs/**")
                )
                .permitAll()
                .pathMatchers("/api/plugins/**")
                .permitAll()
                .pathMatchers("/api/**")
                	.authenticated()
                .pathMatchers("/test/**")
                	.authenticated()
                .pathMatchers("/**")
                	.permitAll()
                .anyExchange()
                	.authenticated()
        );

        http.exceptionHandling(customizer -> customizer
                .authenticationEntryPoint(serverAuthenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
        );

        http.addFilterBefore(new UserSessionPersistenceFilter(sessionUserService, userService, cookieHelper, authenticationService, authenticationApiService, authRequestFactory), SecurityWebFiltersOrder.AUTHENTICATION);
        http.addFilterBefore(new APIKeyAuthFilter(sessionUserService, cookieHelper, jwtUtils), SecurityWebFiltersOrder.AUTHENTICATION);

        return http.build();
    }

        
    /**
     * enable CORS
     */
    private CorsConfigurationSource buildCorsConfigurationSource() {
        CorsConfiguration skipCheckCorsForAll = skipCheckCorsForAll();
        CorsConfiguration skipCheckCorsForAllowListDomains = skipCheckCorsForAllowListDomains();

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(USER_URL + "/me", skipCheckCorsForAll);
        source.registerCorsConfiguration(CONFIG_URL, skipCheckCorsForAll);
        source.registerCorsConfiguration(GROUP_URL + "/list", skipCheckCorsForAll);
        source.registerCorsConfiguration(QUERY_URL + "/execute", skipCheckCorsForAll);
        source.registerCorsConfiguration(APPLICATION_URL + "/*", skipCheckCorsForAll);
        source.registerCorsConfiguration(APPLICATION_URL + "/*/view", skipCheckCorsForAll);
        source.registerCorsConfiguration(APPLICATION_URL + "/*/view_marketplace", skipCheckCorsForAll);
        source.registerCorsConfiguration(APPLICATION_URL + "/marketplace-apps", skipCheckCorsForAll);
        source.registerCorsConfiguration(GITHUB_STAR, skipCheckCorsForAll);
        source.registerCorsConfiguration(ORGANIZATION_URL + "/*/datasourceTypes", skipCheckCorsForAll);
        source.registerCorsConfiguration(DATASOURCE_URL + "/jsDatasourcePlugins", skipCheckCorsForAll);

        source.registerCorsConfiguration(NewUrl.USER_URL + "/me", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.CONFIG_URL, skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.GROUP_URL + "/list", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.QUERY_URL + "/execute", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*/view", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*/view_marketplace", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/marketplace-apps", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.ORGANIZATION_URL + "/*/datasourceTypes", skipCheckCorsForAll);
        source.registerCorsConfiguration(NewUrl.DATASOURCE_URL + "/jsDatasourcePlugins", skipCheckCorsForAll);

        source.registerCorsConfiguration("/**", skipCheckCorsForAllowListDomains);
        return source;
    }

    @Nonnull
    private CorsConfiguration skipCheckCorsForAll() {
        CorsConfiguration skipForAllowlistDomains = new CorsConfiguration();
        skipForAllowlistDomains.setAllowedOriginPatterns(List.of("*"));
        skipForAllowlistDomains.setAllowedMethods(List.of("*"));
        skipForAllowlistDomains.setAllowedHeaders(List.of("*"));
        skipForAllowlistDomains.setAllowCredentials(true);
        return skipForAllowlistDomains;
    }

    @Nonnull
    private CorsConfiguration skipCheckCorsForAllowListDomains() {
        CorsConfiguration skipForAllowlistDomains = new CorsConfiguration();
        skipForAllowlistDomains.setAllowedOriginPatterns(commonConfig.getSecurity().getAllCorsAllowedDomains());
        skipForAllowlistDomains.setAllowedMethods(List.of("*"));
        skipForAllowlistDomains.setAllowedHeaders(List.of("*"));
        skipForAllowlistDomains.setAllowCredentials(true);
        return skipForAllowlistDomains;
    }

    @Bean
    ForwardedHeaderTransformer forwardedHeaderTransformer() {
        return new ForwardedHeaderTransformer();
    }

    /**
     * provide a default user for unauthenticated cases
     */
    private User createAnonymousUser() {
        User user = new User();
        user.setId(ANONYMOUS_USER_ID);
        user.setName(ANONYMOUS_USER);
        user.setIsAnonymous(true);
        return user;
    }
}
