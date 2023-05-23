package org.lowcoder.api.config;


import java.util.List;

import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class ConfigView {

    private boolean isCloudHosting;
    private List<AbstractAuthConfig> authConfigs;
    private WorkspaceMode workspaceMode;
    private boolean selfDomain;
    private String cookieName;
}
