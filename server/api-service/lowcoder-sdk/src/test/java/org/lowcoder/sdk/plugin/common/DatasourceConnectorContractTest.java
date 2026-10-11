package org.lowcoder.sdk.plugin.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.OtherConfig;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestConfig;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestConnector;

import reactor.core.publisher.Mono;

/**
 * The default methods of {@link DatasourceConnector}: the config binding by the type the plugin declares, and how a failure
 * to create a connection is reported. The real ten-second timeout operator is assembled by every call but not waited for;
 * its mapping is checked with a {@link TimeoutException} signalled at once.
 */
public class DatasourceConnectorContractTest {

    private final TestConnector connector = new TestConnector();
    private final TestConfig config = new TestConfig("h");

    @Test
    public void theConfigIsBoundToTheTypeThePluginDeclaresAndAMissingOneIsRejected() {
        TestConfig bound = connector.resolveConfig(Map.of("host", "db.example.com"));

        assertEquals("db.example.com", bound.host);
        PluginException failure = assertThrows(PluginException.class, () -> connector.resolveConfig(null));
        assertEquals("DATASOURCE_CONFIG_ERROR", failure.getMessageKey());
        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, failure.getError());
    }

    @Test
    public void validateAndTestDelegateToThePlugin() {
        connector.invalid = Set.of("HOST_EMPTY");
        DatasourceTestResult failed = DatasourceTestResult.testFail("no route");
        connector.test = Mono.just(failed);

        assertEquals(Set.of("HOST_EMPTY"), connector.doValidateConfig(config));
        assertSame(failed, connector.doTestConnection(config).block());
    }

    @Test
    public void aConnectionIsCreatedAndEveryFailureIsReportedAsACodedPluginException() {
        assertEquals("connection", connector.doCreateConnection(config).block());

        PluginException coded = new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, "QUERY_ARGUMENT_ERROR", "mine");
        connector.create = Mono.error(coded);
        assertSame(coded, assertThrows(PluginException.class, () -> connector.doCreateConnection(config).block()));

        connector.create = Mono.error(new TimeoutException("slow"));
        PluginException timeout = assertThrows(PluginException.class, () -> connector.doCreateConnection(config).block());
        assertEquals("DATASOURCE_TIMEOUT_ERROR", timeout.getMessageKey());
        assertEquals(PluginCommonError.DATASOURCE_TIMEOUT_ERROR, timeout.getError());

        connector.create = Mono.error(new IllegalStateException("refused"));
        PluginException failed = assertThrows(PluginException.class, () -> connector.doCreateConnection(config).block());
        System.out.println("[DatasourceConnectorContractTest] " + failed.getError() + " " + failed.getMessageKey() + ": " + failed.getMessage());
        assertEquals("PLUGIN_CREATE_CONNECTION_FAILED", failed.getMessageKey());
        assertEquals(PluginCommonError.QUERY_EXECUTION_ERROR, failed.getError());
        assertTrue(failed.getMessage().contains("refused"), failed.getMessage());
    }

    @Test
    public void theTokenDetailIsUnsupportedByDefault() {
        assertThrows(UnsupportedOperationException.class, () -> connector.resolveTokenDetail(Map.of()));
    }

    /** Observation, see {@link QueryExecutorContractTest}: the type checks of the {@code do...} methods are unchecked casts. */
    @Test
    public void aConfigOfTheWrongTypeFailsWithARawClassCastExceptionAtTheCallIntoThePlugin() {
        OtherConfig wrong = new OtherConfig();

        assertThrows(ClassCastException.class, () -> connector.doValidateConfig(wrong));
        assertThrows(ClassCastException.class, () -> connector.doTestConnection(wrong));
        assertThrows(ClassCastException.class, () -> connector.doCreateConnection(wrong));
    }
}
