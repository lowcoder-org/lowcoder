package org.lowcoder.domain.organization.repository;

import java.util.Collection;

import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends ReactiveMongoRepository<Organization, String> {
    Mono<Organization> findFirstByStateMatches(OrganizationState state);

    Flux<Organization> findByIdInAndState(Collection<String> id, OrganizationState state);
    Flux<Organization> findByGidInAndState(Collection<String> gid, OrganizationState state);
    Flux<Organization> findBySlugInAndState(Collection<String> slug, OrganizationState state);
    Flux<Organization> findByGid(String gid);
    Flux<Organization> findBySlug(String slug);
    Flux<Organization> findByState(OrganizationState state);

    Mono<Organization> findByIdAndState(String id, OrganizationState state);
    Mono<Organization> findByGidAndState(String gid, OrganizationState state);
    Mono<Organization> findBySlugAndState(String slug, OrganizationState state);

    Mono<Organization> findBySourceAndThirdPartyCompanyIdAndState(String source, String tpCompanyId, OrganizationState state);

    Mono<Organization> findByOrganizationDomain_DomainAndState(String domain, OrganizationState state);

    Flux<Organization> findByOrganizationDomainIsNotNull();
    Mono<Boolean> existsBySlug(String slug);
}
