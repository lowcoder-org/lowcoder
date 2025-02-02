package org.lowcoder.api.usermanagement.view;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupMemberAggregateView {
    private String visitorRole;
    private List<GroupMemberView> members;
    private Integer total;
    private Integer pageNum;
    private Integer pageSize;
}
