package org.lowcoder.domain.permission.model;

import com.google.common.collect.HashMultimap;
import com.google.common.collect.SetMultimap;
import jakarta.annotation.Nonnull;
import lombok.Getter;

import java.util.Arrays;
import java.util.Set;

import static com.google.common.collect.Multimaps.toMultimap;
import static java.util.Collections.emptySet;
import static org.apache.commons.lang3.ObjectUtils.firstNonNull;

@Getter
public enum ResourceAction {

    MANAGE_APPLICATIONS(ResourceRole.OWNER, ResourceType.APPLICATION),
    READ_APPLICATIONS(ResourceRole.VIEWER, ResourceType.APPLICATION),
    PUBLISH_APPLICATIONS(ResourceRole.EDITOR, ResourceType.APPLICATION),
    EXPORT_APPLICATIONS(ResourceRole.EDITOR, ResourceType.APPLICATION),
    EDIT_APPLICATIONS(ResourceRole.EDITOR, ResourceType.APPLICATION),

    MANAGE_BUNDLES(ResourceRole.OWNER, ResourceType.BUNDLE),
    READ_BUNDLES(ResourceRole.VIEWER, ResourceType.BUNDLE),
    PUBLISH_BUNDLES(ResourceRole.EDITOR, ResourceType.BUNDLE),
    EXPORT_BUNDLES(ResourceRole.EDITOR, ResourceType.BUNDLE),
    EDIT_BUNDLES(ResourceRole.EDITOR, ResourceType.BUNDLE),

    SET_APPLICATIONS_PUBLIC(ResourceRole.EDITOR, ResourceType.APPLICATION),
    SET_APPLICATIONS_PUBLIC_TO_MARKETPLACE(ResourceRole.EDITOR, ResourceType.APPLICATION),
    SET_APPLICATIONS_AS_AGENCY_PROFILE(ResourceRole.EDITOR, ResourceType.APPLICATION),

    SET_BUNDLES_PUBLIC(ResourceRole.EDITOR, ResourceType.BUNDLE),
    SET_BUNDLES_PUBLIC_TO_MARKETPLACE(ResourceRole.EDITOR, ResourceType.BUNDLE),
    SET_BUNDLES_AS_AGENCY_PROFILE(ResourceRole.EDITOR, ResourceType.BUNDLE),

    // datasource action
    MANAGE_DATASOURCES(ResourceRole.OWNER, ResourceType.DATASOURCE),
    USE_DATASOURCES(ResourceRole.VIEWER, ResourceType.DATASOURCE),
    ;

    private static final SetMultimap<ResourceRole, ResourceAction> ROLE_PERMISSIONS;

    static {
        ROLE_PERMISSIONS = Arrays.stream(values())
                .collect(toMultimap(ResourceAction::getRole, it -> it, HashMultimap::create));
    }

    private final ResourceRole role;
    private final ResourceType resourceType;

    ResourceAction(ResourceRole role, ResourceType resourceType) {
        this.role = role;
        this.resourceType = resourceType;
    }

    @Nonnull
    static Set<ResourceAction> getMatchingPermissions(ResourceRole role) {
        return firstNonNull(ROLE_PERMISSIONS.get(role), emptySet());
    }
}
