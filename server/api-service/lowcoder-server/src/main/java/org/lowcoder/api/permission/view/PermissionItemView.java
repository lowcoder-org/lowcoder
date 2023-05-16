package org.lowcoder.api.permission.view;

import org.lowcoder.domain.permission.model.ResourceHolder;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class PermissionItemView {
    private String permissionId;
    private ResourceHolder type;
    private String id;
    private String avatar;
    private String name;
    private String role;
}
