package org.lowcoder.runner.init;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.lowcoder.runner.migrations.job.AddSuperAdminUser;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class AddSuperAdminRunner {

    private final AddSuperAdminUser addSuperAdminUser;
    @PostConstruct
    public void addSuperAdmin() {
        addSuperAdminUser.addOrUpdateSuperAdmin();
    }
}
