package org.lowcoder.sdk.plugin.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.OtherConfig;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.OtherContext;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestConfig;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestContext;
import org.lowcoder.sdk.plugin.common.ConnectorTestTypes.TestExecutor;

import reactor.core.publisher.Mono;

/**
 * The default methods of {@link QueryExecutor}, which every plugin inherits: how a failure of the plugin's own method is
 * reported (kept when it already is a {@link PluginException} or {@link BizException}, coded otherwise), the default structure
 * and the default query-config sanitising.
 */
public class QueryExecutorContractTest {

    private final TestExecutor executor = new TestExecutor();
    private final TestConfig config = new TestConfig("h");

    @Test
    public void theContextIsBuiltByThePluginAndAFailureIsWrappedAsAQueryArgumentErrorUnlessItAlreadyIsACodedOne() {
        TestContext context = executor.doBuildQueryExecutionContext(config, Map.of(), Map.of(), null);
        assertEquals("select 1", context.sql);
        assertEquals("select 1", executor.buildQueryExecutionContextMono(config, Map.of(), Map.of(), null).block().sql);

        executor.build = () -> {
            throw new IllegalStateException("bad setting");
        };
        PluginException blocking = assertThrows(PluginException.class, () -> executor.doBuildQueryExecutionContext(config, Map.of(), Map.of(), null));
        PluginException reactive = assertThrows(PluginException.class, () -> executor.buildQueryExecutionContextMono(config, Map.of(), Map.of(), null).block());
        System.out.println("[QueryExecutorContractTest] wrapped: " + blocking.getError() + " " + blocking.getMessageKey() + ": " + blocking.getMessage());
        for (PluginException failure : List.of(blocking, reactive)) {
            assertEquals(PluginCommonError.INVALID_QUERY_SETTINGS, failure.getError());
            assertEquals("QUERY_ARGUMENT_ERROR", failure.getMessageKey());
            assertTrue(failure.getMessage().contains("bad setting"), failure.getMessage());
        }

        PluginException coded = new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, "QUERY_ARGUMENT_ERROR", "mine");
        executor.build = () -> {
            throw coded;
        };
        assertSame(coded, assertThrows(PluginException.class, () -> executor.doBuildQueryExecutionContext(config, Map.of(), Map.of(), null)));
        assertSame(coded, assertThrows(PluginException.class, () -> executor.buildQueryExecutionContextMono(config, Map.of(), Map.of(), null).block()));
    }

    @Test
    public void executionKeepsPluginAndBizExceptionsAndCodesEverythingElse() {
        QueryExecutionResult ok = executor.doExecuteQuery("c", new TestContext("select 2")).block();
        assertEquals("select 2", ok.getData());

        PluginException plugin = new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, "QUERY_ARGUMENT_ERROR", "p");
        BizException biz = new BizException(BizError.INVALID_PARAMETER, "FILE_NOT_EXIST");
        executor.execute = context -> Mono.error(plugin);
        assertSame(plugin, assertThrows(PluginException.class, () -> executor.doExecuteQuery("c", new TestContext("q")).block()));
        executor.execute = context -> Mono.error(biz);
        assertSame(biz, assertThrows(BizException.class, () -> executor.doExecuteQuery("c", new TestContext("q")).block()));
        executor.execute = context -> Mono.error(new IllegalStateException("db is down"));
        PluginException wrapped = assertThrows(PluginException.class, () -> executor.doExecuteQuery("c", new TestContext("q")).block());

        System.out.println("[QueryExecutorContractTest] execution error: " + wrapped.getError() + " " + wrapped.getMessageKey() + ": " + wrapped.getMessage());
        assertEquals(PluginCommonError.QUERY_EXECUTION_ERROR, wrapped.getError());
        assertEquals("QUERY_EXECUTION_ERROR", wrapped.getMessageKey());
        assertTrue(wrapped.getMessage().contains("db is down"), wrapped.getMessage());
    }

    @Test
    public void theStructureIsEmptyByDefaultAndItsFailuresAreCodedExceptForPluginExceptions() {
        assertNull(executor.doGetStructure("c", config).block(), "the default has no structure");

        DatasourceStructure structure = new DatasourceStructure(List.of());
        executor.structure = Mono.just(structure);
        assertSame(structure, executor.doGetStructure("c", config).block());

        PluginException plugin = new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, "QUERY_ARGUMENT_ERROR", "p");
        executor.structure = Mono.error(plugin);
        assertSame(plugin, assertThrows(PluginException.class, () -> executor.doGetStructure("c", config).block()));
        executor.structure = Mono.error(new BizException(BizError.INVALID_PARAMETER, "FILE_NOT_EXIST"));
        PluginException wrapped = assertThrows(PluginException.class, () -> executor.doGetStructure("c", config).block());
        assertEquals("DATASOURCE_GET_STRUCTURE_ERROR", wrapped.getMessageKey(), "a BizException is not kept here, unlike in the execution");
        assertEquals(PluginCommonError.QUERY_EXECUTION_ERROR, wrapped.getError());
    }

    @Test
    public void theQueryConfigIsNotSanitisedByDefault() {
        Map<String, Object> queryConfig = Map.of("password", "secret");

        assertSame(queryConfig, executor.sanitizeQueryConfig(queryConfig));
    }

    /**
     * Observation (callers: only a datasource stored with a config of another type could reach it): the casts of the
     * generic parameters are unchecked, so the {@code catch (ClassCastException)} blocks of the {@code do...} methods never
     * run, and a config or context of the wrong type fails later, where the bridge method calls into the plugin. Building
     * the context wraps it (the call is inside the try / the Mono), the other entry points throw the raw ClassCastException.
     */
    @Test
    public void aConfigOrContextOfTheWrongTypeGivesACodedErrorOnlyWhereTheCallIsWrapped() {
        OtherConfig wrongConfig = new OtherConfig();

        PluginException built = assertThrows(PluginException.class, () -> executor.doBuildQueryExecutionContext(wrongConfig, Map.of(), Map.of(), null));
        PluginException builtMono = assertThrows(PluginException.class, () -> executor.buildQueryExecutionContextMono(wrongConfig, Map.of(), Map.of(), null).block());
        assertEquals("QUERY_ARGUMENT_ERROR", built.getMessageKey());
        assertEquals("QUERY_ARGUMENT_ERROR", builtMono.getMessageKey());
        assertInstanceOf(ClassCastException.class, assertThrows(ClassCastException.class, () -> executor.doGetStructure("c", wrongConfig)));
        assertInstanceOf(ClassCastException.class, assertThrows(ClassCastException.class, () -> executor.doExecuteQuery("c", new OtherContext())));
    }
}
