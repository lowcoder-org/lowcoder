package org.lowcoder.domain.application.repository;

import org.lowcoder.domain.application.model.Application;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomApplicationRepository {

    Flux<Application> findByOrganizationIdWithDsl(String organizationId);

    Mono<Application> findByIdWithDsl(String applicationId);
}
