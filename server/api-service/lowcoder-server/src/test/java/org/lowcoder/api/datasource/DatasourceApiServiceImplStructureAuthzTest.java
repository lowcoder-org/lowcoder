package org.lowcoder.api.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.permission.model.ResourceAction.MANAGE_DATASOURCES;
import static org.lowcoder.domain.permission.model.ResourceAction.USE_DATASOURCES;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.datasource.service.DatasourceStructureService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * NEW-114: {@link DatasourceApiServiceImpl#getStructureWithPermission} checks {@code USE_DATASOURCES} on the one id before the
 * structure service is called, and refuses a call with no visitor.
 *
 * <p>Every case stubs the structure service to answer a structure (leniently: a correct implementation never calls it on a
 * refusal), so a mutation that reaches it fails on an assertion, not on a NullPointerException of an unstubbed mock. The
 * constructor takes 16 collaborators; Mockito passes null for those not mocked here, none is used on this path.
 */
@ExtendWith(MockitoExtension.class)
class DatasourceApiServiceImplStructureAuthzTest {

    private static final String LOG_PREFIX = "[DatasourceApiServiceImplStructureAuthzTest] ";

    private static final String VISITOR_ID = "visitor-structure-authz";
    private static final String DATASOURCE_ID = "datasource-structure-authz";
    private static final String TABLE_NAME = "structure_authz_table";
    private static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";

    private static final DatasourceStructure STRUCTURE = new DatasourceStructure(new ArrayList<>(List.of(
            new DatasourceStructure.Table(DatasourceStructure.TableType.TABLE, "public", TABLE_NAME,
                    new ArrayList<>(), new ArrayList<>(), new ArrayList<>()))));

    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private DatasourceStructureService datasourceStructureService;

    @InjectMocks
    private DatasourceApiServiceImpl service;

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    /** The visitor is {@link #VISITOR_ID}; the permission service admits {@code USE_DATASOURCES} and refuses any other action. */
    private void visitorWhoMayUse() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(eq(VISITOR_ID), eq(DATASOURCE_ID), any(ResourceAction.class)))
                .thenAnswer(invocation -> invocation.getArgument(2) == USE_DATASOURCES
                        ? Mono.<Void>empty()
                        : Mono.<Void>error(new BizException(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY)));
        lenient().when(datasourceStructureService.getStructure(eq(DATASOURCE_ID), anyBoolean())).thenReturn(Mono.just(STRUCTURE));
    }

    @ParameterizedTest(name = "ignoreCache={0}")
    @ValueSource(booleans = {true, false})
    void structure_permittedVisitor_getsTheStructureNEW114(boolean ignoreCache) {
        visitorWhoMayUse();
        say("U1: permitted visitor, ignoreCache=%s", ignoreCache);

        StepVerifier.create(service.getStructureWithPermission(DATASOURCE_ID, ignoreCache))
                .expectNext(STRUCTURE)
                .verifyComplete();

        verify(datasourceStructureService, times(1)).getStructure(DATASOURCE_ID, ignoreCache);
        say("U1: answered the structure with table %s, the structure service called once with ignoreCache=%s", TABLE_NAME, ignoreCache);
    }

    @Test
    void structure_deniedVisitor_neverReachesTheStructureServiceNEW114() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(eq(VISITOR_ID), eq(DATASOURCE_ID), any(ResourceAction.class)))
                .thenReturn(Mono.<Void>error(new BizException(BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY)));
        lenient().when(datasourceStructureService.getStructure(anyString(), anyBoolean())).thenReturn(Mono.just(STRUCTURE));
        say("U2: denied visitor");

        StepVerifier.create(service.getStructureWithPermission(DATASOURCE_ID, true))
                .expectErrorSatisfies(error -> {
                    say("U2: error %s: %s", error.getClass().getSimpleName(), error.getMessage());
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.NOT_AUTHORIZED);
                })
                .verify();

        verifyNoInteractions(datasourceStructureService);
        say("U2: the structure service was not touched");
    }

    @Test
    void structure_checksUseNotManageNEW114() {
        visitorWhoMayUse();
        say("U3: the checked action");

        StepVerifier.create(service.getStructureWithPermission(DATASOURCE_ID, false))
                .expectNext(STRUCTURE)
                .verifyComplete();

        verify(resourcePermissionService, times(1)).checkResourcePermissionWithError(VISITOR_ID, DATASOURCE_ID, USE_DATASOURCES);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(VISITOR_ID, DATASOURCE_ID, MANAGE_DATASOURCES);
        say("U3: USE_DATASOURCES checked once, MANAGE_DATASOURCES never");
    }

    @Test
    void structure_noVisitor_isRefusedNEW114() {
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.empty());
        lenient().when(datasourceStructureService.getStructure(anyString(), anyBoolean())).thenReturn(Mono.just(STRUCTURE));
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class)))
                .thenReturn(Mono.<Void>empty());
        say("U4: no visitor");

        StepVerifier.create(service.getStructureWithPermission(DATASOURCE_ID, true))
                .expectErrorSatisfies(error -> {
                    say("U4: error %s: %s", error.getClass().getSimpleName(), error.getMessage());
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.NOT_AUTHORIZED);
                    assertThat(((BizException) error).getMessageKey()).isEqualTo(NOT_AUTHORIZED_KEY);
                })
                .verify();

        verifyNoInteractions(resourcePermissionService, datasourceStructureService);
        say("U4: neither the permission service nor the structure service was touched");
    }
}
