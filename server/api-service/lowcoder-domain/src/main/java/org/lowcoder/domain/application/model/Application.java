package org.lowcoder.domain.application.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.BooleanUtils;
import org.lowcoder.domain.application.ApplicationUtil;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
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
    @Setter
    @Getter
    private String slug;
    private String organizationId;
    private String name;
    private Integer applicationType;
    private ApplicationStatus applicationStatus;

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
        this.publicToAll = publicToAll;
        this.publicToMarketplace = publicToMarketplace;
        this.agencyProfile = agencyProfile;
        this.editingApplicationDSL = editingApplicationDSL;
        this.editingUserId = editingUserId;
        this.lastEditedAt = lastEditedAt;
    }

    @Transient
    private final Supplier<Set<ApplicationQuery>> editingQueries =
            memoize(() -> ofNullable(editingApplicationDSL)
                    .map(map -> map.get("queries"))
                    .map(queries -> JsonUtils.fromJsonSet(JsonUtils.toJson(queries), ApplicationQuery.class))
                    .orElse(Collections.emptySet()));

    @Transient
    private final Supplier<Set<String>> editingModules = memoize(() -> getDependentModulesFromDsl(editingApplicationDSL));

    public Set<ApplicationQuery> getEditingQueries() {
        return editingQueries.get();
    }

    public Mono<Set<ApplicationQuery>> getLiveQueries(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).mapNotNull(liveApplicationDSL -> JsonUtils.fromJsonSet(JsonUtils.toJson(liveApplicationDSL.get("queries")), ApplicationQuery.class));
    }

    public Set<String> getEditingModules() {
        return editingModules.get();
    }

    public Mono<Set<String>> getLiveModules(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).map(ApplicationUtil::getDependentModulesFromDsl);
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

    public Mono<ApplicationQuery> getQueryByViewModeAndQueryId(boolean isViewMode, String queryId, ApplicationRecordService applicationRecordService) {
        return getLiveQueries(applicationRecordService).map(liveQueries -> (isViewMode ? liveQueries : getEditingQueries())
                .stream()
                .filter(query -> queryId.equals(query.getId()) || queryId.equals(query.getGid()))
                .findFirst()
                .orElseThrow(() -> new BizException(BizError.QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND")));
    }

    /**
     * all published dsl will be kept in a list in the future
     */
    @Transient
    @JsonIgnore
    public Mono<Map<String, Object>> getLiveApplicationDsl(ApplicationRecordService applicationRecordService) {
        return applicationRecordService.getLatestRecordByApplicationId(this.getId())
                .map(ApplicationVersion::getApplicationDSL)
                .switchIfEmpty(Mono.just(editingApplicationDSL));
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

    public Mono<String> getCategory(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).map(liveDSL -> {
            if (liveDSL == null || liveDSL.get("settings") == null) return "";
            Object settingsObject = liveDSL.get("settings");
            if (settingsObject instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> settings = (Map<String, Object>) liveDSL.get("settings");
                return (String) settings.get("category");
            } else {
                return "";
            }
        }).onErrorReturn("");
    }

    public Mono<String> getTitle(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).map(liveDSL -> {
            if (liveDSL == null || liveDSL.get("settings") == null) return "";
            Object settingsObject = liveDSL.get("settings");
            if (settingsObject instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> settings = (Map<String, Object>) liveDSL.get("settings");
                return (String) settings.get("title");
            } else {
                return "";
            }
        }).onErrorReturn("");
    }

    public Mono<String> getDescription(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).map(liveDSL -> {
                if (liveDSL == null || liveDSL.get("settings") == null) return "";
                Object settingsObject = liveDSL.get("settings");
                if (settingsObject instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> settings = (Map<String, Object>) liveDSL.get("settings");
                    return (String) settings.get("description");
                } else {
                    return "";
                }
            }
        ).onErrorReturn("");
    }

    public Mono<String> getIcon(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).map(liveDSL -> {
                    if (liveDSL == null || liveDSL.get("settings") == null) return "";
                    Object settingsObject = liveDSL.get("settings");
                    if (settingsObject instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> settings = (Map<String, Object>) liveDSL.get("settings");
                        return (String) settings.get("icon");
                    } else {
                        return "";
                    }
                }
        ).onErrorReturn("");
    }

    public Map<String, Object> getEditingApplicationDSLOrNull() {return editingApplicationDSL; }

    public Mono<Object> getLiveContainerSize(ApplicationRecordService applicationRecordService) {
        return getLiveApplicationDsl(applicationRecordService).flatMap(dsl -> {
            if (ApplicationType.APPLICATION.getValue() == getApplicationType()) {
                return Mono.empty();
            }
            return Mono.just(getContainerSizeFromDSL(dsl));
        });
    }

	public Mono<Map<String, Object>> getPublishedApplicationDSL(ApplicationRecordService applicationRecordService) {
        return applicationRecordService.getLatestRecordByApplicationId(this.getId()).map(ApplicationVersion::getApplicationDSL);
	}

}
