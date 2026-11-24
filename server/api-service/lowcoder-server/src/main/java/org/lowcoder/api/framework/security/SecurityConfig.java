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
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/view_marketplace"), // application view
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/*/marketplace-preview/image"),
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
                        // health only, for probes; metrics and prometheus require authentication (D-39)
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.PREFIX + "/status/health"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.PREFIX + "/status/health/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/view"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/view_marketplace"),
                        // Image delivery performs the same marketplace access checks in its controller.
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, NewUrl.APPLICATION_URL + "/*/marketplace-preview/image"),
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
     * CORS, resolved per request. CORS controls only whether the BROWSER exposes a cross-origin answer to the calling
     * page's script (the {@code Access-Control-Allow-Credentials} response header); it never stops the browser from
     * attaching the session cookie to the request in the first place (see the limit below). The single rule:
     * {@code Access-Control-Allow-Credentials} is granted only to an origin matching a non-wildcard entry of
     * {@code LOWCODER_CORS_DOMAINS} ({@code commonConfig.getSecurity().getAllCorsAllowedDomains()}); a wildcard
     * sub-pattern entry such as {@code https://*.example.com} counts as listed (it is kept as written and matched by
     * {@code CorsConfiguration#checkOrigin}), only a standalone {@code "*"} entry does not. An origin that is not
     * listed still gets a 200 answer, with no {@code Access-Control-Allow-Credentials} (so a credentialed `fetch`
     * from that origin cannot read the answer's body or headers), on a path this method used to grant "any origin,
     * with credentials" unconditionally ({@code publicPaths}, the former {@code skipCheckCorsForAll} list), or on any
     * path at all when the configured domains contain the literal entry {@code "*"}; otherwise it is refused (403),
     * the same as for any other unlisted path today.
     * <p>
     * Limit NOT closed by this method: CSRF stays off and the session cookie is {@code SameSite=None} on HTTPS
     * regardless, so the cookie still reaches the server, with the server still acting on it, on a cross-site SIMPLE
     * request (a plain HTML form submit, which triggers no CORS preflight and needs no credential grant to be SENT,
     * only to have its ANSWER read) — e.g. {@code POST /api/users/password?password=...}. This method only withholds
     * the answer from the calling page's own script; it was never a defense against the request itself being made
     * with the cookie attached.
     */
    private CorsConfigurationSource buildCorsConfigurationSource() {
        UrlBasedCorsConfigurationSource publicPaths = buildPublicPathsSource();
        CorsConfiguration credentialedListed = credentialedListedOriginsConfiguration();
        CorsConfiguration anyOriginNoCredentials = anyOriginNoCredentialsConfiguration();
        boolean wildcardConfigured = commonConfig.getSecurity().getAllCorsAllowedDomains().contains("*");

        return exchange -> {
            String origin = exchange.getRequest().getHeaders().getOrigin();
            if (origin == null) {
                return null;
            }
            if (credentialedListed.checkOrigin(origin) != null) {
                return credentialedListed;
            }
            boolean formerAnyOriginPath = publicPaths.getCorsConfiguration(exchange) != null;
            return (formerAnyOriginPath || wildcardConfigured) ? anyOriginNoCredentials : credentialedListed;
        };
    }

    /**
     * Path matcher only: the configurations registered here are never returned to a caller (only checked for
     * presence), they merely mark the paths that used to grant "any origin, with credentials" unconditionally.
     */
    @Nonnull
    private UrlBasedCorsConfigurationSource buildPublicPathsSource() {
        CorsConfiguration marker = skipCheckCorsForAll();
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(USER_URL + "/me", marker);
        source.registerCorsConfiguration(CONFIG_URL, marker);
        source.registerCorsConfiguration(GROUP_URL + "/list", marker);
        source.registerCorsConfiguration(QUERY_URL + "/execute", marker);
        source.registerCorsConfiguration(APPLICATION_URL + "/*", marker);
        source.registerCorsConfiguration(APPLICATION_URL + "/*/view", marker);
        source.registerCorsConfiguration(APPLICATION_URL + "/*/view_marketplace", marker);
        source.registerCorsConfiguration(APPLICATION_URL + "/*/marketplace-preview/image", marker);
        source.registerCorsConfiguration(APPLICATION_URL + "/marketplace-apps", marker);
        source.registerCorsConfiguration(GITHUB_STAR, marker);
        source.registerCorsConfiguration(ORGANIZATION_URL + "/*/datasourceTypes", marker);
        source.registerCorsConfiguration(DATASOURCE_URL + "/jsDatasourcePlugins", marker);

        source.registerCorsConfiguration(NewUrl.USER_URL + "/me", marker);
        source.registerCorsConfiguration(NewUrl.CONFIG_URL, marker);
        source.registerCorsConfiguration(NewUrl.GROUP_URL + "/list", marker);
        source.registerCorsConfiguration(NewUrl.QUERY_URL + "/execute", marker);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*", marker);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*/view", marker);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*/view_marketplace", marker);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/*/marketplace-preview/image", marker);
        source.registerCorsConfiguration(NewUrl.APPLICATION_URL + "/marketplace-apps", marker);
        source.registerCorsConfiguration(NewUrl.ORGANIZATION_URL + "/*/datasourceTypes", marker);
        source.registerCorsConfiguration(NewUrl.DATASOURCE_URL + "/jsDatasourcePlugins", marker);
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

    /** The configured domains with the literal {@code "*"} entry removed; a wildcard sub-pattern entry is kept as written. */
    @Nonnull
    private CorsConfiguration credentialedListedOriginsConfiguration() {
        List<String> listedOrigins = commonConfig.getSecurity().getAllCorsAllowedDomains().stream()
                .filter(domain -> !"*".equals(domain))
                .toList();
        CorsConfiguration credentialedListed = new CorsConfiguration();
        credentialedListed.setAllowedOriginPatterns(listedOrigins);
        credentialedListed.setAllowedMethods(List.of("*"));
        credentialedListed.setAllowedHeaders(List.of("*"));
        credentialedListed.setAllowCredentials(true);
        return credentialedListed;
    }

    /** Any origin, no {@code Access-Control-Allow-Credentials}: the fallback for an unlisted origin. */
    @Nonnull
    private CorsConfiguration anyOriginNoCredentialsConfiguration() {
        CorsConfiguration anyOriginNoCredentials = new CorsConfiguration();
        anyOriginNoCredentials.setAllowedOriginPatterns(List.of("*"));
        anyOriginNoCredentials.setAllowedMethods(List.of("*"));
        anyOriginNoCredentials.setAllowedHeaders(List.of("*"));
        anyOriginNoCredentials.setAllowCredentials(false);
        return anyOriginNoCredentials;
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
