package org.lowcoder.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.query.util.QueryTimeoutUtils.parseQueryTimeoutMs;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import org.assertj.core.api.SoftAssertions;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.test.context.ActiveProfiles;

/**
 * NEW-12 (T162): the whole server starts with the shipped {@code debug} profile. {@code application-debug.yaml} shipped
 * {@code default.query-timeout: ${LOWCODER_DEFAULT_QUERY_TIMEOUT:10s}}, which {@code QueryTimeoutUtils} injects as an
 * {@code int} of seconds; with the profile active and the variable unset, the context of {@link ServerApplication} failed
 * to load ({@code UnsatisfiedDependencyException} for {@code queryTimeoutUtils}, caused by
 * {@code NumberFormatException: For input string: "10s"}). The file now ships {@code 10}, as {@code application.yaml} does,
 * and a query without a timeout of its own gets 10 s again.
 *
 * <p>The one difference from a real debug start: the debug file's logger levels ({@code logging.level.root} and
 * {@code logging.level.org.lowcoder}, {@code debug}) and its {@code debug: true} (the condition report) are replaced by
 * the inlined test properties below, to keep them out of the module's test logs. Limit: a start behaviour that depends
 * on {@code debug: true} or on those levels alone is not covered here.
 *
 * <p>Other limits: the test checks the shipped value only when the process environment does not set
 * {@code LOWCODER_DEFAULT_QUERY_TIMEOUT}, and fails with that reason when it does (a value that is not a whole number
 * fails the context load before the test method runs; the exception chain then names it). It needs a running Docker
 * daemon, like every server test (MongoDB and Redis come from {@code TestContainersInitializer}). The default it checks is
 * process-global static state ({@code QueryTimeoutUtils}); this context sets it to the same 10 s that every other context
 * of the module sets from {@code application.yaml}, so nothing is reset. Isolation: no other class activates the
 * {@code debug} profile, so this context is its own, with its own database.
 */
@SpringBootTest(properties = {
        DebugProfileServerStartTest.ROOT_LOGGING_INFO,
        DebugProfileServerStartTest.LOWCODER_LOGGING_INFO,
        DebugProfileServerStartTest.NO_CONDITION_REPORT})
@ActiveProfiles(DebugProfileServerStartTest.DEBUG_PROFILE)
class DebugProfileServerStartTest {

    static final String DEBUG_PROFILE = "debug";
    /** The profile's config file; a config file's property source is named after its resource. */
    static final String DEBUG_CONFIG = "application-debug.yaml";
    static final String ROOT_LOGGING_INFO = "logging.level.root=info";
    static final String LOWCODER_LOGGING_INFO = "logging.level.org.lowcoder=info";
    static final String NO_CONDITION_REPORT = "debug=false";
    static final String TIMEOUT_PROPERTY = "default.query-timeout";
    /** The variable both shipped files read first; set, it replaces the shipped value. */
    static final String TIMEOUT_VARIABLE = "LOWCODER_DEFAULT_QUERY_TIMEOUT";
    static final int SHIPPED_DEFAULT_SECONDS = 10;
    /** The stored timeout of a query that has none. */
    static final String BLANK_TIMEOUT = "";

    @Autowired
    private ConfigurableEnvironment environment;

    @Autowired
    private CommonConfig commonConfig;

    /** Catches: the debug profile shipping a default that the {@code int} seconds of {@code QueryTimeoutUtils} cannot take. */
    @Test
    void theServerStartsWithTheDebugProfileAndATenSecondDefault() {
        assertThat(System.getenv(TIMEOUT_VARIABLE))
                .as(TIMEOUT_VARIABLE + " is set in the process environment, so the shipped value cannot be checked")
                .isNull();

        List<String> debugSources = environment.getPropertySources().stream()
                .map(PropertySource::getName)
                .filter(name -> name.contains(DEBUG_CONFIG))
                .toList();
        String timeout = environment.getProperty(TIMEOUT_PROPERTY);
        int maxSeconds = commonConfig.getMaxQueryTimeout();
        int blankTimeoutMs = parseQueryTimeoutMs(BLANK_TIMEOUT, maxSeconds);
        System.out.println("[DebugProfileServerStartTest] profiles " + Arrays.toString(environment.getActiveProfiles())
                + ", debug sources " + debugSources + ", " + TIMEOUT_PROPERTY + "=" + timeout
                + ", blank timeout under a " + maxSeconds + " s maximum -> " + blankTimeoutMs + " ms");

        SoftAssertions.assertSoftly(soft -> {
            soft.assertThat(environment.getActiveProfiles()).as("active profiles").contains(DEBUG_PROFILE);
            soft.assertThat(debugSources).as("property sources from " + DEBUG_CONFIG).isNotEmpty();
            soft.assertThat(timeout).as(TIMEOUT_PROPERTY).isEqualTo(String.valueOf(SHIPPED_DEFAULT_SECONDS));
            soft.assertThat(blankTimeoutMs).as("blank timeout in ms")
                    .isEqualTo(Duration.ofSeconds(SHIPPED_DEFAULT_SECONDS).toMillis());
        });
    }
}
