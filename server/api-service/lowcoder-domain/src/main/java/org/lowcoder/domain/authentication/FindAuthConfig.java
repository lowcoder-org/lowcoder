package org.lowcoder.domain.authentication;


import jakarta.annotation.Nullable;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.sdk.auth.AbstractAuthConfig;

public record FindAuthConfig(AbstractAuthConfig authConfig, @Nullable Organization organization) {
}