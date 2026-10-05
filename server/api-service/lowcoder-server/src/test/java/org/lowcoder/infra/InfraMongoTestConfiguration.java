package org.lowcoder.infra;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.lowcoder.infra.birelation.BiRelationServiceImpl;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.event.BeforeSaveEvent;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoReactiveAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoReactiveDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoReactiveRepositoriesAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.config.EnableReactiveMongoAuditing;
import org.springframework.data.domain.ReactiveAuditorAware;
import reactor.core.publisher.Mono;

/**
 * The narrow application context of the lowcoder-infra MongoDB tests: the reactive MongoDB auto-configuration, the
 * repositories of {@code org.lowcoder.infra.birelation}, auditing, and the two beans under test. Used with the profile
 * {@value #PROFILE}, so the context is built once for these tests and, through {@code TestContainersInitializer}, gets
 * a database of its own on the shared container.
 *
 * <p>Deliberately carries no stereotype annotation ({@code @Configuration}, {@code @TestConfiguration}): the server's
 * {@code ComponentScanConfiguration} scans all of {@code org.lowcoder} without a type filter and would add every such
 * class to the full-application tests. A class passed in {@code @SpringBootTest(classes=...)} is processed as a lite
 * configuration (its {@code @Import}, {@code @Enable...} and {@code @Bean} methods), which is all this needs.
 */
@ImportAutoConfiguration({MongoReactiveAutoConfiguration.class, MongoReactiveDataAutoConfiguration.class,
        MongoReactiveRepositoriesAutoConfiguration.class})
@org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories(basePackages = "org.lowcoder.infra.birelation")
@EnableReactiveMongoAuditing
@Import({MongoUpsertHelper.class, BiRelationServiceImpl.class})
public class InfraMongoTestConfiguration {

    public static final String PROFILE = "infraMongo";
    public static final String AUDITOR = "auditor-1";

    @Bean
    ReactiveAuditorAware<String> auditorProvider() {
        return () -> Mono.just(AUDITOR);
    }

    @Bean
    BeforeSaveRecorder beforeSaveRecorder() {
        return new BeforeSaveRecorder();
    }

    /** Collects the {@link BeforeSaveEvent}s that {@link MongoUpsertHelper#update} publishes. */
    public static class BeforeSaveRecorder {

        private final List<BeforeSaveEvent<?>> events = new CopyOnWriteArrayList<>();

        @EventListener
        void on(BeforeSaveEvent<?> event) {
            events.add(event);
        }

        public List<BeforeSaveEvent<?>> events() {
            return events;
        }
    }
}
