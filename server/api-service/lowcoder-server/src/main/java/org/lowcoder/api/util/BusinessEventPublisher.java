package org.lowcoder.api.util;

import com.google.common.hash.Hashing;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordServiceImpl;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.event.*;
import org.lowcoder.infra.event.datasource.DatasourceEvent;
import org.lowcoder.infra.event.datasource.DatasourcePermissionEvent;
import org.lowcoder.infra.event.group.GroupCreateEvent;
import org.lowcoder.infra.event.group.GroupDeleteEvent;
import org.lowcoder.infra.event.group.GroupUpdateEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberAddEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberLeaveEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberRemoveEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberRoleUpdateEvent;
import org.lowcoder.infra.event.user.UserLoginEvent;
import org.lowcoder.infra.event.user.UserLogoutEvent;
import org.lowcoder.infra.util.TupleUtils;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.connection.zset.Tuple;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuples;

import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.lowcoder.domain.permission.model.ResourceHolder.USER;

@Slf4j
@RequiredArgsConstructor
@Component
public class BusinessEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final SessionUserService sessionUserService;
    private final GroupService groupService;
    private final UserService userService;
    private final FolderService folderService;
    private final ApplicationService applicationService;
    private final DatasourceService datasourceService;
    private final ResourcePermissionService resourcePermissionService;
    private final ApplicationRecordServiceImpl applicationRecordServiceImpl;

    public Mono<Void> publishFolderCommonEvent(String folderId, String folderName, String fromName, EventType eventType) {

        return sessionUserService.getVisitorToken()
                .zipWith(sessionUserService.getVisitorOrgMemberCache())
                .delayUntil(
                    tuple -> {
                        String token = tuple.getT1();
                        OrgMember orgMember = tuple.getT2();
                        FolderCommonEvent event = FolderCommonEvent.builder()
                                .id(folderId)
                                .name(folderName)
                                .userId(orgMember.getUserId())
                                .orgId(orgMember.getOrgId())
                                .type(eventType)
                                .fromName(fromName)
                                .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                .build();
                        return Mono.deferContextual(contextView -> {
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        });
                })
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishFolderCommonEvent error.{}, {}, {}", folderId, folderName, eventType, throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishApplicationCommonEvent(ApplicationView originalApplicationView, String applicationId, @Nullable String folderIdFrom, @Nullable String folderId, EventType eventType) {
        return applicationService.findByIdWithoutDsl(applicationId)
                .map(application -> {
                    ApplicationInfoView applicationInfoView = ApplicationInfoView.builder()
                            .applicationId(applicationId)
                            .name(application.getName())
                            .folderId(folderId)
                            .folderIdFrom(folderIdFrom)
                            .build();
                    return ApplicationView.builder()
                            .applicationInfoView(applicationInfoView)
                            .build();

                })
                .flatMap(applicationView -> publishApplicationCommonEvent(originalApplicationView, applicationView, eventType));
    }

    public Mono<Void> publishApplicationCommonEvent(ApplicationView originalApplicationView, ApplicationView applicationView, EventType eventType) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> sessionUserService.getVisitorOrgMemberCache()
                        .onErrorReturn(new OrgMember(null, null, null, null, 0))
                        .zipWith(Mono.defer(() -> {
                            String folderId = applicationView.getApplicationInfoView().getFolderId();
                            if (StringUtils.isBlank(folderId)) {
                                return Mono.just(Optional.<Folder>empty());
                            }
                            return folderService.findById(folderId)
                                    .map(Optional::of)
                                    .onErrorReturn(Optional.empty());
                        }))
                        .zipWith(Mono.defer(() -> {
                            String folderId = applicationView.getApplicationInfoView().getFolderIdFrom();
                            if (StringUtils.isBlank(folderId)) {
                                return Mono.just(Optional.<Folder>empty());
                            }
                            return folderService.findById(folderId)
                                    .map(Optional::of)
                                    .onErrorReturn(Optional.empty());
                        }), TupleUtils::merge)
                        .zipWith(sessionUserService.getVisitorToken())
                        .zipWith(Mono.defer(() -> {
                            String appId = applicationView.getApplicationInfoView().getApplicationId();
                            return applicationService.findById(appId)
                                    .zipWhen(application -> application.getCategory(applicationRecordServiceImpl))
                                    .zipWhen(application -> application.getT1().getDescription(applicationRecordServiceImpl))
                                    .zipWhen(application -> application.getT1().getT1().getTitle(applicationRecordServiceImpl))
                                    .map(tuple -> {
                                        String category = tuple.getT1().getT1().getT2();
                                        String description = tuple.getT1().getT2();
                                        String title = tuple.getT2();
                                        return new String[]{category, description, title};
                                    });
                        }), TupleUtils::merge)
                        .flatMap(tuple -> Mono.deferContextual(contextView -> {
                            OrgMember orgMember = tuple.getT1().getT1();
                            Optional<Folder> optional = tuple.getT1().getT2();
                            Optional<Folder> optionalFrom = tuple.getT1().getT3();
                            String token = tuple.getT2();
                            String category = tuple.getT3()[0];
                            String description = tuple.getT3()[1];
                            String title = tuple.getT3()[2];
                            ApplicationInfoView applicationInfoView = applicationView.getApplicationInfoView();

                            ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                    .orgId(orgMember.getOrgId())
                                    .userId(orgMember.getUserId())
                                    .applicationId(applicationInfoView.getApplicationId())
                                    .applicationGid(applicationInfoView.getApplicationGid())
                                    .applicationName(applicationInfoView.getName())
                                    .applicationAuthor(applicationInfoView.getCreateBy())
                                    .applicationAuthorOrgId(applicationInfoView.getOrgId())
                                    .applicationCategory(category)
                                    .applicationDescription(description)
                                    .applicationTitle(title)
                                    .oldApplicationName(originalApplicationView!=null ? originalApplicationView.getApplicationInfoView().getName() : null)
                                    .oldApplicationCategory(originalApplicationView!=null ?originalApplicationView.getApplicationInfoView().getCategory() : null)
                                    .oldApplicationDescription(originalApplicationView!=null ?originalApplicationView.getApplicationInfoView().getDescription() : null)
                                    .oldApplicationTitle(originalApplicationView!=null ?originalApplicationView.getApplicationInfoView().getTitle() : null)
                                    .type(eventType)
                                    .folderId(optional.map(Folder::getId).orElse(null))
                                    .folderName(optional.map(Folder::getName).orElse(null))
                                    .oldFolderId(optionalFrom.map(Folder::getId).orElse(null))
                                    .oldFolderName(optionalFrom.map(Folder::getName).orElse(null))
                                    .isAnonymous(anonymous)
                                    .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                    .build();

                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        })).then()  // **Ensures Mono<Void> return type**
                        .onErrorResume(throwable -> {
                            log.error("publishApplicationCommonEvent error. {}, {}", applicationView, eventType, throwable);
                            return Mono.empty();
                        }));
    }


    public Mono<Void> publishApplicationPermissionEvent(String applicationId, Set<String> userIds, Set<String> groupIds, String permissionId, String role) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> sessionUserService.getVisitorOrgMemberCache()
                        .zipWith(sessionUserService.getVisitorToken())
                        .zipWith(applicationService.findById(applicationId)
                                .zipWhen(application -> application.getCategory(applicationRecordServiceImpl))
                                .zipWhen(application -> application.getT1().getDescription(applicationRecordServiceImpl)))
                        .flatMap(tuple -> {
                            OrgMember orgMember = tuple.getT1().getT1();
                            String token = tuple.getT1().getT2();
                            String category = tuple.getT2().getT1().getT2();
                            String description = tuple.getT2().getT2();
                            Application application = tuple.getT2().getT1().getT1();

                            ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                    .orgId(orgMember.getOrgId())
                                    .userId(orgMember.getUserId())
                                    .applicationId(application.getId())
                                    .applicationGid(application.getGid())
                                    .applicationName(application.getName())
                                    .applicationCategory(category)
                                    .applicationDescription(description)
                                    .type(EventType.APPLICATION_PERMISSION_CHANGE)
                                    .permissionId(permissionId)
                                    .role(role)
                                    .userIds(userIds)
                                    .groupIds(groupIds)
                                    .isAnonymous(anonymous)
                                    .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                    .build();

                            return Mono.deferContextual(contextView -> {
                                event.populateDetails(contextView);
                                applicationEventPublisher.publishEvent(event);
                                return Mono.empty();
                            }).then();  // **Fix: Ensures Mono<Void> is returned**
                        }))
                .onErrorResume(throwable -> {
                    log.error("publishApplicationPermissionEvent error. {}, {}, {}", applicationId, permissionId, role, throwable);
                    return Mono.empty();
                });
    }
    

    public Mono<Void> publishApplicationSharingEvent(String applicationId, String shareType, ApplicationPermissionView applicationPermissionView) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> {
                    if (anonymous) {
                        return Mono.empty();
                    }
                    return sessionUserService.getVisitorOrgMemberCache()
                            .zipWith(sessionUserService.getVisitorToken())
                            .zipWith(applicationService.findById(applicationId)
                                    .zipWhen(application -> application.getCategory(applicationRecordServiceImpl))
                                    .zipWhen(application -> application.getT1().getDescription(applicationRecordServiceImpl)))
                            .flatMap(tuple -> {
                                OrgMember orgMember = tuple.getT1().getT1();
                                String token = tuple.getT1().getT2();
                                String category = tuple.getT2().getT1().getT2();
                                String description = tuple.getT2().getT2();
                                Application application = tuple.getT2().getT1().getT1();
    
                                ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                        .orgId(orgMember.getOrgId())
                                        .userId(orgMember.getUserId())
                                        .applicationId(application.getId())
                                        .applicationGid(application.getGid())
                                        .applicationName(application.getName())
                                        .applicationCategory(category)
                                        .applicationDescription(description)
                                        .type(EventType.APPLICATION_SHARING_CHANGE)
                                        .sharingDetails(applicationPermissionView)
                                        .shareType(shareType)
                                        .isAnonymous(anonymous)
                                        .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                        .build();
    
                                return Mono.deferContextual(contextView -> {
                                    event.populateDetails(contextView);
                                    applicationEventPublisher.publishEvent(event);
                                    return Mono.empty();
                                }).then();  // **Fix: Ensures Mono<Void> is returned**
                            });
                })
                .onErrorResume(throwable -> {
                    log.error("publishApplicationSharingEvent error. {}, {}", applicationId, shareType, throwable);
                    return Mono.empty();
                });
    }
    

    public Mono<Void> publishApplicationPublishEvent(String applicationId, ApplicationPublishRequest request) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> {
                    if (anonymous) {
                        return Mono.empty();
                    }
                    return sessionUserService.getVisitorOrgMemberCache()
                            .zipWith(sessionUserService.getVisitorToken())
                            .zipWith(applicationService.findById(applicationId)
                                    .zipWhen(application -> application.getCategory(applicationRecordServiceImpl))
                                    .zipWhen(application -> application.getT1().getDescription(applicationRecordServiceImpl)))
                            .flatMap(tuple -> {
                                OrgMember orgMember = tuple.getT1().getT1();
                                String token = tuple.getT1().getT2();
                                String category = tuple.getT2().getT1().getT2();
                                String description = tuple.getT2().getT2();
                                Application application = tuple.getT2().getT1().getT1();
    
                                ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                        .orgId(orgMember.getOrgId())
                                        .userId(orgMember.getUserId())
                                        .applicationId(application.getId())
                                        .applicationGid(application.getGid())
                                        .applicationName(application.getName())
                                        .applicationCategory(category)
                                        .applicationDescription(description)
                                        .type(EventType.APPLICATION_PUBLISH)
                                        .commitMessage(request.commitMessage())
                                        .tag(request.tag())
                                        .isAnonymous(anonymous)
                                        .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                        .build();
    
                                return Mono.deferContextual(contextView -> {
                                    event.populateDetails(contextView);
                                    applicationEventPublisher.publishEvent(event);
                                    return Mono.empty();
                                }).then();  // **Fix: Ensures Mono<Void> is returned**
                            });
                })
                .onErrorResume(throwable -> {
                    log.error("publishApplicationPublishEvent error. {}, {}, {}", applicationId, request.tag(), request.commitMessage(), throwable);
                    return Mono.empty();
                });
    }
    

    public Mono<Void> publishApplicationVersionChangeEvent(String applicationId, String newtag) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> {
                    if (anonymous) {
                        return Mono.empty();
                    }
                    return sessionUserService.getVisitorOrgMemberCache()
                            .zipWith(sessionUserService.getVisitorToken())
                            .zipWith(applicationService.findById(applicationId)
                                    .zipWhen(application -> application.getCategory(applicationRecordServiceImpl))
                                    .zipWhen(application -> application.getT1().getDescription(applicationRecordServiceImpl)))
                            .flatMap(tuple -> {
                                OrgMember orgMember = tuple.getT1().getT1();
                                String token = tuple.getT1().getT2();
                                String category = tuple.getT2().getT1().getT2();
                                String description = tuple.getT2().getT2();
                                Application application = tuple.getT2().getT1().getT1();
    
                                ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                        .orgId(orgMember.getOrgId())
                                        .userId(orgMember.getUserId())
                                        .applicationId(application.getId())
                                        .applicationGid(application.getGid())
                                        .applicationName(application.getName())
                                        .applicationCategory(category)
                                        .applicationDescription(description)
                                        .type(EventType.APPLICATION_VERSION_CHANGE)
                                        .tag(newtag)
                                        .isAnonymous(anonymous)
                                        .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                        .build();
    
                                return Mono.deferContextual(contextView -> {
                                    event.populateDetails(contextView);
                                    applicationEventPublisher.publishEvent(event);
                                    return Mono.empty();
                                }).then();  // **Fix: Ensures Mono<Void> is returned**
                            });
                })
                .onErrorResume(throwable -> {
                    log.error("publishApplicationVersionChangeEvent error. {}, {}", applicationId, newtag, throwable);
                    return Mono.empty();
                });
    }
    

    public Mono<Void> publishBundleCommonEvent(BundleInfoView bundleInfoView, EventType eventType) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> {
                    if (anonymous) {
                        return Mono.empty();
                    }
                    return sessionUserService.getVisitorOrgMemberCache()
                            .zipWith(Mono.defer(() -> {
                                String folderId = bundleInfoView.getFolderId();
                                if (StringUtils.isBlank(folderId)) {
                                    return Mono.just(Optional.<Folder> empty());
                                }
                                return folderService.findById(folderId)
                                        .map(Optional::of)
                                        .onErrorReturn(Optional.empty());
                            }))
                            .zipWith(Mono.defer(() -> {
                                String folderId = bundleInfoView.getFolderIdFrom();
                                if (StringUtils.isBlank(folderId)) {
                                    return Mono.just(Optional.<Folder> empty());
                                }
                                return folderService.findById(folderId)
                                        .map(Optional::of)
                                        .onErrorReturn(Optional.empty());
                            }), TupleUtils::merge)
                            .zipWith(sessionUserService.getVisitorToken())
                            .flatMap(tuple -> {
                                OrgMember orgMember = tuple.getT1().getT1();
                                Optional<Folder> optional = tuple.getT1().getT2();
                                Optional<Folder> optionalFrom = tuple.getT1().getT3();
                                String token = tuple.getT2();
                                ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                        .orgId(orgMember.getOrgId())
                                        .userId(orgMember.getUserId())
                                        .applicationId(bundleInfoView.getBundleId())
                                        .applicationGid(bundleInfoView.getBundleGid())
                                        .applicationName(bundleInfoView.getName())
                                        .type(eventType)
                                        .folderId(optional.map(Folder::getId).orElse(null))
                                        .folderName(optional.map(Folder::getName).orElse(null))
                                        .oldFolderId(optionalFrom.map(Folder::getId).orElse(null))
                                        .oldFolderName(optionalFrom.map(Folder::getName).orElse(null))
                                        .isAnonymous(anonymous)
                                        .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                        .build();
                                return Mono.deferContextual(contextView -> {
                                    event.populateDetails(contextView);
                                    applicationEventPublisher.publishEvent(event);
                                    return Mono.empty();
                                }).then();
                            })
                            .then()
                            .onErrorResume(throwable -> {
                                log.error("publishBundleCommonEvent error. {}, {}", bundleInfoView, eventType, throwable);
                                return Mono.empty();
                            });
                });
    }

    public Mono<Void> publishBundleCommonEvent(String bundleId, @Nullable String folderIdFrom, @Nullable String folderIdTo, EventType eventType) {
        return applicationService.findByIdWithoutDsl(bundleId)
                .map(application -> BundleInfoView.builder()
                        .bundleId(bundleId)
                        .name(application.getName())
                        .folderId(folderIdTo)
                        .folderIdFrom(folderIdFrom)
                        .build())
                .flatMap(bundleInfoView -> publishBundleCommonEvent(bundleInfoView, eventType));
    }

    public Mono<Void> publishUserLoginEvent(String source) {
        return sessionUserService.getVisitorOrgMember().zipWith(sessionUserService.getVisitorToken())
                .delayUntil(tuple -> {
                    OrgMember orgMember = tuple.getT1();
                    String token = tuple.getT2();
                    UserLoginEvent event = UserLoginEvent.builder()
                            .orgId(orgMember.getOrgId())
                            .userId(orgMember.getUserId())
                            .source(source)
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        event.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(event);
                        return Mono.empty();
                    });
                })
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishUserLoginEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishUserLogoutEvent() {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .delayUntil(tuple -> {
                    OrgMember orgMember = tuple.getT1();
                    String token = tuple.getT2();
                    UserLogoutEvent event = UserLogoutEvent.builder()
                            .orgId(orgMember.getOrgId())
                            .userId(orgMember.getUserId())
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        event.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(event);
                        return Mono.empty();
                    });
                })
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishUserLogoutEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupCreateEvent(Group group) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            GroupCreateEvent event = GroupCreateEvent.builder()
                                    .orgId(tuple.getT1().getOrgId())
                                    .userId(tuple.getT1().getUserId())
                                    .groupId(group.getId())
                                    .groupName(group.getName(locale))
                                    .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupCreateEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupUpdateEvent(boolean publish, Group previousGroup, String newGroupName) {
        if (!publish) {
            return Mono.empty();
        }
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            GroupUpdateEvent event = GroupUpdateEvent.builder()
                                    .orgId(tuple.getT1().getOrgId())
                                    .userId(tuple.getT1().getUserId())
                                    .groupId(previousGroup.getId())
                                    .groupName(newGroupName)
                                    .oldGroupName(previousGroup.getName(locale))
                                    .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupUpdateEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupDeleteEvent(boolean publish, Group previousGroup) {
        if (!publish) {
            return Mono.empty();
        }
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            GroupDeleteEvent event = GroupDeleteEvent.builder()
                                    .orgId(tuple.getT1().getOrgId())
                                    .userId(tuple.getT1().getUserId())
                                    .groupId(previousGroup.getId())
                                    .groupName(previousGroup.getName(locale))
                                    .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupDeleteEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupMemberAddEvent(boolean publish, String groupId, AddMemberRequest addMemberRequest) {
        if (!publish) {
            return Mono.empty();
        }
        return Mono.zip(groupService.getById(groupId),
                        sessionUserService.getVisitorOrgMemberCache(),
                        userService.findById(addMemberRequest.getUserId()),
                        sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            Group group = tuple.getT1();
                            OrgMember orgMember = tuple.getT2();
                            User member = tuple.getT3();
                            String token = tuple.getT4();
                            GroupMemberAddEvent event = GroupMemberAddEvent.builder()
                                    .orgId(orgMember.getOrgId())
                                    .userId(orgMember.getUserId())
                                    .groupId(groupId)
                                    .groupName(group.getName(locale))
                                    .memberId(member.getId())
                                    .memberName(member.getName())
                                    .memberRole(addMemberRequest.getRole())
                                    .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupMemberAddEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupMemberRoleUpdateEvent(boolean publish, String groupId, GroupMember previousGroupMember,
            UpdateRoleRequest updateRoleRequest) {
        if (!publish) {
            return Mono.empty();
        }
        return Mono.zip(groupService.getById(groupId),
                        sessionUserService.getVisitorOrgMemberCache(),
                        userService.findById(previousGroupMember.getUserId()),
                        sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            Group group = tuple.getT1();
                            OrgMember orgMember = tuple.getT2();
                            User member = tuple.getT3();
                            GroupMemberRoleUpdateEvent event = GroupMemberRoleUpdateEvent.builder()
                                    .orgId(orgMember.getOrgId())
                                    .userId(orgMember.getUserId())
                                    .groupId(groupId)
                                    .groupName(group.getName(locale))
                                    .memberId(member.getId())
                                    .memberName(member.getName())
                                    .memberRole(updateRoleRequest.getRole())
                                    .oldMemberRole(previousGroupMember.getRole().getValue())
                                    .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT4(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupMemberRoleUpdateEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupMemberLeaveEvent(boolean publish, GroupMember groupMember) {
        if (!publish) {
            return Mono.empty();
        }
        return Mono.zip(groupService.getById(groupMember.getGroupId()),
                        userService.findById(groupMember.getUserId()),
                        sessionUserService.getVisitorOrgMemberCache(),
                        sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            Group group = tuple.getT1();
                            User user = tuple.getT2();
                            OrgMember orgMember = tuple.getT3();
                            GroupMemberLeaveEvent event = GroupMemberLeaveEvent.builder()
                                    .orgId(orgMember.getOrgId())
                                    .userId(orgMember.getUserId())
                                    .groupId(group.getId())
                                    .groupName(group.getName(locale))
                                    .memberId(user.getId())
                                    .memberName(user.getName())
                                    .memberRole(groupMember.getRole().getValue())
                                    .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT4(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupMemberLeaveEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishGroupMemberRemoveEvent(boolean publish, GroupMember previousGroupMember) {
        if (!publish) {
            return Mono.empty();
        }
        return Mono.zip(sessionUserService.getVisitorOrgMemberCache(),
                        groupService.getById(previousGroupMember.getGroupId()),
                        userService.findById(previousGroupMember.getUserId()),
                        sessionUserService.getVisitorToken())
                .delayUntil(tuple ->
                        Mono.deferContextual(contextView -> {
                            Locale locale = LocaleUtils.getLocale(contextView);
                            OrgMember orgMember = tuple.getT1();
                            Group group = tuple.getT2();
                            User member = tuple.getT3();
                            GroupMemberRemoveEvent event = GroupMemberRemoveEvent.builder()
                                    .orgId(orgMember.getOrgId())
                                    .userId(orgMember.getUserId())
                                    .groupId(group.getId())
                                    .groupName(group.getName(locale))
                                    .memberId(member.getId())
                                    .memberName(member.getName())
                                    .memberRole(previousGroupMember.getRole().getValue())
                                    .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT4(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails(contextView);
                            applicationEventPublisher.publishEvent(event);
                            return Mono.empty();
                        }))
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishGroupMemberRemoveEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public void publishQueryExecutionEvent(QueryExecutionEvent queryExecutionEvent) {
        applicationEventPublisher.publishEvent(queryExecutionEvent);
    }

    public Mono<Void> publishDatasourceEvent(String id, EventType eventType, String oldName) {
        return datasourceService.getById(id)
                .flatMap(datasource -> publishDatasourceEvent(datasource, eventType, oldName))
                .onErrorResume(throwable -> {
                    log.error("publishDatasourceEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishDatasourceEvent(Datasource datasource, EventType eventType, String oldName) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .flatMap(tuple -> {
                    DatasourceEvent event = DatasourceEvent.builder()
                            .datasourceId(datasource.getId())
                            .name(datasource.getName())
                            .type(datasource.getType())
                            .oldName(oldName)
                            .eventType(eventType)
                            .userId(tuple.getT1().getUserId())
                            .orgId(tuple.getT1().getOrgId())
                            .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        event.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(event);
                        return Mono.<Void>empty();
                    });
                })
                .onErrorResume(throwable -> {
                    log.error("publishDatasourceEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishDatasourcePermissionEvent(String datasourceId,
            Collection<String> userIds, Collection<String> groupIds, String role,
            EventType eventType, CommonPermissionView oldPermissions, CommonPermissionView newPermissions) {
        return Mono.zip(sessionUserService.getVisitorOrgMemberCache(),
                        datasourceService.getById(datasourceId),
                        sessionUserService.getVisitorToken())
                .flatMap(tuple -> {
                    OrgMember orgMember = tuple.getT1();
                    Datasource datasource = tuple.getT2();

                    DatasourcePermissionEvent datasourcePermissionEvent = DatasourcePermissionEvent.builder()
                            .datasourceId(datasourceId)
                            .name(datasource.getName())
                            .type(datasource.getType())
                            .userId(orgMember.getUserId())
                            .orgId(orgMember.getOrgId())
                            .userIds(userIds)
                            .groupIds(groupIds)
                            .newPermissions(newPermissions==null?null:newPermissions.getPermissions())
                            .oldPermissions(oldPermissions==null?null:oldPermissions.getPermissions())
                            .role(role)
                            .eventType(eventType)
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT3(), StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        datasourcePermissionEvent.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(datasourcePermissionEvent);
                        return Mono.<Void>empty();
                    });
                })
                .onErrorResume(throwable -> {
                    log.error("publishDatasourcePermissionEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishDatasourceResourcePermissionEvent(EventType eventType, ResourcePermission oldPermission, ResourcePermission newPermission) {
        return Mono.zip(sessionUserService.getVisitorOrgMemberCache(),
                        datasourceService.getById(oldPermission.getResourceId()),
                        sessionUserService.getVisitorToken())
                .flatMap(tuple -> {
                    OrgMember orgMember = tuple.getT1();
                    Datasource datasource = tuple.getT2();

                    DatasourceResourcePermissionEvent datasourceResourcePermissionEvent = DatasourceResourcePermissionEvent.builder()
                            .name(datasource.getName())
                            .type(datasource.getType())
                            .userId(orgMember.getUserId())
                            .orgId(orgMember.getOrgId())
                            .newPermission(newPermission)
                            .oldPermission(oldPermission)
                            .eventType(eventType)
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT3(), StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        datasourceResourcePermissionEvent.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(datasourceResourcePermissionEvent);
                        return Mono.<Void>empty();
                    });
                })
                .onErrorResume(throwable -> {
                    log.error("DatasourceResourcePermissionEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishLibraryQueryPublishEvent(String id, String oldVersion, String newVersion, EventType eventType) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .flatMap(tuple -> {
                    LibraryQueryPublishEvent event = LibraryQueryPublishEvent.builder()
                            .id(id)
                            .oldVersion(oldVersion)
                            .newVersion(newVersion)
                            .eventType(eventType)
                            .userId(tuple.getT1().getUserId())
                            .orgId(tuple.getT1().getOrgId())
                            .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        event.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(event);
                        return Mono.<Void>empty();
                    });
                })
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishLibraryQueryPublishEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishLibraryQueryEvent(String id, String name, EventType eventType, String oldName) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .flatMap(tuple -> {
                    LibraryQueryEvent event = LibraryQueryEvent.builder()
                            .userId(tuple.getT1().getUserId())
                            .orgId(tuple.getT1().getOrgId())
                            .id(id)
                            .name(name)
                            .oldName(oldName)
                            .eventType(eventType)
                            .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                            .build();
                    return Mono.deferContextual(contextView -> {
                        event.populateDetails(contextView);
                        applicationEventPublisher.publishEvent(event);
                        return Mono.<Void>empty();
                    });
                })
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishLibraryQueryEvent error.", throwable);
                    return Mono.empty();
                });
    }
}
