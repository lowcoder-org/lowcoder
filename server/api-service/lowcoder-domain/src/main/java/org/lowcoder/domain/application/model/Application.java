package org.lowcoder.domain.application.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.f4b6a3.uuid.UuidCreator;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.function.Supplier;

import static com.google.common.base.Suppliers.memoize;
import static java.util.Optional.ofNullable;
import static org.lowcoder.domain.application.ApplicationUtil.getContainerSizeFromDSL;
import static org.lowcoder.domain.application.ApplicationUtil.getDependentModulesFromDsl;

@Document
@Jacksonized
@SuperBuilder
@NoArgsConstructor
public class Application extends HasIdAndAuditing {
    @Getter
    private String gid;
    private String organizationId;
    private String name;
    private Integer applicationType;
    private ApplicationStatus applicationStatus;

    private Map<String, Object> publishedApplicationDSL;
    private Map<String, Object> editingApplicationDSL;

    @Setter
    private Boolean publicToAll;
    @Setter
    private Boolean publicToMarketplace;
    @Setter
    private Boolean agencyProfile;
    @Getter
    @Setter
    private String editingUserId;
    @Getter
    @Setter
    protected Instant lastEditedAt;

    public Application(
            @JsonProperty("orgId") String organizationId,
            @JsonProperty("gid") String gid,
            @JsonProperty("name") String name,
            @JsonProperty("applicationType") Integer applicationType,
            @JsonProperty("applicationStatus") ApplicationStatus applicationStatus,
            @JsonProperty("publishedApplicationDSL") Map<String, Object> publishedApplicationDSL,
            @JsonProperty("editingApplicationDSL") Map<String, Object> editingApplicationDSL,
            @JsonProperty("publicToAll") Boolean publicToAll,
            @JsonProperty("publicToMarketplace") Boolean publicToMarketplace,
            @JsonProperty("agencyProfile") Boolean agencyProfile,
            @JsonProperty("editingUserId") String editingUserId,
            @JsonProperty("lastEditedAt") Instant lastEditedAt
    ) {
        this.gid = gid;
        this.organizationId = organizationId;
        this.name = name;
        this.applicationType = applicationType;
        this.applicationStatus = applicationStatus;
        this.publishedApplicationDSL = publishedApplicationDSL;
        this.publicToAll = publicToAll;
        this.publicToMarketplace = publicToMarketplace;
        this.agencyProfile = agencyProfile;
        this.editingApplicationDSL = editingApplicationDSL;
        this.editingUserId = editingUserId;
        this.lastEditedAt = lastEditedAt;
    }

    @Transient
    private final Supplier<Set<ApplicationQuery>> editingQueries =
            memoize(() -> Optional.ofNullable(editingApplicationDSL)
                    .map(map -> map.get("queries"))
                    .map(queries -> JsonUtils.fromJsonSet(JsonUtils.toJson(queries), ApplicationQuery.class))
                    .orElse(Collections.emptySet()));

    @Transient
    private final Supplier<Set<ApplicationQuery>> liveQueries =
            memoize(() -> JsonUtils.fromJsonSet(JsonUtils.toJson(getLiveApplicationDsl().get("queries")), ApplicationQuery.class));

    @Transient
    private final Supplier<Set<String>> editingModules = memoize(() -> getDependentModulesFromDsl(editingApplicationDSL));

    @Transient
    private final Supplier<Set<String>> liveModules = memoize(() -> getDependentModulesFromDsl(getLiveApplicationDsl()));

    @Transient
    private final Supplier<Object> liveContainerSize = memoize(() -> {
        if (ApplicationType.APPLICATION.getValue() == getApplicationType()) {
            return null;
        }
        return getContainerSizeFromDSL(getLiveApplicationDsl());
    });

    public Set<ApplicationQuery> getEditingQueries() {
        return editingQueries.get();
    }

    public Set<ApplicationQuery> getLiveQueries() {
        return liveQueries.get();
    }

    public Set<String> getEditingModules() {
        return editingModules.get();
    }

    public Set<String> getLiveModules() {
        return liveModules.get();
    }

    public boolean isPublicToAll() {
        return BooleanUtils.toBooleanDefaultIfNull(publicToAll, false);
    }

    public boolean isPublicToMarketplace() {
        return BooleanUtils.toBooleanDefaultIfNull(publicToMarketplace, false);
    }

    public boolean agencyProfile() {
        return BooleanUtils.toBooleanDefaultIfNull(agencyProfile, false);
    }

    public ApplicationQuery getQueryByViewModeAndQueryId(boolean isViewMode, String queryId) {
        return (isViewMode ? getLiveQueries() : getEditingQueries())
                .stream()
                .filter(query -> queryId.equals(query.getId()) || queryId.equals(query.getGid()))
                .findFirst()
                .orElseThrow(() -> new BizException(BizError.QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"));
    }

    /**
     * all published dsl will be kept in a list in the future
     */
    @Transient
    @JsonIgnore
    public Map<String, Object> getLiveApplicationDsl() {
        var dsl = MapUtils.isEmpty(publishedApplicationDSL) ? editingApplicationDSL : publishedApplicationDSL;
        if (dsl == null) dsl = new HashMap<>();
        return dsl;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public String getName() {
        return name;
    }

    public ApplicationStatus getApplicationStatus() {
        return this.applicationStatus;
    }

    public int getApplicationType() {
        return ofNullable(applicationType).orElse(ApplicationType.APPLICATION.getValue());
    }

    public Map<String, Object> getEditingApplicationDSL() {
        var dsl = editingApplicationDSL;
        if (dsl == null) dsl = new HashMap<>();
        return dsl;
    }

    public Object getLiveContainerSize() {
        return liveContainerSize.get();
    }

	public Map<String, Object> getPublishedApplicationDSL() {
		return publishedApplicationDSL;
	}

}
