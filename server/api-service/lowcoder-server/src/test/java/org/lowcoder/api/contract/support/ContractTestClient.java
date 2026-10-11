package org.lowcoder.api.contract.support;

import org.lowcoder.api.framework.configuration.PluginConfiguration;
import org.lowcoder.api.framework.exception.CustomErrorWebExceptionHandler;
import org.lowcoder.api.framework.filter.GlobalContextFilter;
import org.lowcoder.api.framework.filter.QueryExecuteHttpBodySizeFilter;
import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
import org.lowcoder.api.framework.service.GlobalContextService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.infra.serverlog.ServerLogService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.util.CookieHelper;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * The codec-level harness of docs/API_PAYLOAD_TEST_PLAN.md §5.1 (feasibility E6, E7, E9, E10): a Spring context with
 * the production server codecs and exception handling, the production web filters that shape a request, and Mockito
 * mocks behind the controller under test, driven through a {@link WebTestClient}.
 *
 * <p>Always present:
 * <ul>
 *   <li>{@link ContractHarness#codecContext()}: {@code CustomWebFluxConfiguration} (the production codecs and
 *       {@code @JsonView} handling) and {@code GlobalExceptionHandler}, with a mocked {@code ApiPerfHelper} (E6, E7);</li>
 *   <li>the production {@link GlobalContextFilter}, which writes the Reactor-context keys of
 *       {@code GlobalContextFilter.java:99-116}. Its collaborators are mocks ({@link SessionUserService},
 *       {@link OrgMemberService}, {@link ServerLogService}, {@link GlobalContextService}) and a real
 *       {@link CookieHelper}, which a test may replace through {@link Builder#mock} or {@link Builder#singleton};
 *       the visitor is {@link Authentication#ANONYMOUS_USER_ID} unless {@link Builder#visitor} sets one;</li>
 *   <li>the production {@link CustomErrorWebExceptionHandler} with {@link DefaultErrorAttributes},
 *       {@link WebProperties.Resources} and {@link ServerProperties} (E9);</li>
 *   <li>the production {@link PluginConfiguration} route, with mocks named {@value #PLUGIN_MANAGER_BEAN_NAME} (its
 *       {@code @DependsOn}) and {@value #PLUGIN_ENDPOINT_HANDLER_BEAN_NAME} that registers no plugin endpoint (E10).</li>
 * </ul>
 *
 * <p>Optional: the production {@link QueryExecuteHttpBodySizeFilter}, over {@link ConfigCenterForTest} and a
 * {@link CommonConfig} with the given limits. Production registers it only with {@value #CLOUD_PROPERTY}{@code =true},
 * and so does the harness: it sets that property when the filter is requested.
 *
 * <p>Controllers are registered by class, so Spring builds them and injects the registered mocks through their
 * constructors or {@code @Autowired} fields, as in production. Mocks are registered as ready singletons: registering a
 * mock with {@code registerBean} makes Spring inject the mock's own {@code @Autowired} fields and fail (E6).
 *
 * <p>Limits: the security filter chain and the other production filters are absent (plan §1.4 gives the evidence
 * that they do not touch JSON); every collaborator of a controller is either a mock or a bean the test registers.
 */
public final class ContractTestClient implements AutoCloseable {

    public static final String PLUGIN_MANAGER_BEAN_NAME = "lowcoderPluginManager";
    public static final String PLUGIN_ENDPOINT_HANDLER_BEAN_NAME = "pluginEndpointHandler";
    public static final Locale CLIENT_LOCALE = Locale.ENGLISH;
    /** {@code QueryExecuteHttpBodySizeFilter} is {@code @ConditionalOnProperty(value = "common.cloud", havingValue = "true")}. */
    public static final String CLOUD_PROPERTY = "common.cloud";
    private static final String HARNESS_PROPERTY_SOURCE = "contract-harness";

    private final AnnotationConfigApplicationContext context;
    private final WebTestClient web;

    private ContractTestClient(AnnotationConfigApplicationContext context) {
        this.context = context;
        this.web = WebTestClient.bindToApplicationContext(context).build();
    }

    public static Builder builder() {
        return new Builder();
    }

    /** The client bound to the harness context. */
    public WebTestClient web() {
        return web;
    }

    /** The registered mock or bean of {@code type}, for stubbing and verification. */
    public <T> T bean(Class<T> type) {
        return context.getBean(type);
    }

    public AnnotationConfigApplicationContext context() {
        return context;
    }

    @Override
    public void close() {
        context.close();
    }

    /** Collects the beans of one harness; {@link #build()} refreshes the context. */
    public static final class Builder {

        private final Map<String, Object> singletons = new LinkedHashMap<>();
        /** Harness defaults a test may replace; registered first so that {@link #controllerWithMockedDependencies} keeps them. */
        private final Set<String> replaceableDefaults = new HashSet<>();
        private final List<Class<?>> controllers = new ArrayList<>();
        private final List<WebFilter> webFilters = new ArrayList<>();
        private String visitorId = Authentication.ANONYMOUS_USER_ID;
        private Mono<OrgMember> currentOrgMember = Mono.empty();
        private CommonConfig querySizeLimits;

        private Builder() {
            singletons.put(beanName(CookieHelper.class), new CookieHelper(new CommonConfig()));
            replaceableDefaults.add(beanName(CookieHelper.class));
        }

        /** Registers a Mockito mock of {@code type} (once; later calls return the same mock), replacing a harness default. */
        public <T> T mock(Class<T> type) {
            dropReplaceableDefault(beanName(type));
            return type.cast(singletons.computeIfAbsent(beanName(type), name -> Mockito.mock(type)));
        }

        /** Registers a ready instance under {@code name}, without autowiring it; it replaces a harness default. */
        public Builder singleton(String name, Object instance) {
            dropReplaceableDefault(name);
            if (singletons.putIfAbsent(name, instance) != null) {
                throw new IllegalArgumentException("bean " + name + " is already registered");
            }
            return this;
        }

        private void dropReplaceableDefault(String name) {
            if (replaceableDefaults.remove(name)) {
                singletons.remove(name);
            }
        }

        /** Registers a controller class; Spring injects the registered beans. */
        public Builder controller(Class<?> controllerClass) {
            controllers.add(controllerClass);
            return this;
        }

        /**
         * Registers {@code controllerClass} with a Mockito mock for every collaborator Spring injects into it: the
         * parameters of its widest constructor and the types of its {@code @Autowired} fields and single-parameter
         * setters, superclasses included. A bean already registered under the type's name (the harness's own, or a
         * mock the test stubbed first through {@link #mock}) is kept. Limit: a collaborator injected any other way (a
         * {@code @Value}, an {@code ObjectProvider}) is not mocked and fails the context refresh, which names it.
         */
        public Builder controllerWithMockedDependencies(Class<?> controllerClass) {
            Constructor<?> widest = Arrays.stream(controllerClass.getDeclaredConstructors())
                    .max(Comparator.comparingInt(Constructor::getParameterCount)).orElseThrow();
            List<Class<?>> collaborators = new ArrayList<>(List.of(widest.getParameterTypes()));
            for (Class<?> c = controllerClass; c != null && c != Object.class; c = c.getSuperclass()) {
                Arrays.stream(c.getDeclaredFields()).filter(field -> field.isAnnotationPresent(Autowired.class))
                        .forEach(field -> collaborators.add(field.getType()));
                Arrays.stream(c.getDeclaredMethods())
                        .filter(method -> method.isAnnotationPresent(Autowired.class) && method.getParameterCount() == 1)
                        .forEach(method -> collaborators.add(method.getParameterTypes()[0]));
            }
            collaborators.stream().filter(type -> !singletons.containsKey(beanName(type))).forEach(this::mock);
            return controller(controllerClass);
        }

        /** Adds a web filter in front of the handlers, for example one that fails (E9). */
        public Builder webFilter(WebFilter filter) {
            webFilters.add(filter);
            return this;
        }

        /** The visitor that {@link SessionUserService#getVisitorId()} returns and its current org member. */
        public Builder visitor(String visitorId, OrgMember currentOrgMember) {
            this.visitorId = visitorId;
            this.currentOrgMember = Mono.just(currentOrgMember);
            return this;
        }

        /** Adds the production {@link QueryExecuteHttpBodySizeFilter} with these limits (Spring {@code DataSize} text). */
        public Builder queryBodySizeFilter(String maxRequestSize, String maxResponseSize) {
            querySizeLimits = new CommonConfig();
            querySizeLimits.setMaxQueryRequestSize(maxRequestSize);
            querySizeLimits.setMaxQueryResponseSize(maxResponseSize);
            return this;
        }

        public ContractTestClient build() {
            stubVisitor();
            stubErrorHandlerLocale();
            stubPluginRoute();
            AnnotationConfigApplicationContext context = ContractHarness.codecContext();
            if (querySizeLimits != null) {
                singleton(beanName(ConfigCenter.class), new ConfigCenterForTest());
                singleton(beanName(CommonConfig.class), querySizeLimits);
                // registration evaluates the filter's condition, so the property must be set first
                context.getEnvironment().getPropertySources()
                        .addFirst(new MapPropertySource(HARNESS_PROPERTY_SOURCE, Map.of(CLOUD_PROPERTY, Boolean.TRUE.toString())));
                context.register(QueryExecuteHttpBodySizeFilter.class);
            }
            singletons.forEach(context.getBeanFactory()::registerSingleton);
            context.registerBean(ErrorAttributes.class, DefaultErrorAttributes::new);
            context.registerBean(WebProperties.Resources.class, WebProperties.Resources::new);
            context.registerBean(ServerProperties.class, ServerProperties::new);
            for (int i = 0; i < webFilters.size(); i++) {
                WebFilter filter = webFilters.get(i);
                context.registerBean("testWebFilter" + i, WebFilter.class, () -> filter);
            }
            context.register(GlobalContextFilter.class, CustomErrorWebExceptionHandler.class, PluginConfiguration.class);
            controllers.forEach(context::register);
            context.refresh();
            return new ContractTestClient(context);
        }

        private void stubVisitor() {
            Mockito.when(mock(SessionUserService.class).getVisitorId()).thenReturn(Mono.just(visitorId));
            Mockito.when(mock(OrgMemberService.class).getCurrentOrgMember(Mockito.anyString())).thenReturn(currentOrgMember);
            mock(ServerLogService.class);
        }

        private void stubErrorHandlerLocale() {
            Mockito.when(mock(GlobalContextService.class).getClientLocale(Mockito.any(ServerRequest.class))).thenReturn(CLIENT_LOCALE);
        }

        private void stubPluginRoute() {
            LowcoderPluginManager pluginManager = Mockito.mock(LowcoderPluginManager.class);
            Mockito.doReturn(new ArrayList<>()).when(pluginManager).getLoadedPluginsInfo();
            PluginEndpointHandler endpointHandler = Mockito.mock(PluginEndpointHandler.class);
            Mockito.when(endpointHandler.registeredEndpoints()).thenReturn(List.of());
            singletons.putIfAbsent(PLUGIN_MANAGER_BEAN_NAME, pluginManager);
            singletons.putIfAbsent(PLUGIN_ENDPOINT_HANDLER_BEAN_NAME, endpointHandler);
        }

        private static String beanName(Class<?> type) {
            return StringUtils.uncapitalize(type.getSimpleName());
        }
    }
}
