package org.lowcoder.api.bundle;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.lowcoder.api.application.view.ApplicationInfoView;

import java.time.Instant;
import java.util.List;

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
    private final String type;
    private final String image;
    private final Long createAt;
    private final String createBy;
    private boolean isVisible;
    private boolean isManageable;

    private List<BundleInfoView> subBundles;
    private List<ApplicationInfoView> subApplications;

    private final Instant createTime;

    public long getCreateTime() {
        return createTime == null ? 0 : createTime.toEpochMilli();
    }

    public boolean isBundle() {
        return true;
    }
}
