package org.lowcoder.runner.eventlistener;

import org.lowcoder.sdk.exception.BizError;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AppEventListener {

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
    }
}
