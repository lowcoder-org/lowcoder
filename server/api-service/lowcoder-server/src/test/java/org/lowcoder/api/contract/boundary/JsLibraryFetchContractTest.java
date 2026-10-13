package org.lowcoder.api.contract.boundary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.cache.LoadingCache;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.misc.JsLibraryController;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;
import org.lowcoder.infra.localcache.ReloadableCache;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.destructor.DestructorUtil;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BooleanSupplier;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathMatching;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Group {@code js-library} of docs/API_PAYLOAD_TEST_PLAN.md §4.9 (task T7.2): {@link JsLibraryController} reads its
 * recommended libraries from {@code recommendedJsLibraries.json} with the production mapper when the class loads
 * ({@code JsonUtils.fromJsonSafely}), and decodes npm registry documents into {@code Map<String, Object>} with the
 * client codecs of a {@code WebClientBuildHelper} client ({@code bodyToMono}, the class's {@code EXCHANGE_STRATEGY}),
 * then maps a few fields into a {@link JsLibraryMeta}. Both sites run through their real code:
 *
 * <ul>
 *   <li>{@link #recommendedLibrariesFromTheResource}: the resource is read by the class's static initializer, the site
 *       of the first row, which runs when the class is first used and leaves its result in the recommended caches: one
 *       per library name, each with a factory that holds the library's resource entry. The test observes that result,
 *       not the call: the {@code @BoundarySites} claim is checked against the inventory, not reached (the gate does not
 *       prove reachability). The names of the caches must be the resource's, and so must the names and URLs of the
 *       class's download-URL map (T167, read by reflection and compared with the resource read as a tree),
 *       and each cache's own factory (read from the {@code ReloadableCache} by reflection) is run, so the
 *       {@code downloadUrl} the factory takes from the resource reaches the result; pinned in
 *       {@value #RECOMMENDED_FIXTURE};</li>
 *   <li>{@link #registryDocumentsDecodedAndMapped}: the private {@code fetch} on recorded registry documents
 *       ({@code boundary/js-library/registry.<case>.json}): a full one, one whose blank homepage falls back to its git
 *       repository, one without homepage, dist-tags or git repository, a 404 and a body that is not JSON; the metas
 *       (none for the 404, for which {@code fetch} completes empty: NEW-22), or the failure's class, are pinned in
 *       {@value #FETCH_FIXTURE}.</li>
 *   <li>{@link #goodMetadataSurvivesAReloadTheRegistrySendsNoDocumentForNEW22} and
 *       {@link #whatEachCacheLoadsForEachRegistryAnswerNEW22} (NEW-22, task T167): what the two caches load when the
 *       registry sends no document — through a scheduled reload of a recommended library's real factory, and for each
 *       registry answer through every recommended factory and the per-name cache's loader.</li>
 * </ul>
 *
 * <p>The client is built inline with a fixed {@code https://registry.npmjs.com/} URL, so {@link WebClientRedirect} sends
 * it to WireMock with its codecs unchanged, and the client must be built on the test thread: {@code fetch} and the
 * factories build it when called. Limits: the decoded map is not kept by production, so only the fields the mapping
 * reads are observed; a decoding change in other fields shows only if it breaks decoding. The class's scheduled
 * reloads, started when it loads, run on their own threads, outside the redirection; their results are not read here.
 */
@WireMockTest
class JsLibraryFetchContractTest {

    static final String RECOMMENDED_RESOURCE = "recommendedJsLibraries.json";
    static final String RECOMMENDED_FIXTURE = "boundary/js-library/recommended.json";
    static final String FETCH_FIXTURE = "boundary/js-library/fetch.json";
    static final String REGISTRY_INPUT = "boundary/js-library/registry.%s.json";
    static final String NOT_JSON_INPUT = "boundary/js-library/registry.not-json.txt";
    static final String FULL = "full";
    static final String REPOSITORY_HOMEPAGE = "repository-homepage";
    static final String NO_HOMEPAGE = "no-homepage";
    static final String NOT_FOUND = "not-found";
    static final String NOT_JSON = "not-json";
    static final List<String> DOCUMENTS = List.of(FULL, REPOSITORY_HOMEPAGE, NO_HOMEPAGE);
    static final String NAME_KEY = "name";
    static final String RECOMMENDED_CACHE_FIELD = "RECOMMENDED_JS_LIB_META_CACHE";
    static final String FACTORY_FIELD = "factory";
    static final String FETCH_METHOD = "fetch";
    static final String FAILS_WITH = "failsWith ";
    static final int OK = 200;
    static final int NOT_FOUND_STATUS = 404;
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final String NAME_CACHE_FIELD = "JS_LIB_META_CACHE";
    static final String DOWNLOAD_URLS_FIELD = "RECOMMENDED_DOWNLOAD_URLS";
    static final String DESTROY_CALLBACKS_FIELD = "destroyCallbacks";
    static final String DOWNLOAD_URL_KEY = "downloadUrl";
    static final int NO_CONTENT_STATUS = 204;
    static final String NULL_DOCUMENT = "null";
    static final String EMPTY_DOCUMENT = "{}";
    static final String ANSWER_NOT_FOUND = "404";
    static final String ANSWER_EMPTY_BODY = "200 with an empty body";
    static final String ANSWER_NO_CONTENT = "204";
    static final String ANSWER_NULL_DOCUMENT = "200 with a null document";
    static final String ANSWER_EMPTY_DOCUMENT = "200 with an empty document";
    /** Prefix of the per-name cache keys of {@link #whatEachCacheLoadsForEachRegistryAnswerNEW22}: no library is named so. */
    static final String UNLISTED_LIBRARY = "jslibraryfetchcontracttest-";
    static final Duration RELOAD_INTERVAL = Duration.ofMillis(20);
    static final Duration POLL_TIMEOUT = Duration.ofSeconds(5);
    static final long POLL_PAUSE_MILLIS = 5;
    /** {@code getCachedOrDefault}'s default (it rejects a null one): a meta with no field set, so no version. */
    static final JsLibraryMeta NOT_CACHED = JsLibraryMeta.builder().build();
    /** Reloads that must complete after the registry stops sending documents: one may have started before. */
    static final int RELOADS_AFTER_THE_OUTAGE = 2;

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/misc/JsLibraryController.java#JsLibraryController.<init>#fromJsonSafely#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/misc/JsLibraryController.java#JsLibraryController.fetch#bodyToMono#1"})
    @Test
    void recommendedLibrariesFromTheResource(WireMockRuntimeInfo wireMock) throws IOException, ReflectiveOperationException {
        wireMock.getWireMock().register(get(urlPathMatching("/.*")).willReturn(json(GOLDEN.read(REGISTRY_INPUT.formatted(FULL)))));
        Map<String, ReloadableCache<JsLibraryMeta>> caches = recommendedCaches();
        assertThat(new TreeSet<>(caches.keySet())).as("the recommended caches are the libraries of " + RECOMMENDED_RESOURCE)
                .isEqualTo(resourceNames());
        assertThat(recommendedDownloadUrls()).as("the download URLs of the recommended libraries are those of " + RECOMMENDED_RESOURCE)
                .isEqualTo(resourceDownloadUrls());
        List<JsLibraryMeta> metas = new ArrayList<>();
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            for (String name : new TreeSet<>(caches.keySet())) {
                JsLibraryMeta meta = factoryOf(caches.get(name)).getValue().block(BLOCK_TIMEOUT);
                System.out.println("[JsLibraryFetchContractTest] recommended " + name + " -> " + MAPPER.writeValueAsString(meta));
                metas.add(meta);
            }
        }
        GOLDEN.assertJson(RECOMMENDED_FIXTURE, MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(metas));
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/misc/JsLibraryController.java#JsLibraryController.fetch#bodyToMono#1")
    @Test
    void registryDocumentsDecodedAndMapped(WireMockRuntimeInfo wireMock) throws IOException {
        for (String document : DOCUMENTS) {
            wireMock.getWireMock().register(get(urlPathEqualTo("/" + document)).willReturn(json(GOLDEN.read(REGISTRY_INPUT.formatted(document)))));
        }
        wireMock.getWireMock().register(get(urlPathEqualTo("/" + NOT_FOUND)).willReturn(aResponse().withStatus(NOT_FOUND_STATUS)));
        wireMock.getWireMock().register(get(urlPathEqualTo("/" + NOT_JSON)).willReturn(json(GOLDEN.read(NOT_JSON_INPUT))));
        Map<String, Object> outcomes = new LinkedHashMap<>();
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            List<String> cases = new ArrayList<>(DOCUMENTS);
            cases.add(NOT_FOUND);
            cases.add(NOT_JSON);
            for (String name : cases) {
                Object outcome;
                try {
                    outcome = fetch(name).block(BLOCK_TIMEOUT);
                } catch (RuntimeException e) {
                    outcome = FAILS_WITH + e.getClass().getName();
                }
                System.out.println("[JsLibraryFetchContractTest] fetch " + name + " -> " + MAPPER.writeValueAsString(outcome));
                outcomes.put(name, outcome);
            }
        }
        GOLDEN.assertJson(FETCH_FIXTURE, MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(outcomes));
    }

    /**
     * NEW-22: a recommended library's good metadata survives a scheduled reload for which the registry sends no
     * document. The library's real factory, read from its production cache, is wrapped in one that opens the
     * {@link WebClientRedirect} on the thread that calls it (the reload thread; the redirection is thread-local) and is
     * scheduled by a {@link ReloadableCache} of this test. Once the full document is cached the registry answers 404;
     * after two further reloads have completed (one may have started before the 404 stub), the cached metadata must be
     * the full document's. The wrapper counts completed calls rather than empty ones, so the test behaves the same
     * whatever the factory emits.
     *
     * <p>Only this test's reload executor is stopped, through the one {@code DestructorUtil} callback its
     * {@code build()} registered: {@code DestructorUtil.onDestroy()} would also stop the production recommended caches'
     * executors for every later test class. Limits: the callback is found by comparing the callback queue before and
     * after {@code build()}, so another registration in between fails the exactly-one assertion rather than being
     * prevented; only the 404 answer is driven through the scheduled path ({@link
     * #whatEachCacheLoadsForEachRegistryAnswerNEW22} pins the others at the factory).
     */
    @Test
    void goodMetadataSurvivesAReloadTheRegistrySendsNoDocumentForNEW22(WireMockRuntimeInfo wireMock) throws Exception {
        wireMock.getWireMock().register(get(urlPathMatching("/.*")).willReturn(json(GOLDEN.read(REGISTRY_INPUT.formatted(FULL)))));
        Map<String, ReloadableCache<JsLibraryMeta>> caches = recommendedCaches();
        String library = caches.keySet().iterator().next();
        ReloadableCache.CacheValueMonoProvider<JsLibraryMeta> production = factoryOf(caches.get(library));
        String base = wireMock.getHttpBaseUrl();
        AtomicInteger completed = new AtomicInteger();
        List<String> outcomes = Collections.synchronizedList(new ArrayList<>());
        ReloadableCache.CacheValueMonoProvider<JsLibraryMeta> redirected = () -> {
            try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(base)) {
                JsLibraryMeta meta = production.getValue().block(BLOCK_TIMEOUT);
                outcomes.add(String.valueOf(meta));
                completed.incrementAndGet();
                return meta == null ? Mono.empty() : Mono.just(meta);
            }
        };
        Queue<?> callbacks = destroyCallbacks();
        Set<Object> registeredBefore = Collections.newSetFromMap(new IdentityHashMap<>());
        registeredBefore.addAll(callbacks);
        ReloadableCache<JsLibraryMeta> cache = ReloadableCache.<JsLibraryMeta>newBuilder()
                .setName("JsLibraryFetchContractTest-" + library)
                .setInterval(RELOAD_INTERVAL)
                .setFactory(redirected)
                .build();
        List<Object> registeredByBuild = callbacks.stream().filter(callback -> !registeredBefore.contains(callback)).map(Object.class::cast).toList();
        try {
            assertThat(registeredByBuild).as("DestructorUtil callbacks registered by this test's build()").hasSize(1);
            awaitTrue("the full document cached for " + library, completed, outcomes,
                    () -> cache.getCachedOrDefault(NOT_CACHED).getLatestVersion() != null);
            JsLibraryMeta good = cache.getCachedOrDefault(NOT_CACHED);
            System.out.println("[JsLibraryFetchContractTest] cached before the outage: " + good);

            wireMock.getWireMock().resetMappings();
            wireMock.getWireMock().register(get(urlPathMatching("/.*")).willReturn(aResponse().withStatus(NOT_FOUND_STATUS)));
            int completedAtTheOutage = completed.get();
            awaitTrue(RELOADS_AFTER_THE_OUTAGE + " reloads completed after the 404 stub", completed, outcomes,
                    () -> completed.get() >= completedAtTheOutage + RELOADS_AFTER_THE_OUTAGE);
            JsLibraryMeta cached = cache.getCachedOrDefault(NOT_CACHED);
            System.out.println("[JsLibraryFetchContractTest] reload outcomes " + outcomes);
            System.out.println("[JsLibraryFetchContractTest] cached after the outage: " + cached);
            assertThat(cached).as("the cached metadata of " + library + " after reloads the registry answered 404").isNotSameAs(NOT_CACHED);
            assertThat(cached.getLatestVersion()).as("latestVersion kept").isEqualTo(good.getLatestVersion());
            assertThat(cached.getHomepage()).as("homepage kept").isEqualTo(good.getHomepage());
            assertThat(cached.getDescription()).as("description kept").isEqualTo(good.getDescription());
        } finally {
            for (Object callback : registeredByBuild) {
                ((Runnable) ((Pair<?, ?>) callback).getLeft()).run();
            }
        }
    }

    /**
     * NEW-22: for each registry answer, what every recommended cache's factory and the per-name cache's loader give.
     * The four answers carrying no document (404, a 200 with an empty body, 204, a 200 whose document is {@code null})
     * leave the factory empty, so a reload keeps the cached value, while the loader answers the name alone. A 200 with
     * {@code {}} is a document: both map it to the name alone, the factory with the resource's {@code downloadUrl}
     * (NEW-59, recorded, not fixed). Each answer loads its own per-name key and invalidates it, because the per-name
     * cache keeps the loader's {@code Mono}: a shared key would be loaded once.
     */
    @Test
    void whatEachCacheLoadsForEachRegistryAnswerNEW22(WireMockRuntimeInfo wireMock) throws Exception {
        Map<String, ResponseDefinitionBuilder> answers = new LinkedHashMap<>();
        answers.put(ANSWER_NOT_FOUND, aResponse().withStatus(NOT_FOUND_STATUS));
        answers.put(ANSWER_EMPTY_BODY, aResponse().withStatus(OK).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE));
        answers.put(ANSWER_NO_CONTENT, aResponse().withStatus(NO_CONTENT_STATUS));
        answers.put(ANSWER_NULL_DOCUMENT, json(NULL_DOCUMENT));
        answers.put(ANSWER_EMPTY_DOCUMENT, json(EMPTY_DOCUMENT));
        Map<String, ReloadableCache<JsLibraryMeta>> caches = recommendedCaches();
        Map<String, String> downloadUrls = resourceDownloadUrls();
        LoadingCache<String, Mono<JsLibraryMeta>> nameCache = nameCache();
        Map<String, String> expected = new LinkedHashMap<>();
        Map<String, String> actual = new LinkedHashMap<>();
        List<String> loadedKeys = new ArrayList<>();
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(wireMock.getHttpBaseUrl())) {
            for (Map.Entry<String, ResponseDefinitionBuilder> answer : answers.entrySet()) {
                wireMock.getWireMock().resetMappings();
                wireMock.getWireMock().register(get(urlPathMatching("/.*")).willReturn(answer.getValue()));
                boolean document = ANSWER_EMPTY_DOCUMENT.equals(answer.getKey());
                for (String library : caches.keySet()) {
                    String row = answer.getKey() + ", factory of " + library;
                    JsLibraryMeta meta = factoryOf(caches.get(library)).getValue().block(BLOCK_TIMEOUT);
                    actual.put(row, MAPPER.writeValueAsString(meta));
                    expected.put(row, document
                            ? MAPPER.writeValueAsString(JsLibraryMeta.builder().name(library).downloadUrl(downloadUrls.get(library)).build())
                            : MAPPER.writeValueAsString(null));
                }
                String key = UNLISTED_LIBRARY + loadedKeys.size();
                loadedKeys.add(key);
                String row = answer.getKey() + ", loader of " + key;
                JsLibraryMeta onDemand = nameCache.getUnchecked(key).block(BLOCK_TIMEOUT);
                nameCache.invalidate(key);
                actual.put(row, MAPPER.writeValueAsString(onDemand));
                expected.put(row, MAPPER.writeValueAsString(JsLibraryMeta.builder().name(key).build()));
            }
        } finally {
            nameCache.invalidateAll(loadedKeys);
        }
        actual.forEach((row, outcome) -> System.out.println("[JsLibraryFetchContractTest] " + row + " -> " + outcome
                + (outcome.equals(expected.get(row)) ? "" : "   (expected " + expected.get(row) + ")")));
        assertThat(actual).as("what each cache loads for each registry answer").isEqualTo(expected);
    }

    private static ResponseDefinitionBuilder json(String body) {
        return aResponse().withStatus(OK).withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).withBody(body);
    }

    /** The library names of the production resource, read as a tree (not as {@code JsLibraryController} reads it). */
    private static TreeSet<String> resourceNames() throws IOException {
        try (InputStream resource = JsLibraryController.class.getClassLoader().getResourceAsStream(RECOMMENDED_RESOURCE)) {
            assertThat(resource).as(RECOMMENDED_RESOURCE).isNotNull();
            TreeSet<String> names = new TreeSet<>();
            for (JsonNode library : new ObjectMapper().readTree(new String(resource.readAllBytes(), StandardCharsets.UTF_8))) {
                names.add(library.path(NAME_KEY).asText());
            }
            return names;
        }
    }

    /** The {@code downloadUrl} of each library of the production resource, read as a tree. */
    private static TreeMap<String, String> resourceDownloadUrls() throws IOException {
        try (InputStream resource = JsLibraryController.class.getClassLoader().getResourceAsStream(RECOMMENDED_RESOURCE)) {
            assertThat(resource).as(RECOMMENDED_RESOURCE).isNotNull();
            TreeMap<String, String> urls = new TreeMap<>();
            for (JsonNode library : new ObjectMapper().readTree(new String(resource.readAllBytes(), StandardCharsets.UTF_8))) {
                JsonNode url = library.path(DOWNLOAD_URL_KEY);
                urls.put(library.path(NAME_KEY).asText(), url.isTextual() ? url.asText() : null);
            }
            return urls;
        }
    }

    /** Polls {@code condition} until {@link #POLL_TIMEOUT}; the failure names the wait, the completed calls and their outcomes. */
    private static void awaitTrue(String what, AtomicInteger completed, List<String> outcomes, BooleanSupplier condition)
            throws InterruptedException {
        long deadline = System.nanoTime() + POLL_TIMEOUT.toNanos();
        while (!condition.getAsBoolean()) {
            if (System.nanoTime() > deadline) {
                throw new AssertionError("timed out after " + POLL_TIMEOUT + " waiting for " + what + "; completed calls "
                        + completed.get() + ", outcomes " + outcomes);
            }
            Thread.sleep(POLL_PAUSE_MILLIS);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, ReloadableCache<JsLibraryMeta>> recommendedCaches() throws ReflectiveOperationException {
        Field field = JsLibraryController.class.getDeclaredField(RECOMMENDED_CACHE_FIELD);
        field.setAccessible(true);
        return new TreeMap<>((Map<String, ReloadableCache<JsLibraryMeta>>) field.get(null));
    }

    @SuppressWarnings("unchecked")
    private static ReloadableCache.CacheValueMonoProvider<JsLibraryMeta> factoryOf(ReloadableCache<JsLibraryMeta> cache)
            throws ReflectiveOperationException {
        Field field = ReloadableCache.class.getDeclaredField(FACTORY_FIELD);
        field.setAccessible(true);
        return (ReloadableCache.CacheValueMonoProvider<JsLibraryMeta>) field.get(cache);
    }

    @SuppressWarnings("unchecked")
    private static LoadingCache<String, Mono<JsLibraryMeta>> nameCache() throws ReflectiveOperationException {
        Field field = JsLibraryController.class.getDeclaredField(NAME_CACHE_FIELD);
        field.setAccessible(true);
        return (LoadingCache<String, Mono<JsLibraryMeta>>) field.get(null);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> recommendedDownloadUrls() throws ReflectiveOperationException {
        Field field = JsLibraryController.class.getDeclaredField(DOWNLOAD_URLS_FIELD);
        field.setAccessible(true);
        return (Map<String, String>) field.get(null);
    }

    /** {@code DestructorUtil}'s private callback queue, the only handle on a {@code ReloadableCache}'s reload executor. */
    private static Queue<?> destroyCallbacks() throws ReflectiveOperationException {
        Field field = DestructorUtil.class.getDeclaredField(DESTROY_CALLBACKS_FIELD);
        field.setAccessible(true);
        return (Queue<?>) field.get(null);
    }

    /** {@code JsLibraryController#fetch(name)}, the private static method. */
    @SuppressWarnings("unchecked")
    private static Mono<JsLibraryMeta> fetch(String name) {
        try {
            Method fetch = JsLibraryController.class.getDeclaredMethod(FETCH_METHOD, String.class);
            fetch.setAccessible(true);
            return (Mono<JsLibraryMeta>) fetch.invoke(null, name);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("JsLibraryController has no private static fetch(String)", e);
        }
    }
}
