package org.lowcoder.api.home;


import jakarta.annotation.Nullable;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.user.model.User;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserHomeApiService {

    Mono<UserProfileView> buildUserProfileView(User user, ServerWebExchange exchange);

    Mono<Boolean> markNewUserGuidanceShown(String userId);

    Mono<UserHomepageView> getUserHomePageView(ApplicationType applicationType);

    Flux<ApplicationInfoView> getAllAuthorisedApplications4CurrentOrgMember(@Nullable ApplicationType applicationType,
                                                                            @Nullable ApplicationStatus applicationStatus, boolean withContainerSize);

    Flux<BundleInfoView> getAllAuthorisedBundles4CurrentOrgMember(@Nullable BundleStatus bundleStatus);

    public Flux<MarketplaceApplicationInfoView> getAllMarketplaceApplications(@Nullable ApplicationType applicationType);

    public Flux<MarketplaceApplicationInfoView> getAllAgencyProfileApplications(@Nullable ApplicationType applicationType);

    Flux<MarketplaceBundleInfoView> getAllMarketplaceBundles();

    Flux<MarketplaceBundleInfoView> getAllAgencyProfileBundles();
}
