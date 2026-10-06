package org.lowcoder.domain.permission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;
import static org.lowcoder.sdk.exception.BizError.NO_RESOURCE_FOUND;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Why the bundle flag setters ({@code BundleApiServiceImpl.setBundlePublicToAll}, {@code ...ToMarketplace},
 * {@code ...AsAgencyProfile}) must ask {@code ResourcePermissionService.checkResourcePermissionWithError} for the bundle
 * actions {@code SET_BUNDLES_*} (BF-035, fixed): they asked for the application actions {@code SET_APPLICATIONS_*} on a
 * BUNDLE id, which no user can pass.
 *
 * <p>The real {@link ResourcePermissionServiceImpl}, the real {@link ApplicationPermissionHandler} and the real
 * {@link ApplicationServiceImpl} run here over mocked repositories and mocked org/group services. The action's resource
 * type (APPLICATION) selects the application handler, whose {@code getOrgId} looks the id up as an APPLICATION; a bundle id
 * is not one, so the lookup ends in NO_RESOURCE_FOUND before org membership is read. The result is therefore the same for
 * an organization admin, a super admin and a plain member: the setters cannot succeed for anybody, and the error is
 * NO_RESOURCE_FOUND (HTTP 500) rather than NOT_AUTHORIZED. Only the anonymous user gets NOT_AUTHORIZED (the anonymous role
 * may not do EDITOR actions).
 *
 * <p>The service's answer for an application action on a bundle id is unchanged by the fix (it is the reason for it); the
 * fixed path is {@link #bundleActionsWithTheRealBundleHandler_letOrgAdminsAndBundleEditorsSetTheFlagsBF035}, where the real
 * {@link BundlePermissionHandler} resolves the bundle's organization. These tests cannot show what the controller returns over
 * HTTP, nor that a bundle was changed (the bundle service is not in this chain).
 */
class BundleIdUnderApplicationActionPermissionTest {

    private static final String USER_ID = "user-1";
    private static final String ORG_ID = "org1";
    private static final String BUNDLE_ID = "bundleid1";
    private static final String BUNDLE_GID = "bundle-gid-1"; // an id with a dash is looked up as a GID
    private static final String APPLICATION_ID = "applicationid1";

    private ApplicationRepository applicationRepository;
    private OrgMemberService orgMemberService;
    private GroupMemberService groupMemberService;
    private ResourcePermissionRepository permissionRepository;
    private ResourcePermissionHandlerService bundleHandler;
    private ResourcePermissionServiceImpl service;

    @BeforeEach
    void setUp() {
        applicationRepository = mock(ApplicationRepository.class);
        orgMemberService = mock(OrgMemberService.class);
        groupMemberService = mock(GroupMemberService.class);
        permissionRepository = mock(ResourcePermissionRepository.class);
        bundleHandler = mock(ResourcePermissionHandlerService.class);
        ResourcePermissionHandlerService datasourceHandler = mock(ResourcePermissionHandlerService.class);

        // the real application service: only the repository is mocked, so findByIdWithoutDsl keeps its real fall-through
        ApplicationServiceImpl applicationService = new ApplicationServiceImpl(null, null, applicationRepository, null, null);
        TemplateSolutionService templateSolutionService = mock(TemplateSolutionService.class);
        when(templateSolutionService.getTemplateApplicationIds(anyCollection())).thenReturn(Mono.just(Set.of()));

        ApplicationPermissionHandler applicationHandler = new ApplicationPermissionHandler(applicationService, templateSolutionService);
        service = new ResourcePermissionServiceImpl(permissionRepository, applicationHandler, datasourceHandler, bundleHandler);
        ReflectionTestUtils.setField(applicationHandler, "resourcePermissionService", service);
        ReflectionTestUtils.setField(applicationHandler, "groupMemberService", groupMemberService);
        ReflectionTestUtils.setField(applicationHandler, "orgMemberService", orgMemberService);
        ReflectionTestUtils.setField(applicationHandler, "config", mock(CommonConfig.class));

        // no application, whatever the form of the id (slug, GID or object id): what a bundle id looks like to this lookup
        when(applicationRepository.findBySlug(anyString())).thenReturn(Flux.empty());
        when(applicationRepository.findByGid(anyString())).thenReturn(Flux.empty());
        when(applicationRepository.findById(anyString())).thenReturn(Mono.empty());
        when(groupMemberService.getUserGroupIdsInOrg(anyString(), anyString())).thenReturn(Mono.just(List.of()));
    }

    private void stubMember(MemberRole role) {
        when(orgMemberService.getOrgMember(ORG_ID, USER_ID)).thenReturn(Mono.just(OrgMember.builder()
                .orgId(ORG_ID).userId(USER_ID).role(role).build()));
    }

    private static void assertBizError(Throwable error, BizError expected) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getBizErrorCode()).as("error code of %s", error).isEqualTo(expected.getBizErrorCode());
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(value = ResourceAction.class, names = {
            "SET_APPLICATIONS_PUBLIC", "SET_APPLICATIONS_PUBLIC_TO_MARKETPLACE", "SET_APPLICATIONS_AS_AGENCY_PROFILE"})
    void bundleIdUnderApplicationAction_failsForEveryUser_whyTheSettersAskBundleActions(ResourceAction action) {
        assertThat(action.getResourceType()).as("the action belongs to APPLICATION, so the application handler decides")
                .isEqualTo(ResourceType.APPLICATION);

        for (String bundleId : List.of(BUNDLE_ID, BUNDLE_GID)) {
            for (MemberRole role : MemberRole.values()) {
                stubMember(role);
                StepVerifier.create(service.checkResourcePermissionWithError(USER_ID, bundleId, action))
                        .as(action + " on bundle id " + bundleId + " as " + role)
                        .expectErrorSatisfies(error -> assertBizError(error, NO_RESOURCE_FOUND))
                        .verify();
            }
        }
        // the application lookup is what fails: it was asked with the bundle id (object id and GID form), and org
        // membership was never read
        verify(applicationRepository, org.mockito.Mockito.atLeastOnce()).findById(BUNDLE_ID);
        verify(applicationRepository, org.mockito.Mockito.atLeastOnce()).findByGid(BUNDLE_GID);
        verify(orgMemberService, never()).getOrgMember(anyString(), anyString());
        verify(permissionRepository, never()).getByResourceTypeAndResourceIds(any(), anyCollection());
        verify(bundleHandler, never()).getAllMatchingPermissions(anyString(), anyCollection(), any());
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(value = ResourceAction.class, names = {
            "SET_APPLICATIONS_PUBLIC", "SET_APPLICATIONS_PUBLIC_TO_MARKETPLACE", "SET_APPLICATIONS_AS_AGENCY_PROFILE"})
    void bundleIdUnderApplicationAction_anonymousUserIsNotAuthorized(ResourceAction action) {
        StepVerifier.create(service.checkResourcePermissionWithError(Authentication.ANONYMOUS_USER_ID, BUNDLE_ID, action))
                .expectErrorSatisfies(error -> assertBizError(error, NOT_AUTHORIZED))
                .verify();
        verify(applicationRepository, never()).findById(anyString());
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(value = ResourceAction.class, names = {
            "SET_APPLICATIONS_PUBLIC", "SET_APPLICATIONS_PUBLIC_TO_MARKETPLACE", "SET_APPLICATIONS_AS_AGENCY_PROFILE"})
    void sameActionsOnAnApplicationId_workThroughTheSameHandler(ResourceAction action) {
        // control: the handler and the service are wired correctly, so the failure above is about the id, not the setup
        when(applicationRepository.findById(APPLICATION_ID))
                .thenReturn(Mono.just(Application.builder().organizationId(ORG_ID).build()));

        stubMember(MemberRole.ADMIN);
        StepVerifier.create(service.checkResourcePermissionWithError(USER_ID, APPLICATION_ID, action)).verifyComplete();

        stubMember(MemberRole.MEMBER);
        when(permissionRepository.getByResourceTypeAndResourceIds(eq(ResourceType.APPLICATION), anyCollection()))
                .thenReturn(Mono.just(Map.of()));
        StepVerifier.create(service.checkResourcePermissionWithError(USER_ID, APPLICATION_ID, action))
                .expectErrorSatisfies(error -> assertBizError(error, NOT_AUTHORIZED))
                .verify();

        ResourcePermission editor = ResourcePermission.builder()
                .resourceType(ResourceType.APPLICATION).resourceId(APPLICATION_ID)
                .resourceHolder(ResourceHolder.USER).resourceHolderId(USER_ID)
                .resourceRole(ResourceRole.EDITOR).build();
        Map<String, Collection<ResourcePermission>> granted = Map.of(APPLICATION_ID, List.of(editor));
        when(permissionRepository.getByResourceTypeAndResourceIds(eq(ResourceType.APPLICATION), anyCollection()))
                .thenReturn(Mono.just(granted));
        StepVerifier.create(service.checkResourcePermissionWithError(USER_ID, APPLICATION_ID, action)).verifyComplete();
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(value = ResourceAction.class, names = {
            "SET_BUNDLES_PUBLIC", "SET_BUNDLES_PUBLIC_TO_MARKETPLACE", "SET_BUNDLES_AS_AGENCY_PROFILE"})
    void bundleActions_areRoutedToTheBundleHandler_neverToTheApplicationHandler(ResourceAction action) {
        // the unused SET_BUNDLES_* actions reach the bundle handler, which is where a bundle id can be resolved
        assertThat(action.getResourceType()).isEqualTo(ResourceType.BUNDLE);
        when(bundleHandler.getAllMatchingPermissions(eq(USER_ID), anyCollection(), eq(action)))
                .thenReturn(Mono.just(Map.of(BUNDLE_ID, List.of(ResourcePermission.builder()
                        .resourceType(ResourceType.BUNDLE).resourceId(BUNDLE_ID).resourceRole(ResourceRole.OWNER).build()))));

        StepVerifier.create(service.checkResourcePermissionWithError(USER_ID, BUNDLE_ID, action)).verifyComplete();

        verify(bundleHandler).getAllMatchingPermissions(eq(USER_ID), anyCollection(), eq(action));
        verify(applicationRepository, never()).findById(anyString());
        verify(applicationRepository, never()).findBySlug(anyString());
    }

    /**
     * BF-035 fixed: the bundle actions, with the real bundle handler (only its bundle service is mocked), let an organization
     * admin and a member holding EDITOR on the bundle set the flags, and refuse a member with no permission or only VIEWER
     * (the actions need EDITOR) with NOT_AUTHORIZED.
     */
    @ParameterizedTest(name = "{0}")
    @EnumSource(value = ResourceAction.class, names = {
            "SET_BUNDLES_PUBLIC", "SET_BUNDLES_PUBLIC_TO_MARKETPLACE", "SET_BUNDLES_AS_AGENCY_PROFILE"})
    void bundleActionsWithTheRealBundleHandler_letOrgAdminsAndBundleEditorsSetTheFlagsBF035(ResourceAction action) {
        BundleService bundleService = mock(BundleService.class);
        when(bundleService.findById(BUNDLE_ID)).thenReturn(Mono.just(Bundle.builder().organizationId(ORG_ID).build()));
        BundlePermissionHandler realBundleHandler = new BundlePermissionHandler(bundleService, mock(TemplateSolutionService.class));
        ResourcePermissionServiceImpl withRealBundleHandler = new ResourcePermissionServiceImpl(permissionRepository,
                mock(ResourcePermissionHandlerService.class), mock(ResourcePermissionHandlerService.class), realBundleHandler);
        ReflectionTestUtils.setField(realBundleHandler, "resourcePermissionService", withRealBundleHandler);
        ReflectionTestUtils.setField(realBundleHandler, "groupMemberService", groupMemberService);
        ReflectionTestUtils.setField(realBundleHandler, "orgMemberService", orgMemberService);
        ReflectionTestUtils.setField(realBundleHandler, "config", mock(CommonConfig.class));

        stubMember(MemberRole.ADMIN);
        StepVerifier.create(withRealBundleHandler.checkResourcePermissionWithError(USER_ID, BUNDLE_ID, action)).as("org admin").verifyComplete();

        stubMember(MemberRole.MEMBER);
        for (ResourceRole granted : new ResourceRole[] {null, ResourceRole.VIEWER, ResourceRole.EDITOR}) {
            Map<String, Collection<ResourcePermission>> permissions = granted == null ? Map.of() : Map.of(BUNDLE_ID, List.of(
                    ResourcePermission.builder().resourceType(ResourceType.BUNDLE).resourceId(BUNDLE_ID)
                            .resourceHolder(ResourceHolder.USER).resourceHolderId(USER_ID).resourceRole(granted).build()));
            when(permissionRepository.getByResourceTypeAndResourceIds(eq(ResourceType.BUNDLE), anyCollection())).thenReturn(Mono.just(permissions));
            StepVerifier.Step<Void> check = StepVerifier.create(withRealBundleHandler.checkResourcePermissionWithError(USER_ID, BUNDLE_ID, action))
                    .as("member with " + granted);
            if (granted == ResourceRole.EDITOR) {
                check.verifyComplete();
            } else {
                check.expectErrorSatisfies(error -> assertBizError(error, NOT_AUTHORIZED)).verify();
            }
            System.out.println("[BundleIdUnderApplicationActionPermissionTest] " + action + ", member with " + granted + " on the bundle: "
                    + (granted == ResourceRole.EDITOR ? "allowed" : "NOT_AUTHORIZED"));
        }
        verify(applicationRepository, never()).findById(anyString());
    }
}
