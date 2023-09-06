package org.lowcoder.api.home;

import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.api.usermanagement.view.UserView;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.user.model.User;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.Nullable;

public interface UserHomeApiService {

    Mono<UserProfileView> buildUserProfileView(User user, ServerWebExchange exchange);

    Mono<Boolean> markNewUserGuidanceShown(String userId);

    Mono<UserHomepageView> getUserHomePageView(ApplicationType applicationType);

    Flux<ApplicationInfoView> getAllAuthorisedApplications4CurrentOrgMember(@Nullable ApplicationType applicationType,
                                                                            @Nullable ApplicationStatus applicationStatus, boolean withContainerSize);

    Mono<UserView> getUserProfileView(User user, ServerWebExchange exchange);
}
