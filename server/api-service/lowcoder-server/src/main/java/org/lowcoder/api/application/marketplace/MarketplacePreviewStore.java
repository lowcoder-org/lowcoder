package org.lowcoder.api.application.marketplace;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class MarketplacePreviewStore {
    private final ReactiveMongoTemplate mongo;

    public Mono<Void> ensureIndex() {
        return mongo.indexOps(MarketplacePreview.class).ensureIndex(new Index()
                .on("status", Sort.Direction.ASC).on("nextAttemptAt", Sort.Direction.ASC)).then();
    }

    public Mono<MarketplacePreview> read(String id) {
        return mongo.findById(id, MarketplacePreview.class);
    }

    public Mono<Void> desire(String id, String hash) {
        Query metadata = Query.query(Criteria.where("_id").is(id));
        metadata.fields().exclude("image");
        return mongo.findOne(metadata, MarketplacePreview.class)
                .flatMap(existing -> {
                    if (hash.equals(existing.getDesiredHash())) return Mono.just(true);
                    // Compare-and-set: a stale reconciliation cannot overwrite a concurrent update.
                    return mongo.updateFirst(Query.query(Criteria.where("_id").is(id)
                                    .and("desiredHash").is(existing.getDesiredHash())),
                            pending(hash), MarketplacePreview.class).thenReturn(true);
                })
                .switchIfEmpty(Mono.defer(() -> mongo.upsert(Query.query(Criteria.where("_id").is(id)),
                        new Update().setOnInsert("desiredHash", hash).setOnInsert("status", "pending")
                                .setOnInsert("attempts", 0).setOnInsert("nextAttemptAt", Instant.EPOCH)
                                .setOnInsert("leaseUntil", Instant.EPOCH), MarketplacePreview.class).thenReturn(true)))
                .onErrorResume(DuplicateKeyException.class, ignored -> Mono.just(true)).then();
    }

    private Update pending(String hash) {
        return new Update().set("desiredHash", hash).set("status", "pending").set("attempts", 0)
                .set("nextAttemptAt", Instant.EPOCH).set("leaseUntil", Instant.EPOCH).unset("leaseToken");
    }

    public Mono<MarketplacePreview> claim(Instant now) {
        Query query = Query.query(Criteria.where("status").is("pending").and("attempts").lt(3)
                .and("nextAttemptAt").lte(now).and("leaseUntil").lte(now));
        query.with(Sort.by("nextAttemptAt"));
        query.fields().exclude("image");
        return mongo.findAndModify(query, new Update().set("leaseToken", UUID.randomUUID().toString())
                        .set("leaseUntil", now.plusSeconds(180)).inc("attempts", 1),
                FindAndModifyOptions.options().returnNew(true), MarketplacePreview.class);
    }

    private Query owned(MarketplacePreview job) {
        return Query.query(Criteria.where("_id").is(job.getId()).and("desiredHash").is(job.getDesiredHash())
                .and("leaseToken").is(job.getLeaseToken()));
    }

    public Mono<Void> complete(MarketplacePreview job, byte[] image) {
        return mongo.updateFirst(owned(job), new Update().set("image", image)
                .set("renderedHash", job.getDesiredHash()).set("status", "ready")
                .unset("leaseToken").set("leaseUntil", Instant.EPOCH), MarketplacePreview.class).then();
    }

    public Mono<Void> fail(MarketplacePreview job, boolean busy) {
        Update update = new Update().set("status", !busy && job.getAttempts() >= 3 ? "failed" : "pending")
                .set("nextAttemptAt", Instant.now().plusSeconds(busy ? 10 : 60L * job.getAttempts() * job.getAttempts()))
                .unset("leaseToken").set("leaseUntil", Instant.EPOCH);
        if (busy) update.inc("attempts", -1);
        return mongo.updateFirst(owned(job), update, MarketplacePreview.class).then();
    }

    public Mono<Void> discard(MarketplacePreview job) {
        return mongo.remove(owned(job), MarketplacePreview.class).then();
    }
}
