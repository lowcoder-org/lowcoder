package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.cache.LoadingCache;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.MiscSamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.misc.JsLibraryController;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;
import org.lowcoder.api.misc.JsLibraryEndpoints;
import org.lowcoder.infra.localcache.ReloadableCache;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Codec-level tests of the 2 {@link JsLibraryEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §4.9, §5.2, task T7.2), through
 * the production {@link JsLibraryController}, which has no collaborator: it answers from two static caches, filled
 * from the npm registry ({@code JsLibraryController#fetch}, whose decoding the {@code js-library} group's
 * {@code JsLibraryFetchContractTest} pins). As §4.9 plans, the tests put their answers into those caches by reflection
 * and restore them afterwards:
 *
 * <ul>
 *   <li>the per-name cache ({@value #NAME_CACHE_FIELD}) gets {@code Mono.just(<S1 sample>)}, or a failing {@code Mono}
 *       for {@link #getMetaFetchFailed}, whose {@code onErrorReturn} answers the name alone;</li>
 *   <li>the recommended libraries' caches ({@value #RECOMMENDED_CACHE_FIELD}) are replaced by caches whose factory
 *       answers the S1 sample; {@code ReloadableCache#getMonoValue} calls the factory while no value is cached. The
 *       replacements are made without the cache's builder, which would start a reload thread per cache.</li>
 * </ul>
 *
 * <p>Every answer is a {@code ResponseView} around a list of {@link JsLibraryMeta}, each its S1 golden (or the S2
 * golden with the name set, for the name-only answer). Limit (§4.9): loading the class schedules fetches of the
 * recommended libraries from {@code registry.npmjs.com}; their results go to the replaced caches' predecessors, which
 * the tests do not read, so they cannot affect an assertion.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code pass-through} for both; the payload is the caches' values
 * in a list.
 */
class JsLibraryEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(JsLibraryEndpoints.class);
    static final String NAME_CACHE_FIELD = "JS_LIB_META_CACHE";
    static final String RECOMMENDED_CACHE_FIELD = "RECOMMENDED_JS_LIB_META_CACHE";
    static final String NAME_PARAMETER = "name";
    static final String LIBRARY = "jslibraryendpointscontracttest-library";
    static final String FAILING_LIBRARY = "jslibraryendpointscontracttest-failing";
    static final String NO_NAME = "";
    static final String NAME_PROPERTY = "name";
    static final String S2 = "S2";
    static final String FACTORY_FIELD = "factory";

    private Map<String, ReloadableCache<JsLibraryMeta>> recommendedBefore;

    @BeforeEach
    void rememberTheRecommendedCaches() {
        recommendedBefore = new HashMap<>(recommendedCaches());
    }

    @AfterEach
    void restoreTheCaches() {
        recommendedCaches().clear();
        recommendedCaches().putAll(recommendedBefore);
        nameCache().invalidateAll(List.of(LIBRARY, FAILING_LIBRARY));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(JsLibraryEndpointsContractTest.class);
    }

    /** One recommended library per cache, each answering the S1 sample. */
    @Test
    void getRecommendationMetas() {
        List<String> names = new ArrayList<>(recommendedCaches().keySet());
        names.forEach(name -> recommendedCaches().put(name, answering(MiscSamples.jsLibraryMeta())));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getRecommendationMetas", Map.of(), null);
            String meta = EndpointContract.s1(JsLibraryMeta.class);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(Collections.nCopies(names.size(), meta)
                    .toArray(String[]::new))));
            assertThat(names).as("the recommended libraries of recommendedJsLibraries.json").isNotEmpty();
        }
    }

    /** The {@code isEmpty(names)} branch: an empty {@code name} parameter answers an empty list. */
    @Test
    void getMetaWithoutNames() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getMeta", Map.of(NAME_PARAMETER, NO_NAME), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array()));
        }
    }

    /** A library that is not recommended: the per-name cache's value. */
    @Test
    void getMeta() {
        nameCache().put(LIBRARY, Mono.just(MiscSamples.jsLibraryMeta()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getMeta", Map.of(NAME_PARAMETER, LIBRARY), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(EndpointContract.s1(JsLibraryMeta.class))));
        }
    }

    /** A recommended library: its reloadable cache's value. */
    @Test
    void getMetaRecommended() {
        String recommended = recommendedCaches().keySet().iterator().next();
        recommendedCaches().put(recommended, answering(MiscSamples.jsLibraryMeta()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getMeta", Map.of(NAME_PARAMETER, recommended), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.array(EndpointContract.s1(JsLibraryMeta.class))));
        }
    }

    /** The {@code onErrorReturn} branch: a failed fetch answers a meta with the name only. */
    @Test
    void getMetaFetchFailed() throws IOException {
        nameCache().put(FAILING_LIBRARY, Mono.error(new IllegalStateException("JsLibraryEndpointsContractTest: the registry fails")));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getMeta", Map.of(NAME_PARAMETER, FAILING_LIBRARY), null);
            ObjectNode nameOnly = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.fixture(JsLibraryMeta.class, S2));
            nameOnly.put(NAME_PROPERTY, FAILING_LIBRARY);
            EndpointContract.assertResponse(result, HttpStatus.OK,
                    EndpointContract.success(EndpointContract.array(PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(nameOnly))));
        }
    }

    /**
     * A {@link ReloadableCache} with no cached value whose factory answers {@code meta}, made through its private
     * constructor: its builder would also start a scheduled reload thread, which nothing could stop afterwards.
     */
    @SuppressWarnings("unchecked")
    private static ReloadableCache<JsLibraryMeta> answering(JsLibraryMeta meta) {
        try {
            Constructor<?> constructor = ReloadableCache.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            ReloadableCache<JsLibraryMeta> cache = (ReloadableCache<JsLibraryMeta>) constructor.newInstance();
            Field factory = ReloadableCache.class.getDeclaredField(FACTORY_FIELD);
            factory.setAccessible(true);
            factory.set(cache, (ReloadableCache.CacheValueMonoProvider<JsLibraryMeta>) () -> Mono.just(meta));
            return cache;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("ReloadableCache has no private constructor or factory field", e);
        }
    }

    @SuppressWarnings("unchecked")
    static ConcurrentMap<String, ReloadableCache<JsLibraryMeta>> recommendedCaches() {
        return (ConcurrentMap<String, ReloadableCache<JsLibraryMeta>>) staticField(RECOMMENDED_CACHE_FIELD);
    }

    @SuppressWarnings("unchecked")
    static LoadingCache<String, Mono<JsLibraryMeta>> nameCache() {
        return (LoadingCache<String, Mono<JsLibraryMeta>>) staticField(NAME_CACHE_FIELD);
    }

    /** A private static field of {@link JsLibraryController}. */
    static Object staticField(String name) {
        try {
            Field field = JsLibraryController.class.getDeclaredField(name);
            field.setAccessible(true);
            return field.get(null);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("JsLibraryController has no readable static field " + name, e);
        }
    }

    private ContractTestClient client() {
        return ContractTestClient.builder().controllerWithMockedDependencies(JsLibraryController.class).build();
    }
}
