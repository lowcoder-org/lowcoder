package org.lowcoder.api.misc;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.localcache.ReloadableCache;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.ExchangeStrategies;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(NewUrl.JS_LIBRARY)
public class JsLibraryController implements JsLibraryEndpoints
{
    private static final String META_URL_TEMPLATE = "https://registry.npmjs.com/%s";
    private static final ConcurrentMap<String, ReloadableCache<JsLibraryMeta>> RECOMMENDED_JS_LIB_META_CACHE = new ConcurrentHashMap<>();
    private static final LoadingCache<String, Mono<JsLibraryMeta>> JS_LIB_META_CACHE = CacheBuilder.newBuilder()
            .maximumSize(1000)
            .expireAfterAccess(Duration.ofDays(1))
            .build(new CacheLoader<>() {
                @Override
                public Mono<JsLibraryMeta> load(@NotNull String key) {
                    return fetchOrNameOnly(key).cache();
                }
            });

    private static final ExchangeStrategies EXCHANGE_STRATEGY = ExchangeStrategies
            .builder()
            .codecs(configure -> configure.defaultCodecs().maxInMemorySize(-1))
            .build();

    /** The resource's {@code downloadUrl} of each recommended library, by name; read-only once the class is loaded. */
    private static final Map<String, String> RECOMMENDED_DOWNLOAD_URLS;

    static {
        Map<String, String> downloadUrls = new HashMap<>();
        try (InputStream is = JsLibraryController.class.getClassLoader().getResourceAsStream("recommendedJsLibraries.json")) {
            if (is != null) {
                String content = IOUtils.toString(is, Charset.defaultCharset());
                List<Map<String, Object>> recommendedJsLibraries = JsonUtils.fromJsonSafely(content, new TypeReference<>() {
                }, Collections.emptyList());
                Map<String, Map<String, Object>> recommendedJsLibraryMap = recommendedJsLibraries.stream()
                        .collect(Collectors.toMap(map -> MapUtils.getString(map, "name"), Function.identity()));
                recommendedJsLibraryMap.forEach((name, library) -> downloadUrls.put(name, MapUtils.getString(library, "downloadUrl")));

                log.info("find recommended js library names: {}", recommendedJsLibraryMap.keySet());
                for (String libName : recommendedJsLibraryMap.keySet()) {
                    ReloadableCache<JsLibraryMeta> reloadableCache = ReloadableCache.<JsLibraryMeta> newBuilder()
                            .setName(libName)
                            .setInterval(Duration.ofDays(1))
                            .setFactory(() -> fetch(libName)
                                    .doOnNext(jsLibraryMeta -> {
                                        Map<String, Object> map = recommendedJsLibraryMap.get(libName);
                                        jsLibraryMeta.setDownloadUrl(MapUtils.getString(map, "downloadUrl"));
                                    })
                                    .doOnNext(jsLibraryMeta -> log.info("reloaded recommended js library: {}", JsonUtils.toJson(jsLibraryMeta))))
                            .build();
                    RECOMMENDED_JS_LIB_META_CACHE.put(libName, reloadableCache);
                }
            }
        } catch (IOException e) {
            log.error("load recommended js library name error.", e);
        }
        RECOMMENDED_DOWNLOAD_URLS = Collections.unmodifiableMap(downloadUrls);
    }

    @Override
    public Mono<ResponseView<List<JsLibraryMeta>>> getRecommendationMetas() {
        return getMeta(RECOMMENDED_JS_LIB_META_CACHE.keySet());
    }

    @Override
    public Mono<ResponseView<List<JsLibraryMeta>>> getMeta(@RequestParam("name") Collection<String> names) {
        if (CollectionUtils.isEmpty(names)) {
            return Mono.just(ResponseView.success(Collections.emptyList()));
        }
        return Flux.fromIterable(names)
                .flatMap(name -> {
                    if (RECOMMENDED_JS_LIB_META_CACHE.containsKey(name)) {
                        return RECOMMENDED_JS_LIB_META_CACHE.get(name).getMonoValue()
                                .defaultIfEmpty(recommendedPlaceholder(name));
                    }
                    return JS_LIB_META_CACHE.getUnchecked(name)
                            .onErrorReturn(JsLibraryMeta.builder().name(name).build());
                })
                .collectList()
                .map(ResponseView::success);
    }

    /**
     * The answer for a recommended library with no cached value whose registry sent no document: its name and the
     * resource's {@code downloadUrl}. It is not cached, so the next request loads the library again (NEW-57: while the
     * registry sends nothing, every request for such a library asks it). Limit: a failed load is not answered with it;
     * the recommended branch has no {@code onErrorReturn}, so the whole request fails (NEW-56).
     */
    private static JsLibraryMeta recommendedPlaceholder(String name) {
        return JsLibraryMeta.builder()
                .name(name)
                .downloadUrl(RECOMMENDED_DOWNLOAD_URLS.get(name))
                .build();
    }

    /**
     * The registry's metadata of {@code name}, or empty when the registry sent no document: a non-2xx answer, or a
     * 2xx answer with no body or a JSON {@code null}. Empty rather than a name-only meta, so that a recommended
     * library's scheduled reload keeps the value it has (NEW-22). Limit: a 2xx document is trusted whatever it carries,
     * so one with none of the fields read here ({@code {}}) maps to the name alone, and a reload stores that (NEW-59):
     * in the response it cannot be told from a package that has no such metadata.
     */
    @SuppressWarnings("unchecked")
    private static Mono<JsLibraryMeta> fetch(String name) {
        log.info("fetch js library:{}", name);
        return WebClientBuildHelper.builder()
                .systemProxy()
                .toWebClientBuilder()
                .exchangeStrategies(EXCHANGE_STRATEGY)
                .build()
                .get()
                .uri(META_URL_TEMPLATE.formatted(name))
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                        });
                    }
                    return Mono.empty();
                })
                .map(map -> {
                    String description = MapUtils.getString(map, "description");
                    String homepage = MapUtils.getString(map, "homepage");
                    if (StringUtils.isBlank(homepage)) {
                        homepage = Optional.ofNullable((Map<String, Object>) MapUtils.getMap(map, "repository"))
                                .filter(repository -> "git".equals(MapUtils.getString(repository, "type")))
                                .map(repository -> MapUtils.getString(repository, "url"))
                                .map(url -> url.replaceFirst("git\\+", ""))
                                .orElse(null);
                    }
                    String latestVersion = Optional.ofNullable((Map<String, Object>) MapUtils.getMap(map, "dist-tags"))
                            .map(distTags -> MapUtils.getString(distTags, "latest"))
                            .orElse(null);
                    return JsLibraryMeta.builder()
                            .name(name)
                            .latestVersion(latestVersion)
                            .homepage(homepage)
                            .description(description)
                            .build();
                });
    }

    /** {@link #fetch}, answering the name alone when the registry sent no document: the per-name cache's loader. */
    private static Mono<JsLibraryMeta> fetchOrNameOnly(String name) {
        return fetch(name).defaultIfEmpty(JsLibraryMeta.builder().name(name).build());
    }

    @Data
    @Builder
    public static class JsLibraryMeta {
        private String name;
        private String latestVersion;
        private String homepage;
        private String description;
        private String downloadUrl;
    }
}
