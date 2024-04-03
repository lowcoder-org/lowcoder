package org.lowcoder.api.util;

import com.google.common.hash.Hashing;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
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
import org.lowcoder.infra.event.ApplicationCommonEvent;
import org.lowcoder.infra.event.FolderCommonEvent;
import org.lowcoder.infra.event.LibraryQueryEvent;
import org.lowcoder.infra.event.QueryExecutionEvent;
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
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

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

    public Mono<Void> publishFolderCommonEvent(String folderId, String folderName, EventType eventType) {

        return sessionUserService.getVisitorToken()
                .zipWith(sessionUserService.getVisitorOrgMemberCache())
                .doOnNext(
                    tuple -> {
                        String token = tuple.getT1();
                        OrgMember orgMember = tuple.getT2();
                        FolderCommonEvent event = FolderCommonEvent.builder()
                                .id(folderId)
                                .name(folderName)
                                .userId(orgMember.getUserId())
                                .orgId(orgMember.getOrgId())
                                .type(eventType)
                                .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                .build();
                        event.populateDetails();
                        applicationEventPublisher.publishEvent(event);
                })
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishFolderCommonEvent error.{}, {}, {}", folderId, folderName, eventType, throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishApplicationCommonEvent(String applicationId, @Nullable String folderId, EventType eventType) {
        return applicationService.findByIdWithoutDsl(applicationId)
                .map(application -> {
                    ApplicationInfoView applicationInfoView = ApplicationInfoView.builder()
                            .applicationId(applicationId)
                            .name(application.getName())
                            .folderId(folderId)
                            .build();
                    return ApplicationView.builder()
                            .applicationInfoView(applicationInfoView)
                            .build();

                })
                .flatMap(applicationView -> publishApplicationCommonEvent(applicationView, eventType));
    }

    public Mono<Void> publishApplicationCommonEvent(ApplicationView applicationView, EventType eventType) {
        return sessionUserService.isAnonymousUser()
                .flatMap(anonymous -> {
                    if (anonymous) {
                        return Mono.empty();
                    }
                    return sessionUserService.getVisitorOrgMemberCache()
                            .zipWith(Mono.defer(() -> {
                                String folderId = applicationView.getApplicationInfoView().getFolderId();
                                if (StringUtils.isBlank(folderId)) {
                                    return Mono.just(Optional.<Folder> empty());
                                }
                                return folderService.findById(folderId)
                                        .map(Optional::of)
                                        .onErrorReturn(Optional.empty());
                            }))
                            .zipWith(sessionUserService.getVisitorToken())
                            .doOnNext(tuple -> {
                                OrgMember orgMember = tuple.getT1().getT1();
                                Optional<Folder> optional = tuple.getT1().getT2();
                                String token = tuple.getT2();
                                ApplicationInfoView applicationInfoView = applicationView.getApplicationInfoView();
                                ApplicationCommonEvent event = ApplicationCommonEvent.builder()
                                        .orgId(orgMember.getOrgId())
                                        .userId(orgMember.getUserId())
                                        .applicationId(applicationInfoView.getApplicationId())
                                        .applicationName(applicationInfoView.getName())
                                        .type(eventType)
                                        .folderId(optional.map(Folder::getId).orElse(null))
                                        .folderName(optional.map(Folder::getName).orElse(null))
                                        .isAnonymous(anonymous)
                                        .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                        .build();
                                event.populateDetails();
                                applicationEventPublisher.publishEvent(event);
                            })
                            .then()
                            .onErrorResume(throwable -> {
                                log.error("publishApplicationCommonEvent error. {}, {}", applicationView, eventType, throwable);
                                return Mono.empty();
                            });
                });
    }

    public Mono<Void> publishUserLoginEvent(String source) {
        return sessionUserService.getVisitorOrgMember().zipWith(sessionUserService.getVisitorToken())
                .doOnNext(tuple -> {
                    OrgMember orgMember = tuple.getT1();
                    String token = tuple.getT2();
                    UserLoginEvent event = UserLoginEvent.builder()
                            .orgId(orgMember.getOrgId())
                            .userId(orgMember.getUserId())
                            .source(source)
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                            .build();
                    event.populateDetails();
                    applicationEventPublisher.publishEvent(event);
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
                .doOnNext(tuple -> {
                    OrgMember orgMember = tuple.getT1();
                    String token = tuple.getT2();
                    UserLogoutEvent event = UserLogoutEvent.builder()
                            .orgId(orgMember.getOrgId())
                            .userId(orgMember.getUserId())
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                            .build();
                    event.populateDetails();
                    applicationEventPublisher.publishEvent(event);
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
                            event.populateDetails();
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
                                    .groupName(previousGroup.getName(locale) + " => " + newGroupName)
                                    .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails();
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
                            event.populateDetails();
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
                            event.populateDetails();
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
                                    .memberRole(previousGroupMember.getRole().getValue() + " => " + updateRoleRequest.getRole())
                                    .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(tuple.getT4(), StandardCharsets.UTF_8).toString())
                                    .build();
                            event.populateDetails();
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
                            event.populateDetails();
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
                            event.populateDetails();
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

    public Mono<Void> publishDatasourceEvent(String id, EventType eventType) {
        return datasourceService.getById(id)
                .flatMap(datasource -> publishDatasourceEvent(datasource, eventType))
                .onErrorResume(throwable -> {
                    log.error("publishDatasourceEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishDatasourceEvent(Datasource datasource, EventType eventType) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .flatMap(tuple -> {
                    DatasourceEvent event = DatasourceEvent.builder()
                            .datasourceId(datasource.getId())
                            .name(datasource.getName())
                            .type(datasource.getType())
                            .eventType(eventType)
                            .userId(tuple.getT1().getUserId())
                            .orgId(tuple.getT1().getOrgId())
                            .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                            .build();
                    event.populateDetails();
                    applicationEventPublisher.publishEvent(event);
                    return Mono.<Void> empty();
                })
                .onErrorResume(throwable -> {
                    log.error("publishDatasourceEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishDatasourcePermissionEvent(String permissionId, EventType eventType) {
        return resourcePermissionService.getById(permissionId)
                .zipWhen(resourcePermission -> datasourceService.getById(resourcePermission.getResourceId()))
                .flatMap(tuple -> {
                    ResourcePermission resourcePermission = tuple.getT1();
                    ResourceHolder holder = resourcePermission.getResourceHolder();
                    Datasource datasource = tuple.getT2();
                    return publishDatasourcePermissionEvent(datasource.getId(),
                            holder == USER ? List.of(resourcePermission.getResourceHolderId()) : Collections.emptyList(),
                            holder == USER ? Collections.emptyList() : List.of(resourcePermission.getResourceHolderId()),
                            resourcePermission.getResourceRole().getValue(),
                            eventType);
                })
                .onErrorResume(throwable -> {
                    log.error("publishDatasourcePermissionEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishDatasourcePermissionEvent(String datasourceId,
            Collection<String> userIds, Collection<String> groupIds, String role,
            EventType eventType) {
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
                            .role(role)
                            .eventType(eventType)
                            .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT3(), StandardCharsets.UTF_8).toString())
                            .build();
                    datasourcePermissionEvent.populateDetails();
                    applicationEventPublisher.publishEvent(datasourcePermissionEvent);
                    return Mono.<Void> empty();
                })
                .onErrorResume(throwable -> {
                    log.error("publishDatasourcePermissionEvent error.", throwable);
                    return Mono.empty();
                });
    }

    public Mono<Void> publishLibraryQuery(LibraryQuery libraryQuery, EventType eventType) {
        return publishLibraryQueryEvent(libraryQuery.getId(), libraryQuery.getName(), eventType);
    }

    public Mono<Void> publishLibraryQueryEvent(String id, String name, EventType eventType) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(sessionUserService.getVisitorToken())
                .map(tuple -> {
                    LibraryQueryEvent event = LibraryQueryEvent.builder()
                            .userId(tuple.getT1().getUserId())
                            .orgId(tuple.getT1().getOrgId())
                            .id(id)
                            .name(name)
                            .eventType(eventType)
                            .isAnonymous(Authentication.isAnonymousUser(tuple.getT1().getUserId()))
                            .sessionHash(Hashing.sha512().hashString(tuple.getT2(), StandardCharsets.UTF_8).toString())
                            .build();
                    event.populateDetails();
                    return event;
                })
                .doOnNext(applicationEventPublisher::publishEvent)
                .then()
                .onErrorResume(throwable -> {
                    log.error("publishLibraryQueryEvent error.", throwable);
                    return Mono.empty();
                });
    }
}
