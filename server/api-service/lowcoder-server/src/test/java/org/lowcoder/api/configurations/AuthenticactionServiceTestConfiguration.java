package org.lowcoder.api.configurations;

import org.lowcoder.api.common.InitData;
import org.lowcoder.domain.authentication.AuthenticationServiceImpl;
import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@Profile("testGeneric")
@Configuration
public class AuthenticactionServiceTestConfiguration {
    @Bean
    @Primary
    public AuthenticationServiceImpl authenticationService() {
        return Mockito.mock(AuthenticationServiceImpl.class);
    }

    @Bean
    public InitData initData() {
        return new InitData();
    }
}
