package org.lowcoder.sdk.plugin.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

import java.time.Duration;
import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestBlockingExecutor;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestConfig;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestContext;

/**
 * NEW-16 (T165): a {@link NoClassDefFoundError} raised by a plugin inside {@link BlockingQueryExecutor}'s two lambdas
 * used to reach nobody. Reactor treats every {@code LinkageError} as JVM-fatal and rethrows it instead of signalling
 * it, and because both methods carry {@code subscribeOn(querySharedScheduler())} the rethrow happens on a scheduler
 * worker, with no subscriber to tell: the request simply waited for its timeout. Both methods now catch that one error
 * and answer the error and message key their enclosing default method of {@link QueryExecutor} already answers for an
 * ordinary exception.
 *
 * <p>The missing-class tests fail at HEAD by timing out in {@code block(SHORT)} rather than by asserting a wrong value,
 * which is the hang itself seen from the outside. {@link #anOrdinaryFailureIsStillSignalledUnchanged} and
 * {@link #anotherLinkageErrorStaysFatalByChoice} pass at HEAD: they are the guards that the catch did not widen.
 *
 * <p>Limits: {@link #anotherLinkageErrorStaysFatalByChoice} pins only that no signal arrives within {@link #SHORT}, not
 * the reason for it; and nothing here covers the same pattern left unfixed elsewhere (connection creation, the query
 * context build, and the other plugin operations), which is finding NEW-54.
 */
public class BlockingQueryExecutorTest {

    /** Long enough that a signalled error always arrives, short enough that three hangs cost under a second. */
    private static final Duration SHORT = Duration.ofMillis(250);
    /** A class a driver could be missing; the text the error carries is what the answer must name. */
    private static final String MISSING_CLASS = "oracle.xdb.XMLType";
    private static final String MESSAGE_KEY = "QUERY_EXECUTION_ERROR";
    private static final String STRUCTURE_MESSAGE_KEY = "DATASOURCE_GET_STRUCTURE_ERROR";
    private static final String SQL = "select * from items";
    private static final String CONNECTION = "connection";

    private final TestBlockingExecutor executor = new TestBlockingExecutor();
    private final TestConfig config = new TestConfig("db");
    private final TestContext context = new TestContext(SQL);

    /** Catches: a missing class while a query runs answering nothing at all, so the request waits for its timeout. */
    @Test
    public void aMissingClassInAQueryBecomesAQueryExecutionErrorNEW16() {
        executor.queryFailure = new NoClassDefFoundError(MISSING_CLASS);

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.executeQuery(CONNECTION, context).block(SHORT));

