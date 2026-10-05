package org.lowcoder.domain.bundle.service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.mockito.Mockito;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Shared set-up of the BundleServiceImpl tests (task L3-12): a repository mock whose unstubbed Flux/Mono methods complete
 * empty, bundle builders and a subscription counter. Not Spring-managed: the {@code @NonEmptyMono} aspect is not applied.
 */
final class BundleServiceImplTestSupport {

    final BundleRepository repository = Mockito.mock(BundleRepository.class, invocation -> {
        Class<?> type = invocation.getMethod().getReturnType();
        if (type == Flux.class) {
            return Flux.empty();
        }
        if (type == Mono.class) {
            return Mono.empty();
        }
        return null;
    });
    final MongoUpsertHelper mongoUpsertHelper = Mockito.mock(MongoUpsertHelper.class);
    final ResourcePermissionService resourcePermissionService = Mockito.mock(ResourcePermissionService.class);
    final BundleServiceImpl service = new BundleServiceImpl(repository, mongoUpsertHelper, resourcePermissionService);

    static Bundle bundle(String id) {
        Bundle bundle = Bundle.builder().build();
        bundle.setId(id);
        return bundle;
    }

    static Bundle bundleWithGid(String id, String gid) {
        Bundle bundle = Bundle.builder().gid(gid).build();
        bundle.setId(id);
        return bundle;
    }

    static Bundle bundleWithEditingDsl(String id, Map<String, Object> dsl) {
        Bundle bundle = Bundle.builder().editingBundleDSL(dsl).build();
        bundle.setId(id);
        return bundle;
    }

    static Map<String, Object> dsl(String marker) {
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("marker", marker);
        return dsl;
    }

    static <T> Flux<T> counted(Flux<T> flux, AtomicInteger subscriptions) {
        return flux.doOnSubscribe(s -> subscriptions.incrementAndGet());
    }

    static <T> Mono<T> counted(Mono<T> mono, AtomicInteger subscriptions) {
        return mono.doOnSubscribe(s -> subscriptions.incrementAndGet());
    }
}
