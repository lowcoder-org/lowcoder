package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.graphql.model.GraphQLQueryExecutionContext;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * Observed behaviour, not (yet) a confirmed defect (plan section 9 row "no variables key gives NPE at :140"; D-6): a
 * query config without the {@code variables} key fails in {@code buildQueryExecutionContext} with a raw
 * {@code NullPointerException}, because {@code GraphQLQueryConfig.getVariables()} returns null for a missing key
 * (GraphQLQueryConfig has no default and no {@code emptyIfNull} like its other lists) and
 * {@code queryConfig.getVariables().forEach} is called (GraphQLExecutor.java:141).
 *
 * <p>Reachability, read in the client: the GraphQL query form defines {@code variables: withDefault(VariablesControl,
 * [{ key: "", value: "" }])} (client/packages/lowcoder/src/comps/queries/httpQuery/graphqlQuery.tsx:80), so a query made
 * or loaded in the editor always carries the key, a list with a blank row at least, and deleting every row leaves an
 * empty list, not a missing key. The key can be missing only for a config that does not come from that form (an
 * application JSON written by hand or by another tool); the server does not default it. The existing
 * GraphQLResponseContractTest's comment says the same ("fails without the list").
 */
class GraphQLQueryConfigWithoutVariablesTest {

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    @Test
    void aQueryConfigWithoutVariablesFailsWithANullPointerExceptionAndOneWithAnEmptyListDoesNot() {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url("http://example.invalid/graphql").build();

        NullPointerException failure = assertThrows(NullPointerException.class,
                () -> support.buildContext(datasource, Map.of("body", GraphQLCallSupport.QUERY), GraphQLCallSupport.visitor(null, null)));
        GraphQLQueryExecutionContext context = support.buildContext(datasource,
                Map.of("body", GraphQLCallSupport.QUERY, "variables", List.of()), GraphQLCallSupport.visitor(null, null));

        System.out.println("[GraphQLQueryConfigWithoutVariablesTest] without the key: " + failure.getMessage());
        assertThat(failure.getMessage()).contains("getVariables()");
        assertThat(context.getVariablesParams().isEmpty()).isTrue();
    }
}
