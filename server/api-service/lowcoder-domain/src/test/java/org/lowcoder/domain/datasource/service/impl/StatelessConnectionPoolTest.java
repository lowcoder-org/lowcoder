package org.lowcoder.domain.datasource.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.StatelessDatasourceConnectionHolder;

import reactor.test.StepVerifier;

/** {@code StatelessConnectionPool} (unit U5, task L3-5): nothing to cache, nothing to invalidate. */
class StatelessConnectionPoolTest {

    /** Catches a stateless datasource getting a stateful holder: a holder is handed out, its errors do nothing, info is unsupported. */
    @Test
    void getOrCreateConnection_returnsAStatelessHolder_whoseErrorsAreIgnored_andInfoIsUnsupported() {
        StatelessConnectionPool pool = new StatelessConnectionPool();
        Datasource datasource = Datasource.builder().id("L3-5-stateless").type("restApi").build();

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .assertNext(holder -> {
                    assertThat(holder).isInstanceOf(StatelessDatasourceConnectionHolder.class);
                    assertThat(holder.connection()).isNotNull();
                    holder.onQueryError(new IllegalStateException("ignored"));
                })
                .verifyComplete();

        DatasourceConnectionHolder first = pool.getOrCreateConnection(datasource).block();
        DatasourceConnectionHolder second = pool.getOrCreateConnection(datasource).block();
        assertThat(first.connection()).as("the shared constant connection object").isSameAs(second.connection());
        assertThatThrownBy(() -> pool.info("L3-5-stateless")).isInstanceOf(UnsupportedOperationException.class);
        System.out.println("[StatelessConnectionPoolTest] stateless holder, constant connection, info unsupported");
    }
}
