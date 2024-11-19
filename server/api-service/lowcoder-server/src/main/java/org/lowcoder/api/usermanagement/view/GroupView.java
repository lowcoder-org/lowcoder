package org.lowcoder.api.usermanagement.view;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.lowcoder.domain.group.model.Group;
import org.lowcoder.sdk.util.LocaleUtils;

import lombok.Builder;
import lombok.Getter;
import reactor.core.publisher.Mono;

@Getter
@Builder
public class GroupView {

    private String groupId;
    private String groupGid;
    private String groupName;
    private boolean allUsersGroup;
    private boolean isDevGroup;
    private String visitorRole;
    private long createTime;
    private String dynamicRule;
    private boolean isSyncGroup;
    private boolean isSyncDelete;
    private Map<String, Object> stats;

    public static Mono<GroupView> from(Group group, String memberRole, int adminCount, int userCount, List<String> users) {
        return Mono.deferContextual(contextView -> {
            Locale locale = LocaleUtils.getLocale(contextView);
            GroupView groupView = GroupView.builder()
                    .groupId(group.getId())
                    .groupGid(group.getGid())
                    .groupName(group.getName(locale))
                    .allUsersGroup(group.isAllUsersGroup())
                    .isDevGroup(group.isDevGroup())
                    .createTime(group.getCreateTime())
                    .visitorRole(memberRole)
                    .dynamicRule(group.getDynamicRule())
                    .isSyncGroup(group.isSyncGroup())
                    .isSyncDelete(group.isSyncDeleted())
                    .stats(Map.of("adminUserCount", adminCount, "userCount", userCount, "users", users))
                    .build();
            return Mono.just(groupView);
        });
    }
}
