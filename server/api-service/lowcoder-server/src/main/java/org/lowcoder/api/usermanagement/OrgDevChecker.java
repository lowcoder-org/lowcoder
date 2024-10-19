package org.lowcoder.api.usermanagement;

import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.sdk.exception.BizError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@Component
public class OrgDevChecker {

    private final SessionUserService sessionUserService;
    private final GroupService groupService;
    private final GroupMemberService groupMemberService;

    /**
     * check whether current user is org admin or dev
     */
    public Mono<Void> checkCurrentOrgDev() {
        return isCurrentOrgDev()
                .flatMap(result -> {
                    if (result) {
                        return Mono.empty();
                    }
                    return ofError(BizError.NEED_DEV_TO_CREATE_RESOURCE, "NEED_DEV_TO_CREATE_RESOURCE");
                });
    }

    /**
     * check whether current user is org admin or dev
     */
    public Mono<Boolean> isCurrentOrgDev() {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> {
                    if (orgMember.isAdmin() || orgMember.isSuperAdmin()) {
                        return Mono.just(true);
                    }
                    return inDevGroup(orgMember.getOrgId(), orgMember.getUserId());
                });
    }

    @Nonnull
    private Mono<Boolean> inDevGroup(String orgId, String userId) {
        return groupService.getDevGroup(orgId)
                .flatMap(group -> groupMemberService.isMember(group, userId))
                .defaultIfEmpty(false);
    }
}
