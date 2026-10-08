package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.graphql.model.GraphQLQueryConfig;
import org.lowcoder.plugin.graphql.model.GraphQLQueryExecutionContext;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;

/**
 * BF-161 (was pinned here as a raw {@code NullPointerException}; plan section 9 row "no variables key gives NPE at :140";
 * D-6): a query config without the {@code variables} key builds the same context as one with an empty list, because
 * {@code GraphQLQueryConfig.getVariables()} is empty for a missing key, as its other lists are. It returned null, and
 * {@code queryConfig.getVariables().forEach} in {@code GraphQLExecutor.buildQueryExecutionContext} threw.
 *
 * <p>Reachability, read in the client: the GraphQL query form defines {@code variables: withDefault(VariablesControl,
 * [{ key: "", value: "" }])} (client/packages/lowcoder/src/comps/queries/httpQuery/graphqlQuery.tsx:80), so a query made
 * or loaded in the editor always carries the key, a list with a blank row at least, and deleting every row leaves an
 * empty list, not a missing key. The key can be missing only for a config that does not come from that form (an
 * application JSON written by hand or by another tool).
 *
 * <p>Limits: the context is built, not sent; the request body with no variables is covered by the existing
 * request-body contract tests.
 */
class GraphQLQueryConfigWithoutVariablesTest {

    static final String URL = "http://example.invalid/graphql";
    static final String BODY_KEY = "body";
    /**
     * The query config's key. Not {@code GraphQLBodyUtils.VARIABLES_KEY}: that is the key of the outbound GraphQL body,
     * spelled the same but a different format.
     */
    static final String VARIABLES_KEY = "variables";
    static final String VARIABLE_NAME = "id";
    static final String VARIABLE_VALUE = "1";

    private final GraphQLCallSupport support = new GraphQLCallSupport();

    private GraphQLQueryExecutionContext build(Map<String, Object> queryConfig) {
        GraphQLDatasourceConfig datasource = GraphQLDatasourceConfig.builder().url(URL).build();
        return support.buildContext(datasource, queryConfig, GraphQLCallSupport.visitor(null, null));
    }

    /** BF-161: without the key the context has no variables, as with an empty list. Catches: the null list iterated again. */
    @Test
    void aQueryConfigWithoutVariablesBuildsLikeOneWithAnEmptyListBF161() {
        GraphQLQueryExecutionContext withoutKey = build(Map.of(BODY_KEY, GraphQLCallSupport.QUERY));
        GraphQLQueryExecutionContext emptyList = build(Map.of(BODY_KEY, GraphQLCallSupport.QUERY, VARIABLES_KEY, List.of()));

        System.out.println("[GraphQLQueryConfigWithoutVariablesTest] without the key: " + withoutKey.getVariablesParams()
                + ", with an empty list: " + emptyList.getVariablesParams());
        assertThat(withoutKey.getVariablesParams().isEmpty()).isTrue();
        assertThat(emptyList.getVariablesParams().isEmpty()).isTrue();
        assertThat(withoutKey.getQueryBody()).isEqualTo(emptyList.getQueryBody());
    }

    /** BF-161: the getter is empty, not null, for a missing key, and a given list is kept. */
    @Test
    void getVariablesIsEmptyForAMissingKeyBF161() {
        assertThat(GraphQLQueryConfig.from(Map.of(BODY_KEY, GraphQLCallSupport.QUERY)).getVariables()).isNotNull().isEmpty();
        List<Property> given = GraphQLQueryConfig.from(Map.of(BODY_KEY, GraphQLCallSupport.QUERY,
                VARIABLES_KEY, List.of(Map.of("key", VARIABLE_NAME, "value", VARIABLE_VALUE)))).getVariables();
        assertThat(given).hasSize(1);
        assertThat(given.get(0).getKey()).isEqualTo(VARIABLE_NAME);
        assertThat(given.get(0).getValue()).isEqualTo(VARIABLE_VALUE);
    }
}
