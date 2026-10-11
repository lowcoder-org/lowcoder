package org.lowcoder.domain.organization;

import java.time.Duration;
import java.util.List;

import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

/**
 * Helpers of the organisation-membership tests (task L3-11a): every test generates its own organisation, user and group
 * ids, creates the organisation documents it needs directly (no seed data, no side effects of OrganizationService.create)
 * and reads the stored BiRelation rows straight from MongoDB, independently of the services under test.
 * The concrete classes carry the {@code @SpringBootTest} and context annotations.
 */
abstract class OrganizationMongoTestBase {

    protected static final Duration TIMEOUT = Duration.ofSeconds(30);

    @Autowired
    protected ReactiveMongoTemplate mongo;
    @Autowired
    protected OrgMemberService orgMemberService;
    @Autowired
    protected GroupService groupService;
    @Autowired
    protected GroupMemberService groupMemberService;

    protected static String newId() {
        return IDUtils.generate();
    }

    /** An organisation document in the given state, without groups or members. */
    protected String createOrg(OrganizationState state) {
        Organization org = Organization.builder().name("org-" + newId()).gid(newId()).state(state).build();
        return mongo.save(org).block(TIMEOUT).getId();
    }

    protected String createActiveOrg() {
        return createOrg(OrganizationState.ACTIVE);
    }

    /** An active organisation that also has its all-users group; returns {orgId, allUsersGroupId}. */
    protected String[] createActiveOrgWithAllUsersGroup() {
        String orgId = createActiveOrg();
        Group group = groupService.createAllUserGroup(orgId).block(TIMEOUT);
        return new String[] {orgId, group.getId()};
    }

    protected List<BiRelation> rows(BiRelationBizType type, String sourceId, String targetId) {
        Query query = Query.query(Criteria.where("bizType").is(type).and("sourceId").is(sourceId).and("targetId").is(targetId));
        return mongo.find(query, BiRelation.class).collectList().block(TIMEOUT);
    }

    protected List<BiRelation> rowsOfSource(BiRelationBizType type, String sourceId) {
        Query query = Query.query(Criteria.where("bizType").is(type).and("sourceId").is(sourceId));
        return mongo.find(query, BiRelation.class).collectList().block(TIMEOUT);
    }

    protected BiRelation singleRow(BiRelationBizType type, String sourceId, String targetId) {
        List<BiRelation> found = rows(type, sourceId, targetId);
        if (found.size() != 1) {
            throw new AssertionError("expected one " + type + " row for " + sourceId + "/" + targetId + " but found " + found.size());
        }
        return found.get(0);
    }
}
