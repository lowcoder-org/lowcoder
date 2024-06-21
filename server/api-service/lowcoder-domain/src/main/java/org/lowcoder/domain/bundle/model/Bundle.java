package org.lowcoder.domain.bundle.model;


import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.apache.commons.lang3.BooleanUtils;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

import java.util.Map;

@Getter
@Setter
@Document
@NoArgsConstructor
@SuperBuilder
public class Bundle extends HasIdAndAuditing {
    @Getter
    private String gid;
    private String organizationId;
    @Nullable
    private String name;
    private String title;
    private String description;
    private String category;
    private String image;
    private BundleStatus bundleStatus;

    private Boolean publicToAll;
    private Boolean publicToMarketplace;
    private Boolean agencyProfile;

    private Map<String, Object> editingBundleDSL;
    private Map<String, Object> publishedBundleDSL;

    public boolean isPublicToAll() {
        return BooleanUtils.toBooleanDefaultIfNull(publicToAll, false);
    }

    public boolean isPublicToMarketplace() {
        return BooleanUtils.toBooleanDefaultIfNull(publicToMarketplace, false);
    }

    public boolean agencyProfile() {
        return BooleanUtils.toBooleanDefaultIfNull(agencyProfile, false);
    }
}
