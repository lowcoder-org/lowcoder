package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.stream.Stream;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.usermanagement.OrganizationEndpoints.UpdateOrgCommonSettingsRequest;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * NEW-132: the ten organization routes whose service already refuses a non-member (update, uploadLogo, deleteLogo, getOrgMembers,
 * updateRoleForMember, removeOrg, removeUserFromOrg, getOrgCommonSettings, updateOrgCommonSettings, getOrgApiUsageCount) through
 * the real {@link OrganizationController} bean (the real key conversion over the test database, the real {@link OrgApiService}),
 * with no HTTP layer and no security filter chain. Each route is called by {@code user01}, who is no member of the organizations
 * used, with three keys, and refuses each one with NOT_AUTHORIZED, so that a key that names nothing cannot be told from a
 * known organization the visitor may not use: U1 a gid that names nothing (it used to complete empty, an HTTP 200 without a
 * body), U2 the gid of an organization stored without memberships, U3 an object id that names nothing.
 *
 * <p>Not covered: the production security filter chain and the HTTP routing; the keys are never refused by the converter for a
 * key without a hyphen, so U3 shows the service's own refusal; the other three routes that convert an organization key (switch,
 * leave, the datasource listing) are P19.3 and P19.4's.
 */
@SpringBootTest
@ActiveProfiles("test")
class OrganizationUnknownKeyIntegrationTest {

    private static final String LOG_PREFIX = "[OrganizationUnknownKeyIntegrationTest] ";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String STORED_ORG_NAME = "org-unknown-key-it-org";
    private static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";
    private static final String MEMBER_USER_ID = "org-unknown-key-it-member";
    private static final String ROLE = "member";
    private static final String SETTING_KEY = "org-unknown-key-it-setting";
    private static final String SETTING_VALUE = "value";
    private static final int PAGE_NUM = 1;
    private static final int PAGE_SIZE = 1000;
    private static final boolean LAST_MONTH_ONLY = false;

    /** The kinds of key one route is called with. */
    enum KeyKind {
        /** A gid (with a hyphen) that names no organization: the converter's empty answer. */
        UNKNOWN_GID,
        /** The gid of a stored organization the visitor is no member of. */
        KNOWN_GID_OF_A_NON_MEMBER_ORG,
        /** An object id (no hyphen) that names no organization: the converter passes it on and the service refuses. */
        UNKNOWN_OBJECT_ID
    }

    @Autowired
    private OrganizationController organizationController;
    @Autowired
    private ReactiveMongoTemplate mongo;
    @Autowired
    private InitData initData;

    private final List<String> storedOrgIds = new ArrayList<>();

    @BeforeEach
    void seed() {
        initData.init();
        storedOrgIds.clear();
    }

    @AfterEach
    void removeWhatTheCaseStored() {
        if (storedOrgIds.isEmpty()) {
            return;
        }
        long removed = mongo.remove(Query.query(Criteria.where(FieldName.ID).in(storedOrgIds)), Organization.class)
                .block(TIMEOUT).getDeletedCount();
        say("removed %d of the %d org(s) the case stored", removed, storedOrgIds.size());
        assertThat(removed).as("organizations removed").isEqualTo(storedOrgIds.size());
    }

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    /** One route of {@link OrganizationController}, called with a key and minimal arguments. */
    record Route(String name, BiFunction<OrganizationController, String, Mono<?>> call) {
        @Override
        public String toString() {
            return name;
        }
    }

    static Stream<Arguments> routesAndKeys() {
        List<Route> routes = List.of(
                new Route("update", (controller, key) -> controller.update(key, new UpdateOrgRequest())),
                new Route("uploadLogo", (controller, key) -> controller.uploadLogo(key, Mono.empty())),
                new Route("deleteLogo", (controller, key) -> controller.deleteLogo(key)),
                new Route("getOrgMembers", (controller, key) -> controller.getOrgMembers(key, PAGE_NUM, PAGE_SIZE)),
                new Route("updateRoleForMember", (controller, key) -> controller.updateRoleForMember(roleRequest(), key)),
                new Route("removeOrg", (controller, key) -> controller.removeOrg(key)),
                new Route("removeUserFromOrg", (controller, key) -> controller.removeUserFromOrg(key, MEMBER_USER_ID)),
                new Route("getOrgCommonSettings", (controller, key) -> controller.getOrgCommonSettings(key)),
                new Route("updateOrgCommonSettings", (controller, key) ->
                        controller.updateOrgCommonSettings(key, new UpdateOrgCommonSettingsRequest(SETTING_KEY, SETTING_VALUE))),
                new Route("getOrgApiUsageCount", (controller, key) -> controller.getOrgApiUsageCount(key, LAST_MONTH_ONLY)));
        return routes.stream().flatMap(route -> Stream.of(KeyKind.values()).map(kind -> Arguments.of(route, kind)));
    }

    private static UpdateRoleRequest roleRequest() {
        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setUserId(MEMBER_USER_ID);
        request.setRole(ROLE);
        return request;
    }

    /** An organization stored without memberships or groups, with a fresh gid; returns the gid. */
    private String storeOrganizationAndReturnItsGid() {
        String orgId = new ObjectId().toHexString();
        storedOrgIds.add(orgId);
        String gid = UUID.randomUUID().toString();
        Organization organization = Organization.builder().name(STORED_ORG_NAME).gid(gid).state(OrganizationState.ACTIVE).build();
        organization.setId(orgId);
        mongo.save(organization).block(TIMEOUT);
        say("stored org %s with gid %s", orgId, gid);
        return gid;
    }

    private String keyOf(KeyKind kind) {
        return switch (kind) {
            case UNKNOWN_GID -> UUID.randomUUID().toString();
            case KNOWN_GID_OF_A_NON_MEMBER_ORG -> storeOrganizationAndReturnItsGid();
            case UNKNOWN_OBJECT_ID -> new ObjectId().toHexString();
        };
    }

    @ParameterizedTest(name = "{0} with {1}")
    @MethodSource("routesAndKeys")
    @WithMockUser
    void aKeyThatNamesNothingIsRefusedAsAKnownOneNEW132(Route route, KeyKind kind) {
        String key = keyOf(kind);

        StepVerifier.create(route.call().apply(organizationController, key)).expectErrorSatisfies(error -> {
            say("%s(key [%s], %s) -> error %s", route.name(), key, kind, error);
            assertThat(error).isInstanceOf(BizException.class);
            assertThat(((BizException) error).getError()).isEqualTo(BizError.NOT_AUTHORIZED);
            assertThat(((BizException) error).getMessageKey()).isEqualTo(NOT_AUTHORIZED_KEY);
        }).verify(TIMEOUT);
    }
}
