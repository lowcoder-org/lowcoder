package org.lowcoder.infra.serverlog;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Range;
import org.springframework.data.mongodb.core.ReactiveFindOperation.ReactiveFind;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactory;

import reactor.core.publisher.Mono;

/**
 * The Mongo query Spring Data derives from {@link ServerLogRepository#countByOrgIdAndCreateTimeBetween}: the repository
 * is built by {@link ReactiveMongoRepositoryFactory} on {@link Proxy} fakes of the operations and of the find chain,
 * which record the query handed to {@code matching}. BF-104: the range's bounds become {@code $gte} and {@code $lt},
 * where two plain values would give {@code $gt} and {@code $lt}.
 * <p>
 * Limits: no database runs; this pins the query document, not what a server returns for it.
 */
class ServerLogRepositoryQueryTest {

    private static final String ORG_ID = "org-1";
    private static final long START = 1_000L;
    private static final long END = 2_000L;
    private static final long COUNT = 5L;
    private static final String MATCHING = "matching";
    private static final String COUNT_METHOD = "count";

    @Test
    void aRightOpenRangeIsQueriedFromItsStartInclusiveToItsEndExclusiveBF104() {
        List<Query> queries = new ArrayList<>();
        ServerLogRepository repository = new ReactiveMongoRepositoryFactory(operations(queries)).getRepository(ServerLogRepository.class);

        Long count = repository.countByOrgIdAndCreateTimeBetween(ORG_ID, Range.rightOpen(START, END)).block();

        assertThat(queries).hasSize(1);
        Document filter = queries.get(0).getQueryObject();
        System.out.println("[ServerLogRepositoryQueryTest] derived filter " + filter.toJson() + " (BF-104)");
        assertThat(count).isEqualTo(COUNT);
        assertThat(filter.get("orgId")).isEqualTo(ORG_ID);
        assertThat(filter.get("createTime", Document.class)).containsExactlyInAnyOrderEntriesOf(new Document("$gte", START).append("$lt", END));
    }

    /** Operations whose converter maps {@link ServerLog} and whose {@code query} answers a find chain recording the query. */
    private static ReactiveMongoOperations operations(List<Query> queries) {
        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, new MongoMappingContext());
        converter.afterPropertiesSet();
        Object find = Proxy.newProxyInstance(ServerLogRepositoryQueryTest.class.getClassLoader(), new Class<?>[]{ReactiveFind.class},
                (proxy, method, args) -> {
                    if (MATCHING.equals(method.getName()) && args[0] instanceof Query query) {
                        queries.add(query);
                    }
                    if (COUNT_METHOD.equals(method.getName())) {
                        return Mono.just(COUNT);
                    }
                    if (method.getReturnType().isInstance(proxy)) {
                        return proxy;
                    }
                    throw new UnsupportedOperationException(method.getName());
                });
        return (ReactiveMongoOperations) Proxy.newProxyInstance(ServerLogRepositoryQueryTest.class.getClassLoader(),
                new Class<?>[]{ReactiveMongoOperations.class}, (proxy, method, args) -> switch (method.getName()) {
                    case "getConverter" -> converter;
                    case "query" -> find;
                    // the query is built with the other fluent operations ready (update, remove, ...); none of them runs
                    default -> method.getReturnType().isInterface() ? unused(method.getReturnType()) : null;
                });
    }

    /** A fluent operation the count does not run: each call answers the operation itself, or null. */
    private static Object unused(Class<?> type) {
        return Proxy.newProxyInstance(ServerLogRepositoryQueryTest.class.getClassLoader(), new Class<?>[]{type},
                (proxy, method, args) -> method.getReturnType().isInstance(proxy) ? proxy : null);
    }
}
