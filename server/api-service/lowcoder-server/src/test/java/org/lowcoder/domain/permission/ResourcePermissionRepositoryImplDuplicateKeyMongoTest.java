package org.lowcoder.domain.permission;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.impl.ResourcePermissionRepositoryImpl;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * addPermission when the unique BiRelation index rejects the insert (unit U14, task L3-11c, candidate D6). The test profile does
 * not run the Mongock changelog, so this class (own Spring context, hence its own database) creates the index the production
 * changelog defines (DatabaseChangelog: bizType, sourceId, targetId, unique, "biztype_sourceid_targetid_uniq") in that database
 * only. Behaviour, not a defect row: addPermission maps every error to false (onErrorResume), so a caller cannot tell "already
 * granted" from a database failure, and the existing permission, including its role, is left unchanged.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11c.context=resource-permission-duplicate-key")
class ResourcePermissionRepositoryImplDuplicateKeyMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String INDEX_NAME = "biztype_sourceid_targetid_uniq";

    @Autowired
    private ResourcePermissionRepositoryImpl repository;
    @Autowired
    private ReactiveMongoTemplate mongo;

    @BeforeEach
    void theUniqueIndexOfTheProductionChangelogExistsInThisDatabase() {
        mongo.indexOps(BiRelation.class).ensureIndex(new Index()
                .on("bizType", Sort.Direction.ASC).on("sourceId", Sort.Direction.ASC).on("targetId", Sort.Direction.ASC)
                .unique().named(INDEX_NAME)).block(TIMEOUT);
    }

    /** Catches: the error no longer being mapped to false (a fix would change this on purpose), or the first grant being altered. */
    @Test
    void grantingTheSameHolderTwiceAnswersFalseAndKeepsTheFirstRole() {
        String resourceId = IDUtils.generate();
        String userId = IDUtils.generate();

        boolean first = repository.addPermission(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, userId, ResourceRole.VIEWER).block(TIMEOUT);
        boolean second = repository.addPermission(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, userId, ResourceRole.OWNER).block(TIMEOUT);

        System.out.println("[ResourcePermissionRepositoryImplDuplicateKeyMongoTest] first=" + first + " duplicate=" + second);
        assertThat(first).isTrue();
        assertThat(second).as("the duplicate key error is swallowed and reported as false").isFalse();
        assertThat(repository.getByResourceTypeAndResourceId(ResourceType.APPLICATION, resourceId).block(TIMEOUT))
                .extracting(ResourcePermission::getResourceRole).containsExactly(ResourceRole.VIEWER);
    }
}
