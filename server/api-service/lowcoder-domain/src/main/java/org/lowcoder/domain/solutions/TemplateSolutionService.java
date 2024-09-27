package org.lowcoder.domain.solutions;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.infra.annotation.NonEmptyMono;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Set;

public interface TemplateSolutionService {
    Mono<Application> createFromTemplate(String templateId, String orgId, String visitorId);

    @NonEmptyMono
    Mono<Set<String>> getTemplateApplicationIds(Collection<String> applicationIds);
}
