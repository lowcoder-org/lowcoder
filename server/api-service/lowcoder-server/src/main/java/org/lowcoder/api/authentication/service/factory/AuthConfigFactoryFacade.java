package org.lowcoder.api.authentication.service.factory;

import jakarta.annotation.PostConstruct;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Primary
@Component
public class AuthConfigFactoryFacade implements AuthConfigFactory {

    @Autowired
    private List<AuthConfigFactory> factories;

    private final Map<String, AuthConfigFactory> factoryMap = new HashMap<>();

    @PostConstruct
    public void init() {
        for (AuthConfigFactory factory : factories) {
            if (factory instanceof AuthConfigFactoryFacade) {
                continue;
            }
            for (String authType : factory.supportAuthTypes()) {
                factoryMap.putIfAbsent(authType, factory);
            }
        }
    }

    @Override
    public AbstractAuthConfig build(AuthConfigRequest authConfigRequest, boolean enable) {
        AuthConfigFactory factory = factoryMap.get(authConfigRequest.getAuthType());
        if (factory == null) {
            throw new UnsupportedOperationException(authConfigRequest.getAuthType());
        }
        return factory.build(authConfigRequest, enable);
    }

    @Override
    public Set<String> supportAuthTypes() {
        return factoryMap.keySet();
    }
}
