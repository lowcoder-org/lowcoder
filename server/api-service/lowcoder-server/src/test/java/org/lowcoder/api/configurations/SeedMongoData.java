package org.lowcoder.api.configurations;

import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.user.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class SeedMongoData {

    @Bean
    ApplicationRunner init(UserRepository userRepository,
            OrganizationRepository organizationRepository,
            ApplicationRepository applicationRepository,
            ReactiveMongoTemplate mongoTemplate) {
        return args -> {};
    }
}
