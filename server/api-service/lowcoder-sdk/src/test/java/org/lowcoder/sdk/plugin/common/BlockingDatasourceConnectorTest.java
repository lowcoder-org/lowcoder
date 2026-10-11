package org.lowcoder.sdk.plugin.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestBlockingConnector;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestConfig;

/** {@link BlockingDatasourceConnector}: the blocking methods of a plugin run on the shared plugin scheduler, never on the caller's thread. */
public class BlockingDatasourceConnectorTest {

    private static final String SCHEDULER_THREAD_PREFIX = "plugin-executor";

    private final TestBlockingConnector connector = new TestBlockingConnector();

    @Test
    public void createTestAndDestroyRunOnThePluginSchedulerWithTheirArguments() {
        String connection = connector.createConnection(new TestConfig("db")).block();
        String createdOn = connector.threads.get("create");
        DatasourceTestResult result = connector.testConnection(new TestConfig("db")).block();
        connector.destroyConnection(connection).block();

        System.out.println("[BlockingDatasourceConnectorTest] threads " + connector.threads);
        assertEquals("blocking:db", connection);
        assertTrue(result.isSuccess());
        assertEquals("blocking:db", connector.given.get("destroy"));
        assertEquals("blocking:db", connector.given.get("test"), "the test creates its own connection with the same config");
        assertTrue(createdOn.startsWith(SCHEDULER_THREAD_PREFIX), "create ran on " + createdOn);
        for (String name : new String[] {"create", "test", "destroy"}) {
            assertTrue(connector.threads.get(name).startsWith(SCHEDULER_THREAD_PREFIX), name + " ran on " + connector.threads.get(name));
            assertTrue(!connector.threads.get(name).equals(Thread.currentThread().getName()));
        }
    }

    @Test
    public void aFailureInsideABlockingMethodIsAnErrorSignalNotAThrowOnTheCaller() {
        IllegalStateException failure = new IllegalStateException("blocked");
        connector.failure = failure;

        assertSame(failure, assertThrows(IllegalStateException.class, () -> connector.createConnection(new TestConfig("db")).block()));
        assertSame(failure, assertThrows(IllegalStateException.class, () -> connector.testConnection(new TestConfig("db")).block()));
        assertSame(failure, assertThrows(IllegalStateException.class, () -> connector.destroyConnection("c").block()));
    }
}
