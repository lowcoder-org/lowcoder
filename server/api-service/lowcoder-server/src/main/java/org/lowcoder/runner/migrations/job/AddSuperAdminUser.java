package org.lowcoder.runner.migrations.job;

import reactor.core.publisher.Mono;

public interface AddSuperAdminUser {

    /**
     * Creates or updates the super admin: the result completes after the last step and fails with the first failing step,
     * whose later steps do not run. Changeset 020 waits for it (BF-037); {@code AddSuperAdminRunner} does not.
     */
    Mono<Void> addOrUpdateSuperAdmin();
}
