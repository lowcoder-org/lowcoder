package org.lowcoder.api.permission;

import static org.lowcoder.api.util.ViewBuilder.multiBuild;

import java.util.List;
import java.util.Locale;

import jakarta.validation.constraints.NotEmpty;

import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class PermissionHelper {

    @Autowired
    private GroupService groupService;
    @Autowired
    private UserService userService;

    public Mono<List<PermissionItemView>> getGroupPermissions(@NotEmpty List<ResourcePermission> resourcePermissions) {
        return Flux.fromIterable(resourcePermissions)
                .filter(ResourcePermission::ownedByGroup)
                .collectList()
                .flatMap(groupPermissions -> Mono.deferContextual(contextView -> {
                    Locale locale = LocaleUtils.getLocale(contextView);
                    return multiBuild(groupPermissions,
                            ResourcePermission::getResourceHolderId,
                            groupService::getByIds,
                            Group::getId,
                            (permission, group) -> PermissionItemView.builder()
                                    .permissionId(permission.getId())
                                    .type(ResourceHolder.GROUP)
                                    .id(group.getId())
                                    .name(group.getName(locale))
                                    .avatar("")
                                    .role(permission.getResourceRole().getValue())
                                    .build()
                    );
                }));
    }

    public Mono<List<PermissionItemView>> getUserPermissions(@NotEmpty List<ResourcePermission> resourcePermissions) {
        return Flux.fromIterable(resourcePermissions)
                .filter(ResourcePermission::ownedByUser)
                .collectList()
                .flatMap(userPermissions -> multiBuild(userPermissions,
                        ResourcePermission::getResourceHolderId,
                        userService::getByIds,
                        (permission, user) -> PermissionItemView.builder()
                                .permissionId(permission.getId())
                                .type(ResourceHolder.USER)
                                .id(user.getId())
                                .name(user.getName())
                                .avatar(user.getAvatar())
                                .role(permission.getResourceRole().getValue())
                                .build()
                ));
    }
}
