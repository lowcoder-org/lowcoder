package org.lowcoder.domain.group.service;

import static org.lowcoder.domain.group.util.SystemGroups.ALL_USER;
import static org.lowcoder.domain.group.util.SystemGroups.DEV;
import static org.lowcoder.sdk.util.LocaleUtils.getLocale;

import java.util.Collection;
import java.util.Locale;

import org.lowcoder.domain.group.event.GroupDeletedEvent;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.repository.GroupRepository;
import org.lowcoder.domain.group.util.SystemGroups;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.infra.mongo.MongoUpsertHelper.PartialResourceWithId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class GroupServiceImpl implements GroupService {

    @Autowired
    private GroupRepository repository;

    @Autowired
    private GroupMemberService groupMemberService;

    @Autowired
    private MongoUpsertHelper mongoUpsertHelper;

    @Autowired
    private ApplicationContext applicationContext;

    @Override
    public Mono<Group> getById(String groupId) {
        return repository.findById(groupId);
    }

    @Override
    public Flux<Group> getByIds(Collection<String> groupIds) {
        return repository.findByIdIn(groupIds);
    }

    @Override
    public Flux<Group> getByOrgId(String organizationId) {
        return this.repository.findByOrganizationId(organizationId);
    }

    @Override
    public Mono<Long> getOrgGroupCount(String organizationId) {
        return repository.countByOrganizationId(organizationId);
    }

    @Override
    public Mono<Void> delete(String id) {
        return repository.deleteById(id)
                .then(Mono.defer(() -> sendGroupDeletedEvent(id)));
    }

    private Mono<Void> sendGroupDeletedEvent(String groupId) {
        GroupDeletedEvent event = new GroupDeletedEvent();
        event.setGroupId(groupId);
        applicationContext.publishEvent(event);
        return Mono.empty();
    }

    @Override
    public Mono<Group> create(Group newGroup, String userId, String orgId) {
        return repository.save(newGroup)
                .flatMap(createdGroup -> groupMemberService.addMember(orgId, createdGroup.getId(),
                        userId, MemberRole.ADMIN).thenReturn(createdGroup));
    }

    @Override
    public Mono<Boolean> updateGroup(Group updateGroup) {
        return mongoUpsertHelper.updateById(updateGroup, updateGroup.getId());
    }

    @Override
    public Mono<Group> getAllUsersGroup(String organizationId) {
        return repository.findByOrganizationIdAndAllUsersGroup(organizationId, true);
    }

    @Override
    public Mono<Group> getDevGroup(String orgId) {
        return repository.findByOrganizationIdAndType(orgId, DEV);
    }

    private Mono<Group> createSystemGroup(String organizationId, String type) {
        return Mono.deferContextual(contextView -> {
            Locale locale = getLocale(contextView);
            Group group = new Group();
            group.setOrganizationId(organizationId);
            group.setName(SystemGroups.getName(type, locale));
            group.setType(type);
            group.setAllUsersGroup(type.equals(ALL_USER));
            return repository.save(group);
        });
    }

    @Override
    public Mono<Group> createDevGroup(String orgId) {
        return createSystemGroup(orgId, DEV);
    }

    @Override
    public Mono<Group> createAllUserGroup(String orgId) {
        return createSystemGroup(orgId, ALL_USER);
    }

    @Override
    public Mono<Boolean> bulkCreateSyncGroup(Collection<Group> groups) {
        return repository.saveAll(groups).hasElements();
    }

    @Override
    public Flux<Group> getAllGroupsBySource(String orgId, String source) {
        return repository.findBySourceAndOrganizationId(source, orgId);
    }

    @Override
    public Mono<Boolean> bulkUpdateGroup(Collection<PartialResourceWithId<Group>> groups) {
        return mongoUpsertHelper.bulkUpdate(groups);
    }
}