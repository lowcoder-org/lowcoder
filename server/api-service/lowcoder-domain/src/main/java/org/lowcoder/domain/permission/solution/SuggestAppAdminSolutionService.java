package org.lowcoder.domain.permission.solution;

import org.lowcoder.domain.user.model.User;
import reactor.core.publisher.Mono;

import java.util.List;

public interface SuggestAppAdminSolutionService {
    Mono<List<User>> getApplicationAdminUsers(String applicationId, int limit);

    Mono<String> getSuggestAppAdminNames(String applicationId);
}
