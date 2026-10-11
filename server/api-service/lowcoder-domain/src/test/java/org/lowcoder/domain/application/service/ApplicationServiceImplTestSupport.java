package org.lowcoder.domain.application.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.mockito.Mockito;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Shared set-up of the ApplicationServiceImpl tests (task L3-12): a repository mock whose unstubbed Flux/Mono methods complete
 * empty (a plain mock returns null, which the service would fail on before the branch under test), and helpers to build
 * applications and to count how often a repository answer was subscribed to (a query that was built but never subscribed is
 * not run: switchIfEmpty only subscribes its fallback when needed). The class is not Spring-managed, so the
 * {@code @NonEmptyMono} aspect on the filter methods is not applied: the tests see the unadvised behaviour.
 */
final class ApplicationServiceImplTestSupport {

    final ApplicationRepository repository = Mockito.mock(ApplicationRepository.class, invocation -> {
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
    final UserRepository userRepository = Mockito.mock(UserRepository.class);
    final ApplicationRecordService applicationRecordService = Mockito.mock(ApplicationRecordService.class);
    final ApplicationServiceImpl service;

    ApplicationServiceImplTestSupport() {
        Mockito.when(applicationRecordService.getLatestRecordByApplicationId(Mockito.anyString())).thenReturn(Mono.empty());
        service = new ApplicationServiceImpl(mongoUpsertHelper, resourcePermissionService, repository, userRepository,
                applicationRecordService);
    }

    static Application app(String id, Map<String, Object> editingDsl) {
        Application application = Application.builder().editingApplicationDSL(editingDsl).build();
        application.setId(id);
        return application;
    }

    static Application app(String id) {
        return app(id, new HashMap<>());
    }

    static Application appWithGid(String id, String gid) {
        Application application = Application.builder().gid(gid).editingApplicationDSL(new HashMap<>()).build();
        application.setId(id);
        return application;
    }

    /** A DSL that embeds the given applications as modules (ApplicationUtil.getDependentModulesFromDsl reads compType module / comp.appId). */
    static Map<String, Object> dslWithModules(String... moduleIds) {
        List<Object> items = new java.util.ArrayList<>();
        for (String moduleId : moduleIds) {
            Map<String, Object> comp = new HashMap<>();
            comp.put("appId", moduleId);
            Map<String, Object> item = new HashMap<>();
            item.put("compType", "module");
            item.put("comp", comp);
            items.add(item);
        }
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("ui", Map.of("items", items));
        return dsl;
    }

    static ApplicationVersion version(Map<String, Object> dsl) {
        return ApplicationVersion.builder().applicationDSL(dsl).build();
    }

    /** The answer, counting every subscription to it in the returned counter. */
    static <T> Flux<T> counted(Flux<T> flux, AtomicInteger subscriptions) {
        return flux.doOnSubscribe(s -> subscriptions.incrementAndGet());
    }

    static <T> Mono<T> counted(Mono<T> mono, AtomicInteger subscriptions) {
        return mono.doOnSubscribe(s -> subscriptions.incrementAndGet());
    }

    static Collection<String> ids(String... ids) {
        return List.of(ids);
    }
}
