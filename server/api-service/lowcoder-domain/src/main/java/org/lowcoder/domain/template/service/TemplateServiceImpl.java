package org.lowcoder.domain.template.service;

import java.util.Collection;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.template.model.Template;
import org.lowcoder.domain.template.repository.TemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@Service
public class TemplateServiceImpl implements TemplateService {

    private final TemplateRepository templateRepository;

    @Override
    public Mono<Template> getById(String templateId) {
        return templateRepository.findById(templateId);
    }

    @Override
    public Flux<Template> getByApplicationIds(Collection<String> applicationIds) {
        return templateRepository.findByApplicationIdIn(applicationIds);
    }

    @Override
    public Mono<Template> getByApplicationId(String applicationId) {
        return templateRepository.findByApplicationId(applicationId);
    }
}
