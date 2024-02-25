package org.lowcoder.api.home;

import static java.util.Objects.isNull;
import static org.lowcoder.domain.permission.model.ResourceAction.READ_APPLICATIONS;
import static org.lowcoder.infra.util.MonoUtils.emptyIfNull;
import static org.lowcoder.sdk.util.StreamUtils.collectList;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.annotation.Nullable;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationInfoView.ApplicationInfoViewBuilder;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.api.usermanagement.view.OrgAndVisitorRoleView;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.interaction.UserApplicationInteraction;
import org.lowcoder.domain.interaction.UserApplicationInteractionService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.domain.user.service.UserStatusService;
import org.lowcoder.infra.util.NetworkUtils;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@Component
public class UserHomeApiServiceImpl implements UserHomeApiService {


    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private OrgMemberService orgMemberService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ResourcePermissionService resourcePermissionService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserStatusService userStatusService;

    @Autowired
    private OrgDevChecker orgDevChecker;
    @Autowired
    private FolderApiService folderApiService;
    @Autowired
    private UserApplicationInteractionService userApplicationInteractionService;

    @Autowired
    private CommonConfig config;

    @Override
    public Mono<UserProfileView> buildUserProfileView(User user, ServerWebExchange exchange) {

        if (user.isAnonymous()) {
            return Mono.just(UserProfileView.builder()
                    .isAnonymous(true)
                    .username(user.getName())
                    .ip(NetworkUtils.getRemoteIp(exchange))
                    .build()
            );
        }

        Mono<UserStatus> userStatusMono = userStatusService.findByUserId(user.getId());

        return Mono.zip(userStatusMono, orgMemberService.getUserOrgMemberInfo(user.getId()))
                .flatMap(tuple -> {
                    UserStatus userStatus = tuple.getT1();
                    OrgMember currentOrgMember = tuple.getT2().currentOrgMember();
                    List<OrgMember> orgMembers = tuple.getT2().orgMembers();
                    List<String> orgIds = collectList(orgMembers, OrgMember::getOrgId);
                    Mono<List<OrgAndVisitorRoleView>> orgAndRolesMono = organizationService.getByIds(orgIds)
                            .collectMap(Organization::getId, Function.identity())
                            .map(map -> orgMembers.stream()
                                    .map(member -> {
                                        String orgId = member.getOrgId();
                                        Organization organization = map.get(orgId);
                                        if (organization == null) {
                                            return null;
                                        }
                                        return new OrgAndVisitorRoleView(organization, member.getRole().getValue());
                                    })
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList()));

                    String currentOrgId = currentOrgMember.getOrgId();

                    return Mono.zip(orgAndRolesMono, orgDevChecker.isCurrentOrgDev())
                            .map(tuple2 -> {
                                List<OrgAndVisitorRoleView> orgAndRoles = tuple2.getT1();
                                boolean isOrgDev = tuple2.getT2();
                                return UserProfileView.builder()
                                        .id(user.getId())
                                        .username(user.getName())
                                        .isAnonymous(user.isAnonymous())
                                        .avatarUrl(user.getAvatarUrl())
                                        .avatar(user.getAvatar())
                                        .connections(user.getConnections())
                                        .currentOrgId(currentOrgId)
                                        .orgAndRoles(orgAndRoles)
                                        .hasPassword(StringUtils.isNotBlank(user.getPassword()))
                                        .hasSetNickname(user.isHasSetNickname())
                                        .userStatus(userStatus.getStatusMap())
                                        .isOrgDev(isOrgDev)
                                        .createdTimeMs(user.getCreatedAt().toEpochMilli())
                                        .ip(NetworkUtils.getRemoteIp(exchange))
                                        .build();
                            });
                });
    }

    @Override
    public Mono<Boolean> markNewUserGuidanceShown(String userId) {
        return userStatusService.markNewUserGuidanceShown(userId);
    }

    public Mono<UserHomepageView> getUserHomePageView(ApplicationType applicationType) {

        Mono<User> userMono = sessionUserService.getVisitor();

        Mono<String> currentOrgIdMono = sessionUserService.getVisitorOrgMemberCache()
                .map(OrgMember::getOrgId);

        return Mono.zip(userMono, currentOrgIdMono)
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    String currentOrgId = tuple.getT2();

                    UserHomepageView userHomepageVO = new UserHomepageView();
                    userHomepageVO.setUser(user);

                    if (StringUtils.isBlank(currentOrgId)) {
                        return Mono.just(userHomepageVO);
                    }

                    return organizationService.getById(currentOrgId)
                            .zipWith(folderApiService.getElements(null, applicationType).collectList())
                            .map(tuple2 -> {
                                Organization organization = tuple2.getT1();
                                List<?> list = tuple2.getT2();
                                List<ApplicationInfoView> applicationInfoViews = list.stream()
                                        .map(o -> {
                                            if (o instanceof ApplicationInfoView applicationInfoView) {
                                                return applicationInfoView;
                                            }
                                            return null;
                                        })
                                        .filter(Objects::nonNull)
                                        .toList();
                                List<FolderInfoView> folderInfoViews = list.stream()
                                        .map(o -> {
                                            if (o instanceof FolderInfoView folderInfoView) {
                                                return folderInfoView;
                                            }
                                            return null;
                                        })
                                        .filter(Objects::nonNull)
                                        .toList();
                                userHomepageVO.setOrganization(organization);
                                userHomepageVO.setHomeApplicationViews(applicationInfoViews);
                                userHomepageVO.setFolderInfoViews(folderInfoViews);
                                return userHomepageVO;
                            });
                });
    }

    @Override
    public Flux<ApplicationInfoView> getAllAuthorisedApplications4CurrentOrgMember(@Nullable ApplicationType applicationType,
            @Nullable ApplicationStatus applicationStatus, boolean withContainerSize) {

        return sessionUserService.getVisitorOrgMemberCache()
                .flatMapMany(orgMember -> {
                    String visitorId = orgMember.getUserId();
                    String currentOrgId = orgMember.getOrgId();
                    // application flux
                    Flux<Application> applicationFlux = Flux.defer(() -> {
                                if (withContainerSize) {
                                    return applicationService.findByOrganizationIdWithDsl(currentOrgId);
                                }
                                return applicationService.findByOrganizationIdWithoutDsl(currentOrgId);
                            })
                            .filter(application -> isNull(applicationType) || application.getApplicationType() == applicationType.getValue())
                            .filter(application -> isNull(applicationStatus) || application.getApplicationStatus() == applicationStatus)
                            .cache()
                            .collectList()
                            .flatMapIterable(Function.identity());

                    // last view time
                    Mono<Map<String, Instant>> applicationLastViewTimeMapMono = userApplicationInteractionService.findByUserId(visitorId)
                            .collectMap(UserApplicationInteraction::applicationId, UserApplicationInteraction::lastViewTime)
                            .cache();

                    Mono<Map<String, ResourcePermission>> resourcePermissionMapMono = applicationFlux
                            .mapNotNull(Application::getId)
                            .collectList()
                            .flatMap(applicationIds -> resourcePermissionService.getMaxMatchingPermission(visitorId, applicationIds,
                                    READ_APPLICATIONS))
                            .cache();

                    // user map
                    Mono<Map<String, User>> userMapMono = applicationFlux
                            .flatMap(application -> emptyIfNull(application.getCreatedBy()))
                            .collectList()
                            .flatMap(creatorIds -> userService.getByIds(creatorIds))
                            .cache();

                    return applicationFlux
                            .flatMap(application -> Mono.zip(Mono.just(application), resourcePermissionMapMono, userMapMono,
                                    applicationLastViewTimeMapMono))
                            .filter(tuple -> {
                                // filter by permission
                                Application application = tuple.getT1();
                                Map<String, ResourcePermission> resourcePermissionMap = tuple.getT2();
                                return resourcePermissionMap.containsKey(application.getId());
                            })
                            .map(tuple -> {
                                // build view
                                Application application = tuple.getT1();
                                Map<String, ResourcePermission> resourcePermissionMap = tuple.getT2();
                                Map<String, User> userMap = tuple.getT3();
                                Map<String, Instant> applicationLastViewTimeMap = tuple.getT4();
                                ResourceRole resourceRole = resourcePermissionMap.get(application.getId()).getResourceRole();
                                return buildView(application, resourceRole, userMap, applicationLastViewTimeMap.get(application.getId()),
                                        withContainerSize);
                            });
                });
    }

    @Override
    public Flux<MarketplaceApplicationInfoView> getAllMarketplaceApplications(@Nullable ApplicationType applicationType) {

        return sessionUserService.isAnonymousUser()
                .flatMapMany(isAnonymousUser -> {

                    if(config.getMarketplace().isPrivateMode() && isAnonymousUser) {
                        return Mono.empty();
                    }

                    // application flux
                    Flux<Application> applicationFlux = Flux.defer(() -> applicationService.findAllMarketplaceApps())
                            .filter(application -> isNull(applicationType) || application.getApplicationType() == applicationType.getValue())
                            .cache();

                    // user map
                    Mono<Map<String, User>> userMapMono = applicationFlux
                            .flatMap(application -> emptyIfNull(application.getCreatedBy()))
                            .collectList()
                            .flatMap(creatorIds -> userService.getByIds(creatorIds))
                            .cache();

                    // org map
                    Mono<Map<String, Organization>> orgMapMono = applicationFlux
                            .flatMap(application -> emptyIfNull(application.getOrganizationId()))
                            .collectList()
                            .flatMap(orgIds -> organizationService.getByIds(orgIds)
                                    .collectList()
                                    .map(it -> it.stream().collect(Collectors.toMap(Organization::getId, Function.identity())))
                            )
                            .cache();


                    return applicationFlux
                            .flatMap(application -> Mono.zip(Mono.just(application), userMapMono, orgMapMono))
                            .map(tuple2 -> {
                                // build view
                                Application application = tuple2.getT1();
                                Map<String, User> userMap = tuple2.getT2();
                                Map<String, Organization> orgMap = tuple2.getT3();
                                MarketplaceApplicationInfoView marketplaceApplicationInfoView = MarketplaceApplicationInfoView.builder()
                                        .applicationId(application.getId())
                                        .name(application.getName())
                                        .applicationType(application.getApplicationType())
                                        .applicationStatus(application.getApplicationStatus())
                                        .orgId(application.getOrganizationId())
                                        .orgName(orgMap.get(application.getOrganizationId()).getName())
                                        .creatorEmail(Optional.ofNullable(userMap.get(application.getCreatedBy()))
                                                .map(User::getName)
                                                .orElse(""))
                                        .createAt(application.getCreatedAt().toEpochMilli())
                                        .createBy(application.getCreatedBy())
                                        .build();

                                // marketplace specific fields
                                Map<String, Object> marketplaceMeta = (Map<String, Object>)
                                        ((Map<String, Object>)application.getEditingApplicationDSL().get("ui")).get("marketplaceMeta");
                                marketplaceApplicationInfoView.setTitle((String)marketplaceMeta.get("title"));
                                marketplaceApplicationInfoView.setCategory((String)marketplaceMeta.get("category"));
                                marketplaceApplicationInfoView.setDescription((String)marketplaceMeta.get("description"));
                                marketplaceApplicationInfoView.setImage((String)marketplaceMeta.get("image"));

                                return marketplaceApplicationInfoView;

                            });

                });
    }

    @Override
    public Flux<MarketplaceApplicationInfoView> getAllAgencyProfileApplications(@Nullable ApplicationType applicationType) {

        return sessionUserService.getVisitorOrgMemberCache()
                .flatMapMany(orgMember -> {
                    // application flux
                    Flux<Application> applicationFlux = Flux.defer(() -> applicationService.findAllAgencyProfileApps())
                            .filter(application -> isNull(applicationType) || application.getApplicationType() == applicationType.getValue())
                            .cache();

                    // user map
                    Mono<Map<String, User>> userMapMono = applicationFlux
                            .flatMap(application -> emptyIfNull(application.getCreatedBy()))
                            .collectList()
                            .flatMap(creatorIds -> userService.getByIds(creatorIds))
                            .cache();

                    // org map
                    Mono<Map<String, Organization>> orgMapMono = applicationFlux
                            .flatMap(application -> emptyIfNull(application.getOrganizationId()))
                            .collectList()
                            .flatMap(orgIds -> organizationService.getByIds(orgIds)
                                    .collectList()
                                    .map(it -> it.stream().collect(Collectors.toMap(Organization::getId, Function.identity())))
                            )
                            .cache();


                    return applicationFlux
                            .flatMap(application -> Mono.zip(Mono.just(application), userMapMono, orgMapMono))
                            .map(tuple -> {
                                // build view
                                Application application = tuple.getT1();
                                Map<String, User> userMap = tuple.getT2();
                                Map<String, Organization> orgMap = tuple.getT3();
                                return MarketplaceApplicationInfoView.builder()
                                        .applicationId(application.getId())
                                        .name(application.getName())
                                        .applicationType(application.getApplicationType())
                                        .applicationStatus(application.getApplicationStatus())
                                        .orgId(application.getOrganizationId())
                                        .orgName(orgMap.get(application.getOrganizationId()).getName())
                                        .creatorEmail(Optional.ofNullable(userMap.get(application.getCreatedBy()))
                                                .map(User::getName)
                                                .orElse(""))
                                        .createAt(application.getCreatedAt().toEpochMilli())
                                        .createBy(application.getCreatedBy())
                                        .build();
                            });

                });
    }

    private ApplicationInfoView buildView(Application application, ResourceRole maxRole, Map<String, User> userMap, @Nullable Instant lastViewTime,
            boolean withContainerSize) {
        ApplicationInfoViewBuilder applicationInfoViewBuilder = ApplicationInfoView.builder()
                .applicationId(application.getId())
                .orgId(application.getOrganizationId())
                .name(application.getName())
                .createBy(Optional.ofNullable(userMap.get(application.getCreatedBy()))
                        .map(User::getName)
                        .orElse(""))
                .createAt(application.getCreatedAt().toEpochMilli())
                .role(maxRole.getValue())
                .applicationType(application.getApplicationType())
                .applicationStatus(application.getApplicationStatus())
                .lastModifyTime(application.getUpdatedAt())
                .lastViewTime(lastViewTime)
                .publicToAll(application.isPublicToAll())
                .publicToMarketplace(application.isPublicToMarketplace());
        if (withContainerSize) {
            return applicationInfoViewBuilder
                    .containerSize(application.getLiveContainerSize())
                    .build();
        }
        return applicationInfoViewBuilder.build();
    }

}
