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
    public GroupListResponseView(int code, String message, T data, int totalAdmins, int totalAdminsAndDevelopers, int totalDevelopersOnly, int totalOtherMembers) {
        super(code, message, data);
        this.totalAdmins = totalAdmins;
        this.totalDevelopersOnly = totalDevelopersOnly;
        this.totalAdminsAndDevelopers = totalAdminsAndDevelopers;
        this.totalOtherMembers = totalOtherMembers;
    }
}
