package org.lowcoder.api.application.view;

import lombok.Builder;
import lombok.Getter;
import org.lowcoder.domain.application.model.ApplicationStatus;

@Builder
@Getter
public class MarketplaceApplicationInfoView {

    // org details
    private final String orgId;
    private final String orgName;

    // creator info
    private final String creatorEmail;

    // App details
    private final String applicationId;
    private final String name;
    private final long createAt;
    private final String createBy;
    /**
     * @see org.lowcoder.domain.application.model.ApplicationType
     */
    private final int applicationType;
    private final ApplicationStatus applicationStatus;


}
