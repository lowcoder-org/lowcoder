package org.lowcoder.api.bundle.view;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.lowcoder.api.application.view.ApplicationInfoView;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@ToString
public class BundleInfoView {

    private final String userId;
    private final String bundleId;
    private final String name;
    private final String title;
    private final String description;
    private final String category;
    private final String image;
    private final Long createAt;
    private final String createBy;
    private final String folderId;
    private final Boolean publicToAll;
    private final Boolean publicToMarketplace;
    private final Boolean agencyProfile;
    private boolean isVisible;
    private boolean isManageable;

    private Map<String, Object> editingBundleDSL;
    private Map<String, Object> publishedBundleDSL;

    private final Instant createTime;

    public long getCreateTime() {
        return createTime == null ? 0 : createTime.toEpochMilli();
    }

    public boolean isBundle() {
        return true;
    }
}
