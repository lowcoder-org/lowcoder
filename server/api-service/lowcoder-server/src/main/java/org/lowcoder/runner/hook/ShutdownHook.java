package org.lowcoder.runner.hook;

import jakarta.annotation.PreDestroy;

import org.lowcoder.sdk.destructor.DestructorUtil;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ShutdownHook {

    /**
     * execute after active requests completing.
     */
    @PreDestroy
    public void preDestroy() {
        DestructorUtil.onDestroy();
    }
}
