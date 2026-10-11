package org.lowcoder.api.contract.boundary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.misc.JsLibraryController;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;
import org.lowcoder.infra.localcache.ReloadableCache;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

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
 *       prove reachability). The names of the caches must be the resource's,
 *       and each cache's own factory (read from the {@code ReloadableCache} by reflection) is run, so the
 *       {@code downloadUrl} the factory takes from the resource reaches the result; pinned in
 *       {@value #RECOMMENDED_FIXTURE};</li>
 *   <li>{@link #registryDocumentsDecodedAndMapped}: the private {@code fetch} on recorded registry documents
 *       ({@code boundary/js-library/registry.<case>.json}): a full one, one whose blank homepage falls back to its git
 *       repository, one without homepage, dist-tags or git repository, a 404 and a body that is not JSON; the metas,
 *       or the failure's class, are pinned in {@value #FETCH_FIXTURE}.</li>
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
