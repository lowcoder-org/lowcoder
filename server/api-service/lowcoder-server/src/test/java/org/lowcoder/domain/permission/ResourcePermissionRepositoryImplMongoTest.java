package org.lowcoder.domain.permission;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.impl.ResourcePermissionRepositoryImpl;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * ResourcePermissionRepositoryImpl against the MongoDB test container (unit U14, task L3-11c). Every test uses resource,
 * user and group ids it generates. Not repeated: the removeBiRelationById row (L4-8), the privilege-escalation rows (L1).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class ResourcePermissionRepositoryImplMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    @Autowired
    private ResourcePermissionRepositoryImpl repository;

    private static String id() {
        return IDUtils.generate();
    }

    /** Catches: a lost field in the BiRelation mapping, addPermission reporting failure, the lookup key mixed up. */
    @Test
    void addPermissionThenReadItBackByResourceAndByHolder() {
        String resourceId = id();
        String userId = id();

        assertThat(repository.addPermission(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, userId, ResourceRole.EDITOR)
                .block(TIMEOUT)).isTrue();

        List<ResourcePermission> found = repository.getByResourceTypeAndResourceId(ResourceType.APPLICATION, resourceId)
                .block(TIMEOUT);
        System.out.println("[ResourcePermissionRepositoryImplMongoTest] permissions on " + resourceId + ": " + found.size());
        assertThat(found).hasSize(1);
        ResourcePermission permission = found.get(0);
        assertThat(permission.getResourceType()).isEqualTo(ResourceType.APPLICATION);
        assertThat(permission.getResourceId()).isEqualTo(resourceId);
        assertThat(permission.getResourceHolder()).isEqualTo(ResourceHolder.USER);
        assertThat(permission.getResourceHolderId()).isEqualTo(userId);
        assertThat(permission.getResourceRole()).isEqualTo(ResourceRole.EDITOR);
        assertThat(permission.getId()).isNotBlank();

        ResourcePermission byTarget = repository.getByResourceTypeAndResourceIdAndTargetId(
                ResourceType.APPLICATION, resourceId, ResourceHolder.USER, userId).block(TIMEOUT);
        assertThat(byTarget.getId()).isEqualTo(permission.getId());
        assertThat(repository.getById(permission.getId()).block(TIMEOUT).getResourceRole()).isEqualTo(ResourceRole.EDITOR);
        assertThat(repository.getByResourceTypeAndResourceIdAndTargetId(ResourceType.APPLICATION, resourceId, ResourceHolder.GROUP, userId)
                .blockOptional(TIMEOUT)).as("holder kind is part of the key").isEmpty();
        assertThat(repository.getByResourceTypeAndResourceIdAndTargetId(ResourceType.DATASOURCE, resourceId, ResourceHolder.USER, userId)
                .blockOptional(TIMEOUT)).as("resource type is part of the key").isEmpty();
        assertThat(repository.getById(id()).blockOptional(TIMEOUT)).isEmpty();
    }

    /** Catches: the multimap keyed wrongly, ids of one resource leaking into another, unknown ids missing from or invented in the map. */
    @Test
    void getByResourceTypeAndResourceIdsGroupsThePermissionsPerResource() {
        String r1 = id();
        String r2 = id();
        String unknown = id();
        String u1 = id();
        String u2 = id();
        repository.addPermission(ResourceType.DATASOURCE, r1, ResourceHolder.USER, u1, ResourceRole.OWNER).block(TIMEOUT);
        repository.addPermission(ResourceType.DATASOURCE, r1, ResourceHolder.USER, u2, ResourceRole.VIEWER).block(TIMEOUT);
        repository.addPermission(ResourceType.DATASOURCE, r2, ResourceHolder.USER, u1, ResourceRole.EDITOR).block(TIMEOUT);
        repository.addPermission(ResourceType.APPLICATION, r1, ResourceHolder.USER, u2, ResourceRole.OWNER).block(TIMEOUT);

        Map<String, java.util.Collection<ResourcePermission>> map = repository
                .getByResourceTypeAndResourceIds(ResourceType.DATASOURCE, List.of(r1, r2, unknown)).block(TIMEOUT);

        System.out.println("[ResourcePermissionRepositoryImplMongoTest] grouped keys " + map.keySet());
        assertThat(map.keySet()).containsExactlyInAnyOrder(r1, r2);
        assertThat(map.get(r1)).extracting(ResourcePermission::getResourceHolderId).containsExactlyInAnyOrder(u1, u2);
        assertThat(map.get(r1)).extracting(ResourcePermission::getResourceRole)
                .containsExactlyInAnyOrder(ResourceRole.OWNER, ResourceRole.VIEWER);
        assertThat(map.get(r2)).extracting(ResourcePermission::getResourceRole).containsExactly(ResourceRole.EDITOR);
        assertThat(repository.getByResourceTypeAndResourceIds(ResourceType.DATASOURCE, List.of(unknown)).block(TIMEOUT)).isEmpty();
    }

    /** Catches: insertBatchPermission dropping entries or writing a wrong holder kind / role. */
    @Test
    void insertBatchPermissionStoresEveryEntryAndAnEmptyBatchStoresNothing() {
        String resourceId = id();
        String user = id();
        String group = id();

        Multimap<ResourceHolder, String> holders = ArrayListMultimap.create();
        holders.put(ResourceHolder.USER, user);
        holders.put(ResourceHolder.GROUP, group);

        repository.insertBatchPermission(ResourceType.APPLICATION, resourceId, holders, ResourceRole.VIEWER).block(TIMEOUT);

        List<ResourcePermission> found = repository.getByResourceTypeAndResourceId(ResourceType.APPLICATION, resourceId).block(TIMEOUT);
        assertThat(found).hasSize(2);
        assertThat(found).extracting(ResourcePermission::getResourceHolder, ResourcePermission::getResourceHolderId, ResourcePermission::getResourceRole)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple(ResourceHolder.USER, user, ResourceRole.VIEWER),
                        org.assertj.core.groups.Tuple.tuple(ResourceHolder.GROUP, group, ResourceRole.VIEWER));
        String emptyBatchResource = id();
        repository.insertBatchPermission(ResourceType.APPLICATION, emptyBatchResource, ArrayListMultimap.create(), ResourceRole.VIEWER).block(TIMEOUT);
        assertThat(repository.getByResourceTypeAndResourceId(ResourceType.APPLICATION, emptyBatchResource).block(TIMEOUT)).isEmpty();
    }

    /** Catches: the role update touching other rows or other fields, a missing id reported as updated. */
    @Test
    void updatePermissionRoleByIdChangesOnlyThatRole() {
        String resourceId = id();
        String u1 = id();
        String u2 = id();
        repository.addPermission(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, u1, ResourceRole.VIEWER).block(TIMEOUT);
        repository.addPermission(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, u2, ResourceRole.VIEWER).block(TIMEOUT);
        ResourcePermission first = repository.getByResourceTypeAndResourceIdAndTargetId(
                ResourceType.APPLICATION, resourceId, ResourceHolder.USER, u1).block(TIMEOUT);

        assertThat(repository.updatePermissionRoleById(first.getId(), ResourceRole.OWNER).block(TIMEOUT)).isTrue();

        ResourcePermission updated = repository.getById(first.getId()).block(TIMEOUT);
        assertThat(updated.getResourceRole()).isEqualTo(ResourceRole.OWNER);
        assertThat(updated.getResourceHolderId()).isEqualTo(u1);
        assertThat(updated.getResourceId()).isEqualTo(resourceId);
        ResourcePermission other = repository.getByResourceTypeAndResourceIdAndTargetId(
                ResourceType.APPLICATION, resourceId, ResourceHolder.USER, u2).block(TIMEOUT);
        assertThat(other.getResourceRole()).isEqualTo(ResourceRole.VIEWER);
        assertThat(repository.updatePermissionRoleById(id(), ResourceRole.OWNER).block(TIMEOUT)).isFalse();
    }

    /** Catches: the removal by id or by (resource, holder) taking neighbouring permissions with it, or removing nothing. */
    @Test
    void removePermissionByIdAndByResourceAndHolderRemoveOnlyTheirRow() {
        String resourceId = id();
        String u1 = id();
        String u2 = id();
        String u3 = id();
        for (String user : List.of(u1, u2, u3)) {
            repository.addPermission(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, user, ResourceRole.VIEWER).block(TIMEOUT);
        }
        ResourcePermission p1 = repository.getByResourceTypeAndResourceIdAndTargetId(
                ResourceType.APPLICATION, resourceId, ResourceHolder.USER, u1).block(TIMEOUT);

        assertThat(repository.removePermissionById(p1.getId()).block(TIMEOUT)).isTrue();
        assertThat(repository.removePermissionBy(ResourceType.APPLICATION, resourceId, ResourceHolder.USER, u2).block(TIMEOUT)).isTrue();

        List<ResourcePermission> left = repository.getByResourceTypeAndResourceId(ResourceType.APPLICATION, resourceId).block(TIMEOUT);
        System.out.println("[ResourcePermissionRepositoryImplMongoTest] left after two removals: " + left.size());
        assertThat(left).extracting(ResourcePermission::getResourceHolderId).containsExactly(u3);
    }
}
