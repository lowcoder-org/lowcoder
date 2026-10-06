package org.lowcoder.runner.init;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.lowcoder.runner.migrations.job.AddSuperAdminUser;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class AddSuperAdminRunner {

    private final AddSuperAdminUser addSuperAdminUser;
    /** Runs the super-admin job at every start without waiting for it, as before BF-037 (which concerns changeset 020). */
    @PostConstruct
    public void addSuperAdmin() {
        addSuperAdminUser.addOrUpdateSuperAdmin().subscribe();
    }
}
