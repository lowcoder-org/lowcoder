package org.lowcoder.domain.user.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.*;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.SetUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.mongodb.AfterMongodbRead;
import org.lowcoder.domain.mongodb.BeforeMongodbWrite;
import org.lowcoder.domain.mongodb.MongodbInterceptorContext;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.constants.UiConstants;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.*;
import java.util.function.Supplier;

import static com.google.common.base.Suppliers.memoize;
import static org.lowcoder.infra.util.AssetUtils.toAssetPath;


@Getter
@Setter
@ToString
@Document
@Jacksonized
@SuperBuilder
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
public class User extends HasIdAndAuditing implements BeforeMongodbWrite, AfterMongodbRead {

    private static final OrgTransformedUserInfo EMPTY_TRANSFORMED_USER_INFO = new OrgTransformedUserInfo();

    private String name;

    private String uiLanguage;

    private String avatar;

    private String tpAvatarLink;

    private UserState state;

    @Builder.Default
    private Boolean isEnabled = true;

    private String activeAuthId;

    // used in form login
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String passwordResetToken;

    private Instant passwordResetTokenExpiry;

    @Builder.Default
    @Transient
    Boolean isAnonymous = false;

    private Set<Connection> connections;

    @Builder.Default
    @Setter
    @Getter
    @Transient
    private List<APIKey> apiKeysList = new ArrayList<>();

    /**
     * Only used for mongodb (de)serialization
     */
    private List<Object> apiKeys;

    @Transient
    @JsonIgnore
    private Supplier<String> avatarUrl = memoize(() -> StringUtils.isNotBlank(avatar) ? toAssetPath(avatar) : tpAvatarLink);

    @Builder.Default
    @Transient
    @JsonIgnore
    private Boolean isNewUser = false;

    private boolean hasSetNickname;

    private OrgTransformedUserInfo orgTransformedUserInfo;

    @Transient
    @JsonIgnore
    public boolean isAnonymous() {

        return Boolean.TRUE.equals(isAnonymous);
    }

    public Set<Connection> getConnections() {
        if (this.connections == null) {
            this.connections = new HashSet<>();
        }
        return this.connections;
    }

    @JsonIgnore
    public String getAvatarUrl() {
        return (avatarUrl == null) ? "" : avatarUrl.get();
    }

    public OrgTransformedUserInfo getOrgTransformedUserInfo() {
        return orgTransformedUserInfo;
    }

    public static class OrgTransformedUserInfo extends HashMap<String, TransformedUserInfo> {

        public TransformedUserInfo get(String orgId) {
            return super.get(orgId);
        }

        public void set(String orgId, TransformedUserInfo transformedUserInfo) {
            super.put(orgId, transformedUserInfo);
        }
    }

    public record TransformedUserInfo(long updateTime, Map<String, Object> extra) {

    }

    public void markAsDeleted() {
        this.setState(UserState.DELETED);
        this.setIsEnabled(false);
        SetUtils.emptyIfNull(this.getConnections())
                .forEach(connection -> connection.setSource(
                        connection.getSource() + "(User deleted at " + System.currentTimeMillis() / 1000 + ")"));
    }

    @Override
    public void beforeMongodbWrite(MongodbInterceptorContext context) {
        if (CollectionUtils.isNotEmpty(this.apiKeysList)) {
            this.apiKeysList.forEach(apiKey -> apiKey.doEncrypt(s -> context.encryptionService().encryptString(s)));
            apiKeys = JsonUtils.fromJsonSafely(JsonUtils.toJsonSafely(apiKeysList, JsonViews.Internal.class), new TypeReference<>() {
            }, new ArrayList<>());
        }
    }

    @Override
    public void afterMongodbRead(MongodbInterceptorContext context) {
        if (CollectionUtils.isNotEmpty(apiKeys))
        {
            this.apiKeysList = JsonUtils.fromJsonSafely(JsonUtils.toJson(apiKeys), new TypeReference<>() {
            }, new ArrayList<>());
            this.apiKeysList.forEach(authConfig -> authConfig.doDecrypt(s -> context.encryptionService().decryptString(s)));
        }

        /** set UI language to default one if it's null **/
        if (StringUtils.isBlank(this.uiLanguage)) {
            this.uiLanguage = UiConstants.DEFAULT_UI_LANGUAGE;
        }
    }
}