        print("missing class in a query", thrown);
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertEquals(MESSAGE_KEY, thrown.getMessageKey());
        assertTrue(namesTheClass(thrown), "the answer must name the missing class, was " + Arrays.toString(thrown.getArgs()));
    }

    /** Catches: the same hang on the structure path, which shares the class and the scheduler. */
    @Test
    public void aMissingClassInGetStructureBecomesAQueryExecutionErrorNEW16() {
        executor.structureFailure = new NoClassDefFoundError(MISSING_CLASS);

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.getStructure(CONNECTION, config).block(SHORT));

        print("missing class in getStructure", thrown);
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertEquals(STRUCTURE_MESSAGE_KEY, thrown.getMessageKey(),
                "the structure path keeps its own message key, the one doGetStructure already uses");
        assertTrue(namesTheClass(thrown), "the answer must name the missing class, was " + Arrays.toString(thrown.getArgs()));
    }

    /** Catches: an error built without a message answering {@code null}, which would name nothing. */
    @Test
    public void aMissingClassWithoutAMessageIsStillAQueryExecutionError() {
        executor.queryFailure = new NoClassDefFoundError();

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.executeQuery(CONNECTION, context).block(SHORT));

        print("missing class without a message", thrown);
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertEquals(MESSAGE_KEY, thrown.getMessageKey());
        assertTrue(Arrays.toString(thrown.getArgs()).contains(NoClassDefFoundError.class.getName()),
                "a message-less error must still name its own class, was " + Arrays.toString(thrown.getArgs()));
    }

    /** The error survives the entry point the query service actually calls, rather than being rewrapped there. */
    @Test
    public void theQueryExecutorEntryPointKeepsTheCodedError() {
        executor.queryFailure = new NoClassDefFoundError(MISSING_CLASS);

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.doExecuteQuery(CONNECTION, context).block(SHORT));

        print("missing class through doExecuteQuery", thrown);
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertEquals(MESSAGE_KEY, thrown.getMessageKey());
        assertTrue(namesTheClass(thrown), "the answer must name the missing class, was " + Arrays.toString(thrown.getArgs()));
    }

    /** The same through the structure entry point, whose onErrorMap also keeps a PluginException as it is. */
    @Test
    public void theStructureEntryPointKeepsTheCodedError() {
        executor.structureFailure = new NoClassDefFoundError(MISSING_CLASS);

        PluginException thrown = assertThrows(PluginException.class,
                () -> executor.doGetStructure(CONNECTION, config).block(SHORT));

        print("missing class through doGetStructure", thrown);
        assertEquals(QUERY_EXECUTION_ERROR, thrown.getError());
        assertEquals(STRUCTURE_MESSAGE_KEY, thrown.getMessageKey());
        assertTrue(namesTheClass(thrown), "the answer must name the missing class, was " + Arrays.toString(thrown.getArgs()));
    }

    /** Guard: an ordinary failure was always signalled and must still arrive as the very same instance. */
    @Test
    public void anOrdinaryFailureIsStillSignalledUnchanged() {
        IllegalStateException failure = new IllegalStateException("plugin said no");
        executor.queryFailure = failure;
        executor.structureFailure = failure;

        IllegalStateException fromQuery = assertThrows(IllegalStateException.class,
                () -> executor.executeQuery(CONNECTION, context).block(SHORT));
        IllegalStateException fromStructure = assertThrows(IllegalStateException.class,
                () -> executor.getStructure(CONNECTION, config).block(SHORT));

        System.out.println("[BlockingQueryExecutorTest] ordinary failure: " + fromQuery + " / " + fromStructure);
        assertSame(failure, fromQuery, "the catch must not widen to ordinary exceptions");
        assertSame(failure, fromStructure, "the catch must not widen to ordinary exceptions");
    }

    /**
     * Guard: only {@code NoClassDefFoundError} is caught, by the decision recorded on the production class, so another
     * {@code LinkageError} still reaches nobody. What this pins is that no signal arrives within {@link #SHORT}; the
     * reason for the silence is not pinned here. Widening the catch to {@code LinkageError} makes this test fail, which
     * is how the decision can be seen and reversed.
     */
    @Test
    public void anotherLinkageErrorStaysFatalByChoice() {
        executor.queryFailure = new IncompatibleClassChangeError(MISSING_CLASS);

        IllegalStateException timedOut = assertThrows(IllegalStateException.class,
                () -> executor.executeQuery(CONNECTION, context).block(SHORT));

        System.out.println("[BlockingQueryExecutorTest] another LinkageError, nothing signalled within "
                + SHORT.toMillis() + " ms: " + timedOut.getMessage());
        assertTrue(timedOut.getMessage() != null && timedOut.getMessage().contains("Timeout"),
                "expected the blocking read to time out, got " + timedOut.getMessage());
    }

    private boolean namesTheClass(PluginException thrown) {
        return Arrays.toString(thrown.getArgs()).contains(MISSING_CLASS);
    }

    private void print(String what, PluginException thrown) {
        System.out.println("[BlockingQueryExecutorTest] " + what + " -> " + thrown.getError()
                + " " + thrown.getMessageKey() + " " + Arrays.toString(thrown.getArgs())
                + " rendered as: " + thrown.getMessage());
    }
}
