package org.lowcoder.domain.bundle.model;


import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Getter
@Setter
@Document
@NoArgsConstructor
@SuperBuilder
public class Bundle extends HasIdAndAuditing {
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
}
