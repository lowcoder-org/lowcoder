package org.lowcoder.api.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.permission.model.ResourceAction.MANAGE_DATASOURCES;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * NEW-115: the eight datasource calls that need the MANAGE_DATASOURCES permission, with and without a visitor.
 * A call with no visitor ({@code SessionUserService#getVisitorId} completes empty: no security context) is refused with
 * NOT_AUTHORIZED before the permission service is asked and before the guarded operation runs; a visitor is checked for
 * MANAGE_DATASOURCES on the datasource. Every collaborator answer is recorded in {@code events} when it is subscribed
 * to, so a call that got through shows which operation ran.
 *
 * <p>Limit: the service is called with a mocked {@code SessionUserService}; that no security context makes
 * {@code getVisitorId()} empty, and that HTTP always carries a principal, are read in the code, not tested here.
 */
@ExtendWith(MockitoExtension.class)
class DatasourceApiServiceImplNoVisitorTest {

    private static final String LOG_PREFIX = "[DatasourceApiServiceImplNoVisitorTest] ";
    private static final String VISITOR_ID = "visitor-1";
    private static final String DATASOURCE_ID = "ds-1";
    private static final String PERMISSION_ID = "perm-1";
    private static final String ORG_ID = "org-1";
    private static final String CREATOR_ID = "creator-1";
    private static final String GRANTEE_ID = "grantee-1";
    private static final String ORG_NAME = "Org One";
    private static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";

    private static final String READ_DATASOURCE = "read datasource";
    private static final String READ_PERMISSION = "read permission";
    private static final String UPDATE = "update datasource";
    private static final String DELETE = "delete datasource";
    private static final String TEST = "test datasource";
    private static final String READ_ROWS = "read permission rows";
    private static final String READ_ORG = "read organization";
    private static final String READ_GROUP_PERMISSIONS = "read group permissions";
    private static final String READ_USER_PERMISSIONS = "read user permissions";
    private static final String INSERT = "insert permissions";
    private static final String UPDATE_ROLE = "update role";
    private static final String REMOVE = "remove permission";

    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private DatasourceService datasourceService;
    @Mock
    private PermissionHelper permissionHelper;
    @Mock
    private OrganizationService organizationService;

    @InjectMocks
    private DatasourceApiServiceImpl service;

    private final List<String> events = new ArrayList<>();

    /** The eight guarded calls, each with the events its code runs before the permission check. */
    enum GuardedCall {
        UPDATE(List.of()),
        FIND(List.of()),
        TEST(List.of()),
        DELETE(List.of()),
        GET_PERMISSIONS(List.of(READ_DATASOURCE)),
        GRANT(List.of()),
        UPDATE_PERMISSION(List.of(READ_PERMISSION)),
        DELETE_PERMISSION(List.of(READ_PERMISSION));

        final List<String> eventsBeforeTheCheck;

        GuardedCall(List<String> eventsBeforeTheCheck) {
            this.eventsBeforeTheCheck = eventsBeforeTheCheck;
        }
    }

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.justOrEmpty(value);
        });
    }

    private Mono<Void> loggedVoid(String event) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.empty();
        });
    }

    private static Datasource stored() {
        Datasource datasource = new Datasource();
        datasource.setId(DATASOURCE_ID);
        datasource.setOrganizationId(ORG_ID);
        datasource.setCreatedBy(CREATOR_ID);
        return datasource;
    }

    /** Every collaborator answer of the eight paths, leniently, so that a call that gets through emits a value. */
    private void stubCollaborators() {
        ResourcePermission row = ResourcePermission.builder().id(PERMISSION_ID).resourceType(ResourceType.DATASOURCE).resourceId(DATASOURCE_ID).build();
        lenient().when(datasourceService.getById(DATASOURCE_ID)).thenReturn(logged(READ_DATASOURCE, stored()));
        lenient().when(datasourceService.update(eq(DATASOURCE_ID), any())).thenReturn(logged(UPDATE, stored()));
        lenient().when(datasourceService.delete(DATASOURCE_ID)).thenReturn(logged(DELETE, true));
        lenient().when(datasourceService.testDatasource(any())).thenReturn(logged(TEST, DatasourceTestResult.testSuccess()));
        lenient().when(resourcePermissionService.getByDataSourceId(DATASOURCE_ID)).thenReturn(logged(READ_ROWS, List.of(row)));
        lenient().when(permissionHelper.getGroupPermissions(anyList())).thenReturn(logged(READ_GROUP_PERMISSIONS, List.of()));
        lenient().when(permissionHelper.getUserPermissions(anyList())).thenReturn(logged(READ_USER_PERMISSIONS, List.of()));
        lenient().when(organizationService.getById(ORG_ID)).thenReturn(logged(READ_ORG, Organization.builder().id(ORG_ID).name(ORG_NAME).build()));
        lenient().when(resourcePermissionService.insertBatchPermission(eq(ResourceType.DATASOURCE), eq(DATASOURCE_ID), any(), any(), any()))
                .thenReturn(loggedVoid(INSERT));
        lenient().when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(logged(READ_PERMISSION, row));
        lenient().when(resourcePermissionService.updateRoleById(eq(PERMISSION_ID), any())).thenReturn(logged(UPDATE_ROLE, true));
        lenient().when(resourcePermissionService.removeById(PERMISSION_ID)).thenReturn(logged(REMOVE, true));
    }

    private Mono<?> call(GuardedCall guarded) {
        return switch (guarded) {
            case UPDATE -> service.update(DATASOURCE_ID, stored());
            case FIND -> service.findByIdWithPermission(DATASOURCE_ID);
            case TEST -> service.testDatasource(stored());
            case DELETE -> service.delete(DATASOURCE_ID);
            case GET_PERMISSIONS -> service.getPermissions(DATASOURCE_ID);
            case GRANT -> service.grantPermission(DATASOURCE_ID, Set.of(GRANTEE_ID), null, ResourceRole.OWNER);
            case UPDATE_PERMISSION -> service.updatePermission(PERMISSION_ID, ResourceRole.OWNER);
            case DELETE_PERMISSION -> service.deletePermission(PERMISSION_ID);
        };
    }

    /** N1: with no visitor the call is NOT_AUTHORIZED, nothing guarded runs, and the permission service is never asked. */
    @ParameterizedTest(name = "{0}")
    @EnumSource(GuardedCall.class)
    void noVisitor_isRefusedBeforeTheGuardedCallNEW115(GuardedCall guarded) {
        stubCollaborators();
        org.mockito.Mockito.when(sessionUserService.getVisitorId()).thenReturn(Mono.empty());

        StepVerifier.create(call(guarded))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.NOT_AUTHORIZED);
                    assertThat(((BizException) error).getMessageKey()).isEqualTo(NOT_AUTHORIZED_KEY);
                })
                .verify();

        say("%s, no visitor: refused, events %s", guarded, events);
        assertThat(events).as("[NEW-115] events of %s with no visitor", guarded).isEqualTo(guarded.eventsBeforeTheCheck);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(any(), any(), any());
    }

    /** N2 (control): a visitor is checked for MANAGE_DATASOURCES on the datasource, once, and the call goes through. */
    @ParameterizedTest(name = "{0}")
    @EnumSource(GuardedCall.class)
    void visitor_isCheckedForManageOnTheDatasourceNEW115(GuardedCall guarded) {
        stubCollaborators();
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(eq(VISITOR_ID), eq(DATASOURCE_ID), any()))
                .thenAnswer(invocation -> invocation.getArgument(2) == MANAGE_DATASOURCES
                        ? Mono.empty()
                        : Mono.error(new BizException(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY)));

        StepVerifier.create(call(guarded)).expectNextCount(1).verifyComplete();

        say("%s, visitor %s: went through, events %s", guarded, VISITOR_ID, events);
        verify(resourcePermissionService).checkResourcePermissionWithError(VISITOR_ID, DATASOURCE_ID, MANAGE_DATASOURCES);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(eq(VISITOR_ID), eq(DATASOURCE_ID),
                eq(org.lowcoder.domain.permission.model.ResourceAction.USE_DATASOURCES));
    }
}
