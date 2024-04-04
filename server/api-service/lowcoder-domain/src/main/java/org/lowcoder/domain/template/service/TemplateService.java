package org.lowcoder.domain.template.service;

import org.lowcoder.domain.template.model.Template;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

public interface TemplateService {
    Mono<Template> getById(String templateId);

    Flux<Template> getByApplicationIds(Collection<String> applicationIds);

    Mono<Template> getByApplicationId(String applicationId);
}
