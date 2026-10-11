package org.lowcoder.api.usermanagement.view;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.sdk.exception.BizError;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
public class GroupListResponseView<T> extends ResponseView<T> {
    private final int totalAdminsAndDevelopers;
    private final int totalDevelopersOnly;
    private final int totalAdmins;
    private final int totalOtherMembers;
    private final int total;
    private final int pageNum;
    private final int pageSize;
    public GroupListResponseView(int code, String message, T data, int totalAdmins, int totalAdminsAndDevelopers, int totalDevelopersOnly, int totalOtherMembers, int total, int pageNum, int pageSize) {
        super(code, message, data);
        this.totalAdmins = totalAdmins;
        this.totalDevelopersOnly = totalDevelopersOnly;
        this.totalAdminsAndDevelopers = totalAdminsAndDevelopers;
        this.totalOtherMembers = totalOtherMembers;
        this.total = total;
        this.pageNum = pageNum;
        this.pageSize = pageSize;
    }
}
