package org.lowcoder.domain.configurations;

import com.mongodb.ReadConcern;
import com.mongodb.ReadPreference;
import com.mongodb.WriteConcern;
import io.mongock.driver.mongodb.springdata.v4.SpringDataMongoV4Driver;
import io.mongock.runner.springboot.MongockSpringboot;
import io.mongock.runner.springboot.base.MongockApplicationRunner;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.config.MaterialProperties;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.ReactiveAuditorAware;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.ReactiveMongoDatabaseFactory;
import org.springframework.data.mongodb.config.EnableReactiveMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.gridfs.ReactiveGridFsTemplate;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;

import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableReactiveMongoAuditing
@EnableReactiveMongoRepositories(basePackages = {"org.lowcoder.infra", "org.lowcoder.domain"})
public class MongoConfig {

    private final MaterialProperties materialProperties;
    private final MappingMongoConverter mappingMongoConverter;

    @PostConstruct
    public void init() {
        mappingMongoConverter.setMapKeyDotReplacement("##OB_REPLACE##");
    }

    @Bean
    public MongockApplicationRunner mongockApplicationRunner(ApplicationContext springContext, MongoTemplate mongoTemplate) {
        SpringDataMongoV4Driver driver = SpringDataMongoV4Driver.withDefaultLock(mongoTemplate);
        driver.setWriteConcern(WriteConcern.JOURNALED.withJournal(false));
        driver.setReadConcern(ReadConcern.LOCAL);

        return MongockSpringboot.builder()
                .setDriver(driver)
                .addMigrationScanPackages(List.of("org.lowcoder.runner.migrations"))
                .setSpringContext(springContext)
                .buildApplicationRunner();
    }

    /**
     * inject {@link HasIdAndAuditing#setCreatedBy}}/{@link HasIdAndAuditing#setModifiedBy}} for JPA
     */
    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    @Bean
    public ReactiveAuditorAware<String> auditorProvider() {
        return () -> ReactiveSecurityContextHolder.getContext()
                .map(securityContext -> (User) securityContext.getAuthentication().getPrincipal())
                .map(User::getId);
    }

    @Bean
    @Primary
    public ReactiveMongoTemplate reactiveMongoTemplate(ReactiveMongoDatabaseFactory mongoDbFactory, MappingMongoConverter
            mappingMongoConverter) {
        return new ReactiveMongoTemplate(mongoDbFactory, mappingMongoConverter);
    }

    /**
     * secondaryPreferred
     */
    @Bean("reactiveMongoSlaveTemplate")
    public ReactiveMongoTemplate reactiveMongoSlaveTemplate(ReactiveMongoDatabaseFactory mongoDbFactory,
            MappingMongoConverter mappingMongoConverter) {
        ReactiveMongoTemplate mongoTemplate = new ReactiveMongoTemplate(mongoDbFactory, mappingMongoConverter);
        mongoTemplate.setReadPreference(ReadPreference.secondaryPreferred());
        return mongoTemplate;
    }

    @Bean("materialGridFsTemplate")
    public ReactiveGridFsTemplate reactiveGridFsTemplate(ReactiveMongoDatabaseFactory factory, MappingMongoConverter converter) {
        return new ReactiveGridFsTemplate(factory, converter, materialProperties.getMongodbGridFs().getBucketName());
    }

    /**
     * used by mongock
     */
    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDbFactory, MappingMongoConverter mappingMongoConverter) {
        return new MongoTemplate(mongoDbFactory, mappingMongoConverter);
    }
}
