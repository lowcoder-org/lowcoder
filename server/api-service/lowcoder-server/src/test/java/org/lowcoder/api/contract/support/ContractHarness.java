package org.lowcoder.api.contract.support;

import org.lowcoder.api.framework.configuration.CustomWebFluxConfiguration;
import org.lowcoder.api.framework.exception.ApiPerfHelper;
import org.lowcoder.api.framework.exception.GlobalExceptionHandler;
import org.mockito.Mockito;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * Base of the plan's codec-level harness (docs/API_PAYLOAD_TEST_PLAN.md §5.1): a context with the production server
 * codecs ({@link CustomWebFluxConfiguration}) and {@link GlobalExceptionHandler}, whose only collaborator, the
 * {@code apiPerfHelper} bean, is a Mockito mock (E6, E7).
 *
 * <p>Limit: only the codec configuration and the global exception handler are production beans; controllers, filters
 * and services are added by each test.
 */
public final class ContractHarness {

    /**
     * The mock is registered as a ready singleton under this name. Registering it with {@code registerBean} lets Spring
     * inspect the mock's class and fail on an unsatisfied {@code PerfHelper} dependency (E6).
     */
    public static final String PERF_HELPER_BEAN_NAME = "apiPerfHelper";

    private ContractHarness() {
    }

    /** A context with the production server codecs, not yet refreshed, so callers can register more beans. */
    public static AnnotationConfigApplicationContext codecContext() {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.getBeanFactory().registerSingleton(PERF_HELPER_BEAN_NAME, Mockito.mock(ApiPerfHelper.class));
        context.register(CustomWebFluxConfiguration.class, GlobalExceptionHandler.class);
        return context;
    }
}
