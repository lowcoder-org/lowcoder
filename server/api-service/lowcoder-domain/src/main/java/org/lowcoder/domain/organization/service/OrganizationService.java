package org.lowcoder.domain.organization.service;

import java.util.Collection;

import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.annotation.PossibleEmptyMono;
import org.springframework.http.codec.multipart.Part;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrganizationService {

    @PossibleEmptyMono
    Mono<Organization> getOrganizationInEnterpriseMode();

    Mono<Organization> create(Organization organization, String creatorUserId);

    Mono<Organization> createDefault(User user);

    Mono<Organization> getById(String id);

    @NonEmptyMono
    Flux<Organization> getByIds(Collection<String> ids);

    Mono<OrganizationCommonSettings> getOrgCommonSettings(String orgId);

    Mono<Boolean> uploadLogo(String organizationId, Part filePart);

    Mono<Boolean> deleteLogo(String organizationId);

    Mono<Boolean> update(String orgId, Organization updateOrg);

    Mono<Boolean> delete(String orgId);

    Mono<Organization> getBySourceAndTpCompanyId(String source, String companyId);

    @PossibleEmptyMono
    Mono<Organization> getByDomain();

    Mono<Boolean> updateCommonSettings(String orgId, String key, Object value);
}
