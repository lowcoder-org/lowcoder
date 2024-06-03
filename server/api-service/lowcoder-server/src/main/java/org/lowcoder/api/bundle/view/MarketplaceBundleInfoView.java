package org.lowcoder.api.bundle.view;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.lowcoder.domain.bundle.model.BundleStatus;

@Builder
@Getter
@Setter
public class MarketplaceBundleInfoView {

    // marketplace specific details
    private String title;
    private String description;
    private String category;
    private String image;

    // org details
    private final String orgId;
    private final String orgName;

    // creator info
    private final String creatorEmail;

    // Bundle details
    private final String bundleId;
    private final String name;
    private final long createAt;
    private final String createBy;
    private final BundleStatus bundleStatus;


}
