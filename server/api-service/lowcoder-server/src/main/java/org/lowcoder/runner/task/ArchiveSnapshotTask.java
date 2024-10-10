package org.lowcoder.runner.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshotTS;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@RequiredArgsConstructor
@Component
public class ArchiveSnapshotTask {

    private final CommonConfig commonConfig;
    private final MongoTemplate mongoTemplate;

    @Scheduled(initialDelay = 1, fixedRate = 1, timeUnit = TimeUnit.DAYS)
    public void archive() {
        Instant thresholdDate = Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration(), ChronoUnit.DAYS);
        List<ApplicationHistorySnapshotTS> snapshots = mongoTemplate.find(new Query().addCriteria(Criteria.where("createdAt").lte(thresholdDate)), ApplicationHistorySnapshotTS.class);
        snapshots.forEach(snapshot -> {
            ApplicationHistorySnapshot applicationHistorySnapshot = new ApplicationHistorySnapshot();
            applicationHistorySnapshot.setApplicationId(snapshot.getApplicationId());
            applicationHistorySnapshot.setDsl(snapshot.getDsl());
            applicationHistorySnapshot.setContext(snapshot.getContext());
            applicationHistorySnapshot.setCreatedAt(snapshot.getCreatedAt());
            applicationHistorySnapshot.setCreatedBy(snapshot.getCreatedBy());
            applicationHistorySnapshot.setModifiedBy(snapshot.getModifiedBy());
            applicationHistorySnapshot.setUpdatedAt(snapshot.getUpdatedAt());
            applicationHistorySnapshot.setId(snapshot.getId());
            mongoTemplate.insert(applicationHistorySnapshot);
            mongoTemplate.remove(snapshot);
        });
    }

}
