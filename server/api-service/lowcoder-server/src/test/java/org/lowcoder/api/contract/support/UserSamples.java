package org.lowcoder.api.contract.support;

import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.ConnectionAuthToken;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.User.OrgTransformedUserInfo;
import org.lowcoder.domain.user.model.User.TransformedUserInfo;
import org.lowcoder.domain.user.model.UserState;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Samples of the user types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T2.1; {@code GET /api/applications/home} is
 * their first endpoint), with the conventions of {@link PayloadSamples}. Markers (§4.5): write-only and credential
 * values are {@link PayloadSamples#SECRET_MARKER}{@code <Type>.<property>}; the O1 fields that {@code Public} output
 * exposes today are {@link PayloadSamples#KNOWN_EXPOSURE_MARKER}{@code <Type>.<property>}.
 */
public final class UserSamples {

    private UserSamples() {
    }

    /**
     * A user with two connections and two API keys. {@code connections} is a {@code LinkedHashSet}: production's
     * {@code HashSet} of a class without {@code hashCode} has no stable order, and the sample's order becomes the
     * fixture's. {@code apiKeys} holds the shape {@code User#beforeMongodbWrite} stores.
     */
    public static User user() {
        Set<Connection> connections = new LinkedHashSet<>();
        connections.add(connection("User.connections[0]", 0));
        connections.add(connection("User.connections[1]", 1));
        List<Object> apiKeys = new ArrayList<>();
        apiKeys.add(ApplicationSamples.map("id", "User.apiKeys[0].id", "token", PayloadSamples.KNOWN_EXPOSURE_MARKER + "User.apiKeys[0].token"));
        apiKeys.add(ApplicationSamples.map("id", "User.apiKeys[1].id", "token", PayloadSamples.KNOWN_EXPOSURE_MARKER + "User.apiKeys[1].token"));
        OrgTransformedUserInfo transformed = new OrgTransformedUserInfo();
        transformed.set("User.orgTransformedUserInfo.first", transformedUserInfo("User.orgTransformedUserInfo.first", 0));
        transformed.set("User.orgTransformedUserInfo.second", transformedUserInfo("User.orgTransformedUserInfo.second", 1));
        return User.builder()
                .id("User.id")
                .createdBy("User.createdBy")
                .name("User.name")
                .email("User.email")
                .uiLanguage("User.uiLanguage")
                .avatar("User.avatar")
                .tpAvatarLink("User.tpAvatarLink")
                .superAdmin(Boolean.TRUE)
                .state(UserState.INVITED)
                .isEnabled(Boolean.FALSE)
                .activeAuthId("User.activeAuthId")
                .password(PayloadSamples.SECRET_MARKER + "User.password")
                .passwordResetToken(PayloadSamples.KNOWN_EXPOSURE_MARKER + "User.passwordResetToken")
                .passwordResetTokenExpiry(ApplicationSamples.instant(60))
                .isAnonymous(Boolean.TRUE)
                .connections(connections)
                .apiKeysList(new ArrayList<>(List.of(apiKey("User.apiKeysList[0]"), apiKey("User.apiKeysList[1]"))))
                .apiKeys(apiKeys)
                .hasSetNickname(true)
                .orgTransformedUserInfo(transformed)
                .build();
    }

    public static Connection connection() {
        return connection("Connection", 2);
    }

    /** {@code source} is not {@code EMAIL}, for which {@code Connection#getRawUserInfo} answers the raw id instead. */
    static Connection connection(String prefix, int offset) {
        return Connection.builder()
                .authId(prefix + ".authId")
                .source(prefix + ".source")
                .rawId(PayloadSamples.SECRET_MARKER + prefix + ".rawId")
                .name(prefix + ".name")
                .email(prefix + ".email")
                .avatar(prefix + ".avatar")
                .orgIds(new HashSet<>(List.of(prefix + ".orgIds[0]", prefix + ".orgIds[1]")))
                .authConnectionAuthToken(ConnectionAuthToken.builder()
                        .accessToken(PayloadSamples.SECRET_MARKER + prefix + ".authConnectionAuthToken.accessToken")
                        .expireAt(3_000_000_070L + offset)
                        .refreshToken(PayloadSamples.SECRET_MARKER + prefix + ".authConnectionAuthToken.refreshToken")
                        .refreshTokenExpireAt(3_000_000_080L + offset)
                        .build())
                .rawUserInfo(ApplicationSamples.map("sub", prefix + ".rawUserInfo.sub", "loginCount", 40_070 + offset))
                .tokens(new HashSet<>(List.of(prefix + ".tokens[0]", prefix + ".tokens[1]")))
                .build();
    }

    public static APIKey apiKey() {
        return apiKey("APIKey");
    }

    static APIKey apiKey(String prefix) {
        return new APIKey(prefix + ".id", prefix + ".name", prefix + ".description", PayloadSamples.KNOWN_EXPOSURE_MARKER + prefix + ".token");
    }

    public static TransformedUserInfo transformedUserInfo() {
        return transformedUserInfo("TransformedUserInfo", 2);
    }

    static TransformedUserInfo transformedUserInfo(String prefix, int offset) {
        return new TransformedUserInfo(3_000_000_090L + offset,
                ApplicationSamples.map("department", prefix + ".extra.department", "level", 40_090 + offset));
    }
}
