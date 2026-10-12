package org.lowcoder.api.application.marketplace;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import java.time.Instant;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;

/** Uses an isolated disposable database; run with LOWCODER_PREVIEW_TEST_MONGO_URI. */
@EnabledIfEnvironmentVariable(named = "LOWCODER_PREVIEW_TEST_MONGO_URI", matches = ".+")
class MarketplacePreviewMongoTest {
    private MongoClient client;
    private ReactiveMongoTemplate mongo;
    private MarketplacePreviewStore store;

    @BeforeEach void setup() {
        client = MongoClients.create(System.getenv("LOWCODER_PREVIEW_TEST_MONGO_URI"));
        mongo = new ReactiveMongoTemplate(client, "preview_test_" + UUID.randomUUID().toString().replace("-", ""));
        store = new MarketplacePreviewStore(mongo);
        store.ensureIndex().block();
    }
    @AfterEach void cleanup() {
        mongo.getMongoDatabase().flatMap(db -> reactor.core.publisher.Mono.from(db.drop())).block();
        client.close();
    }
    @Test void competingWorkersClaimExactlyOnceAndRestartsReusePersistedImage() {
        Flux.range(0, 20).flatMap(i -> store.desire("app", "v1")).then().block();
        var claims = Flux.range(0, 20).flatMap(i -> new MarketplacePreviewStore(mongo).claim(Instant.now())).collectList().block();
        assertEquals(1, claims.size());
        store.complete(claims.get(0), new byte[]{1, 2, 3}).block();
        var restarted = new MarketplacePreviewStore(mongo);
        restarted.desire("app", "v1").block();
        assertArrayEquals(new byte[]{1, 2, 3}, restarted.read("app").block().getImage());
        assertNull(restarted.claim(Instant.now().plusSeconds(86400)).block());
    }
    @Test void changedVersionRetainsLastImageAndFencesOldWorkers() {
        store.desire("app", "v1").block();
        var old = store.claim(Instant.now()).block();
        store.complete(old, new byte[]{1}).block();
        store.desire("app", "v2").block();
        var current = store.claim(Instant.now()).block();
        assertArrayEquals(new byte[]{1}, store.read("app").block().getImage());
        store.complete(old, new byte[]{9}).block();
        store.fail(old, false).block();
        store.complete(current, new byte[]{2}).block();
        assertArrayEquals(new byte[]{2}, store.read("app").block().getImage());
        assertEquals("v2", store.read("app").block().getRenderedHash());
    }
    @Test void expiredLeaseCanBeRecoveredButOldOwnerCannotComplete() {
        store.desire("app", "v1").block();
        var abandoned = store.claim(Instant.now()).block();
        mongo.updateFirst(Query.query(Criteria.where("_id").is("app")),
                new Update().set("leaseUntil", Instant.EPOCH), MarketplacePreview.class).block();
        var recovered = store.claim(Instant.now()).block();
        assertNotEquals(abandoned.getLeaseToken(), recovered.getLeaseToken());
        store.complete(abandoned, new byte[]{9}).block();
        assertNull(store.read("app").block().getImage());
        store.complete(recovered, new byte[]{2}).block();
        assertArrayEquals(new byte[]{2}, store.read("app").block().getImage());
    }
    @Test void failuresHaveDurableBoundedRetriesButNewLayoutGetsANewAttemptBudget() {
        store.desire("app", "v1").block();
        for (int attempt = 1; attempt <= 3; attempt++) {
            var job = store.claim(Instant.now().plusSeconds(attempt * 1000L)).block();
            assertNotNull(job); assertEquals(attempt, job.getAttempts());
            store.fail(job, false).block();
        }
        assertNull(store.claim(Instant.now().plusSeconds(86400)).block());
        store.desire("app", "v1").block();
        assertEquals("failed", store.read("app").block().getStatus());
        store.desire("app", "v2").block();
        var job = store.claim(Instant.now()).block();
        assertEquals(1, job.getAttempts());
        store.fail(job, true).block();
        assertEquals(0, store.read("app").block().getAttempts());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "LOWCODER_PREVIEW_TEST_RENDERER_URL", matches = ".+")
    void realInternalRendererImagePersistsAndCanBeReadAfterWorkerRestart() throws Exception {
        var config = mock(CommonConfig.class, RETURNS_DEEP_STUBS);
        when(config.getJsExecutor().getPassword()).thenReturn(Files.readString(Path.of(System.getenv("LOWCODER_PREVIEW_TEST_SECRET_FILE"))));
        var node = mock(NodeServerHelper.class);
        when(node.createUri("marketplace/render")).thenReturn(URI.create(System.getenv("LOWCODER_PREVIEW_TEST_RENDERER_URL") + "/node-service/api/marketplace/render"));
        var renderer = new MarketplaceRenderClient(config, node);
        var payload = Files.readString(Path.of(System.getenv("LOWCODER_PREVIEW_TEST_PAYLOAD_FILE")));
        store.desire("sample", "sample-layout").block();
        var job = store.claim(Instant.now()).block();
        var image = renderer.render(payload).block();
        assertNotNull(image);
        assertTrue(image.length > 1000);
        store.complete(job, image).block();
        var restarted = new MarketplacePreviewStore(new ReactiveMongoTemplate(client, mongo.getMongoDatabase().block().getName()));
        restarted.desire("sample", "sample-layout").block();
        assertArrayEquals(image, restarted.read("sample").block().getImage());
        assertNull(restarted.claim(Instant.now().plusSeconds(86400)).block());
    }
}
