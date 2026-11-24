package org.lowcoder.api.npm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.BiFunction;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberServiceImpl;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.InOrder;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Pins D-35: the npm registry proxy must check READ on the path's {@code applicationId} before resolving the
 * workspace or forwarding anything to node-service. One case per outcome, run for both endpoint methods.
 */
class PrivateNpmRegistryControllerPermissionTest {

    private static final String APPLICATION_ID = "PrivateNpmRegistryControllerPermissionTest.applicationId";
    private static final String ORG_ID = "PrivateNpmRegistryControllerPermissionTest.orgId";
    private static final String OUTSIDER_ID = "PrivateNpmRegistryControllerPermissionTest.outsiderId";
    private static final String VISITOR_ID = "PrivateNpmRegistryControllerPermissionTest.visitorId";
    private static final String PATH = "some-package";

    private OrganizationService organizationService;
    private SessionUserService sessionUserService;
    private NodeServerHelper nodeServerHelper;
    private OrgMemberServiceImpl orgMemberServiceImpl;
    private ApplicationServiceImpl applicationServiceImpl;
    private ResourcePermissionService resourcePermissionService;
    private PrivateNpmRegistryController controller;

    private static Stream<BiFunction<PrivateNpmRegistryController, String, Mono<ResponseEntity<Resource>>>> endpoints() {
        return Stream.of(
                (c, id) -> c.getNpmPackageMeta(id, PATH),
                (c, id) -> c.getNpmPackageAsset(id, PATH)
        );
    }

    private void setUp() {
        organizationService = mock(OrganizationService.class);
        sessionUserService = mock(SessionUserService.class);
        nodeServerHelper = mock(NodeServerHelper.class);
        orgMemberServiceImpl = mock(OrgMemberServiceImpl.class);
        applicationServiceImpl = mock(ApplicationServiceImpl.class);
        resourcePermissionService = mock(ResourcePermissionService.class);
        controller = new PrivateNpmRegistryController(organizationService, sessionUserService, nodeServerHelper,
                orgMemberServiceImpl, applicationServiceImpl, resourcePermissionService);
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void anonymousVisitorDenied(BiFunction<PrivateNpmRegistryController, String, Mono<ResponseEntity<Resource>>> endpoint) {
        setUp();
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID));
        when(resourcePermissionService.checkResourcePermissionWithError(
                org.lowcoder.sdk.constants.Authentication.ANONYMOUS_USER_ID, APPLICATION_ID, ResourceAction.READ_APPLICATIONS))
                .thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));

        StepVerifier.create(endpoint.apply(controller, APPLICATION_ID))
                .expectErrorMatches(e -> e instanceof BizException be && be.getError() == BizError.NOT_AUTHORIZED)
                .verify();

        verify(applicationServiceImpl, never()).findById(any());
        verify(organizationService, never()).getById(any());
        verify(organizationService, never()).getOrgCommonSettings(any());
        verify(nodeServerHelper, never()).createUri(any());
        System.out.println("[PrivateNpmRegistryControllerPermissionTest] anonymousVisitorDenied: NOT_AUTHORIZED, nothing resolved or forwarded");
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void signedInOutsiderDenied(BiFunction<PrivateNpmRegistryController, String, Mono<ResponseEntity<Resource>>> endpoint) {
        setUp();
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(OUTSIDER_ID));
        when(resourcePermissionService.checkResourcePermissionWithError(OUTSIDER_ID, APPLICATION_ID, ResourceAction.READ_APPLICATIONS))
                .thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));

        StepVerifier.create(endpoint.apply(controller, APPLICATION_ID))
                .expectErrorMatches(e -> e instanceof BizException be && be.getError() == BizError.NOT_AUTHORIZED)
                .verify();

        verify(applicationServiceImpl, never()).findById(any());
        verify(organizationService, never()).getById(any());
        verify(organizationService, never()).getOrgCommonSettings(any());
        verify(nodeServerHelper, never()).createUri(any());
        System.out.println("[PrivateNpmRegistryControllerPermissionTest] signedInOutsiderDenied: NOT_AUTHORIZED, nothing resolved or forwarded");
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void allowed(BiFunction<PrivateNpmRegistryController, String, Mono<ResponseEntity<Resource>>> endpoint) {
        setUp();
        AtomicBoolean findByIdSubscribed = new AtomicBoolean(false);
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        when(resourcePermissionService.checkResourcePermissionWithError(VISITOR_ID, APPLICATION_ID, ResourceAction.READ_APPLICATIONS))
                .thenReturn(Mono.empty());
        when(applicationServiceImpl.findById(APPLICATION_ID))
                .thenReturn(Mono.just(Application.builder().id(APPLICATION_ID).organizationId(ORG_ID).build())
                        .doOnSubscribe(s -> findByIdSubscribed.set(true)));
        when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(Organization.builder().id(ORG_ID).build()));
        when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.empty());

        StepVerifier.create(endpoint.apply(controller, APPLICATION_ID)).verifyComplete();

        assertThat(findByIdSubscribed).isTrue();
        InOrder order = inOrder(resourcePermissionService, applicationServiceImpl, organizationService);
        order.verify(resourcePermissionService).checkResourcePermissionWithError(VISITOR_ID, APPLICATION_ID, ResourceAction.READ_APPLICATIONS);
        order.verify(applicationServiceImpl).findById(APPLICATION_ID);
        order.verify(organizationService).getById(ORG_ID);
        order.verify(organizationService).getOrgCommonSettings(ORG_ID);
        verify(resourcePermissionService, times(1))
                .checkResourcePermissionWithError(VISITOR_ID, APPLICATION_ID, ResourceAction.READ_APPLICATIONS);
        System.out.println("[PrivateNpmRegistryControllerPermissionTest] allowed: check ran before findById/getById/getOrgCommonSettings");
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void noneUnchanged(BiFunction<PrivateNpmRegistryController, String, Mono<ResponseEntity<Resource>>> endpoint) {
        setUp();
        when(sessionUserService.getVisitorOrgMemberCache())
                .thenReturn(Mono.just(org.lowcoder.domain.organization.model.OrgMember.builder().orgId(ORG_ID).build()));
        when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.empty());

        StepVerifier.create(endpoint.apply(controller, "none")).verifyComplete();

        verifyNoInteractions(resourcePermissionService);
        System.out.println("[PrivateNpmRegistryControllerPermissionTest] noneUnchanged: no permission check for 'none'");
    }
}
