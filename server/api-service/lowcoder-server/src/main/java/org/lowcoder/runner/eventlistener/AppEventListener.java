package org.lowcoder.runner.eventlistener;

import lombok.RequiredArgsConstructor;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.infra.event.AbstractEvent;
import org.lowcoder.sdk.exception.BizError;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppEventListener {

    private final ServerConfigRepository serverConfigRepository;
    @EventListener
    public void onApplicationEvent(ApplicationReadyEvent event) {
        System.out.println(
                """
                        ███████ ███████ ██████  ██    ██ ███████ ██████      ███████ ████████  █████  ██████  ████████ ███████ ██████
                        ██      ██      ██   ██ ██    ██ ██      ██   ██     ██         ██    ██   ██ ██   ██    ██    ██      ██   ██
                        ███████ █████   ██████  ██    ██ █████   ██████      ███████    ██    ███████ ██████     ██    █████   ██   ██
                             ██ ██      ██   ██  ██  ██  ██      ██   ██          ██    ██    ██   ██ ██   ██    ██    ██      ██   ██
                        ███████ ███████ ██   ██   ████   ███████ ██   ██     ███████    ██    ██   ██ ██   ██    ██    ███████ ██████
                                       """
        );
        log.info("check BizError duplicates: {}", BizError.values().length);
        String deploymentId = (String)(serverConfigRepository.findByKey("deployment.id").map(ServerConfig::getValue).switchIfEmpty(Mono.just("")).block());
        AbstractEvent.setEnvironmentID(deploymentId);
    }
}
