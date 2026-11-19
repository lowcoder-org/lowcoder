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
import org.lowcoder.api.datasource.DatasourceController;
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
 * updateRoleForMember, removeOrg, removeUserFromOrg, getOrgCommonSettings, updateOrgCommonSettings, getOrgApiUsageCount), since
 * P19.3 the switch and the leave (setCurrentOrganization, leaveOrganization; which answered INVALID_ORG_ID or {@code false} to a
 * non-member), and since P19.4 the datasource listing of an organization (listOrgDataSources; which listed an empty page to a
 * non-member) through the real {@link OrganizationController} and {@link DatasourceController} beans (the real key conversion over the test database, the real {@link OrgApiService}),
 * with no HTTP layer and no security filter chain. Each route is called by {@code user01}, who is no member of the organizations
 * used, with three keys, and refuses each one with NOT_AUTHORIZED, so that a key that names nothing cannot be told from a
 * known organization the visitor may not use: U1 a gid that names nothing (it used to complete empty, an HTTP 200 without a
 * body), U2 the gid of an organization stored without memberships, U3 an object id that names nothing; the switch and the leave
 * also get U4, a whitespace key, which the converter passes on as given (a non-member's direct call used to be INVALID_ORG_ID on
 * the switch and 200 {@code false} on the leave).
 *
 * <p>Not covered: the production security filter chain and the HTTP routing; the keys are never refused by the converter for a
 * key without a hyphen, so U3 and U4 show the service's own refusal; That the logout event is
 * not published for a refused switch is the contract test's ({@code setCurrentOrganizationByANonMember}).
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
    /** The datasource listing's page size 0: all elements. */
    private static final int LIST_ALL = 0;
    private static final boolean LAST_MONTH_ONLY = false;
    private static final String BLANK_KEY_VALUE = " ";

    /** The kinds of key one route is called with. */
    enum KeyKind {
        /** A gid (with a hyphen) that names no organization: the converter's empty answer. */
        UNKNOWN_GID,
        /** The gid of a stored organization the visitor is no member of. */
        KNOWN_GID_OF_A_NON_MEMBER_ORG,
        /** An object id (no hyphen) that names no organization: the converter passes it on and the service refuses. */
        UNKNOWN_OBJECT_ID,
        /** A whitespace key, which the converter passes on as given: only for the switch and the leave. */
        BLANK_KEY
    }

    @Autowired
    private OrganizationController organizationController;
    @Autowired
    private DatasourceController datasourceController;
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

    /** The controllers the routes belong to. */
    record Controllers(OrganizationController organization, DatasourceController datasource) {
    }

    /** One route of {@link OrganizationController} or {@link DatasourceController}, called with a key and minimal arguments. */
    record Route(String name, BiFunction<Controllers, String, Mono<?>> call) {
        @Override
        public String toString() {
            return name;
        }
    }

    static Stream<Arguments> routesAndKeys() {
        List<Route> routes = List.of(
                new Route("update", (controllers, key) -> controllers.organization().update(key, new UpdateOrgRequest())),
                new Route("uploadLogo", (controllers, key) -> controllers.organization().uploadLogo(key, Mono.empty())),
                new Route("deleteLogo", (controllers, key) -> controllers.organization().deleteLogo(key)),
                new Route("getOrgMembers", (controllers, key) -> controllers.organization().getOrgMembers(key, PAGE_NUM, PAGE_SIZE)),
                new Route("updateRoleForMember", (controllers, key) -> controllers.organization().updateRoleForMember(roleRequest(), key)),
                new Route("removeOrg", (controllers, key) -> controllers.organization().removeOrg(key)),
                new Route("removeUserFromOrg", (controllers, key) -> controllers.organization().removeUserFromOrg(key, MEMBER_USER_ID)),
                new Route("getOrgCommonSettings", (controllers, key) -> controllers.organization().getOrgCommonSettings(key)),
                new Route("updateOrgCommonSettings", (controllers, key) ->
                        controllers.organization().updateOrgCommonSettings(key, new UpdateOrgCommonSettingsRequest(SETTING_KEY, SETTING_VALUE))),
                new Route("getOrgApiUsageCount", (controllers, key) -> controllers.organization().getOrgApiUsageCount(key, LAST_MONTH_ONLY)),
                new Route("listOrgDataSources", (controllers, key) -> controllers.datasource().listOrgDataSources(key, null, null, PAGE_NUM, LIST_ALL)));
        List<Route> blankKeyRoutes = List.of(
                new Route("setCurrentOrganization", (controllers, key) -> controllers.organization().setCurrentOrganization(key, null)),
                new Route("leaveOrganization", (controllers, key) -> controllers.organization().leaveOrganization(key)));
        List<KeyKind> keyKinds = List.of(KeyKind.UNKNOWN_GID, KeyKind.KNOWN_GID_OF_A_NON_MEMBER_ORG, KeyKind.UNKNOWN_OBJECT_ID);
        return Stream.concat(
                Stream.concat(routes.stream(), blankKeyRoutes.stream()).flatMap(route -> keyKinds.stream().map(kind -> Arguments.of(route, kind))),
                blankKeyRoutes.stream().map(route -> Arguments.of(route, KeyKind.BLANK_KEY)));
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
            case BLANK_KEY -> BLANK_KEY_VALUE;
        };
    }

    @ParameterizedTest(name = "{0} with {1}")
    @MethodSource("routesAndKeys")
    @WithMockUser
    void aKeyThatNamesNothingIsRefusedAsAKnownOneNEW132(Route route, KeyKind kind) {
        String key = keyOf(kind);

        StepVerifier.create(route.call().apply(new Controllers(organizationController, datasourceController), key)).expectErrorSatisfies(error -> {
            say("%s(key [%s], %s) -> error %s", route.name(), key, kind, error);
            assertThat(error).isInstanceOf(BizException.class);
            assertThat(((BizException) error).getError()).isEqualTo(BizError.NOT_AUTHORIZED);
            assertThat(((BizException) error).getMessageKey()).isEqualTo(NOT_AUTHORIZED_KEY);
        }).verify(TIMEOUT);
    }
}
