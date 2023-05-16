package org.lowcoder.domain.organization.model;

import java.util.List;

import org.lowcoder.sdk.auth.AbstractAuthConfig;

public interface EnterpriseConnectionConfig {

    List<AbstractAuthConfig> getConfigs();
}
