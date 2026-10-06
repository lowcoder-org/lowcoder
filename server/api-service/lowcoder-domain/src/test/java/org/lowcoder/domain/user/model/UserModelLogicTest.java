package org.lowcoder.domain.user.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.sdk.constants.AuthSourceConstants;

/**
 * User model decisions (unit U4b, task L3-7): UserStatus, Connection and ConnectionAuthToken.
 */
class UserModelLogicTest {

    private static final String GUIDANCE_KEY = "newUserGuidance";
    private static final String OTHER_KEY = "other";
    private static final String ORG_A = "orgA";
    private static final String ORG_B = "orgB";
    private static final String GITHUB = "GITHUB";
    private static final String RAW_ID = "raw-1";
    private static final long SECOND = 1000L;
    private static final long MARGIN_SECONDS = 60;
    private static final long TOLERANCE_SECONDS = 5;
    private static final long FAR_SECONDS = 3600;

    private static long nowSeconds() {
        return System.currentTimeMillis() / SECOND;
    }

    private static Connection connection(String source, Set<String> orgIds) {
        return Connection.builder().source(source).rawId(RAW_ID).orgIds(orgIds).build();
    }

    // ---------------------------------------------------------------- UserStatus

    /** Catches: a user without a status map not getting the guidance flag, or a null Boolean throwing. */
    @Test
    void statusMapWithoutAStoredMapCarriesOnlyTheGuidanceFlag() {
        UserStatus unset = UserStatus.builder().build();
        System.out.println("[UserModelLogicTest] null map, null flag -> " + unset.getStatusMap());
        assertThat(unset.getStatusMap()).containsOnly(Map.entry(GUIDANCE_KEY, false));
        assertThat(UserStatus.builder().hasShowNewUserGuidance(true).build().getStatusMap())
                .containsOnly(Map.entry(GUIDANCE_KEY, true));
    }

    /** Catches: the stored value being overwritten by the Boolean field when the key is already present. */
    @Test
    void statusMapThatAlreadyHasTheKeyIsReturnedUnchanged() {
        Map<String, Object> stored = new HashMap<>(Map.of(GUIDANCE_KEY, "stored", OTHER_KEY, 1));
        UserStatus status = UserStatus.builder().hasShowNewUserGuidance(true).statusMap(stored).build();

        assertThat(status.getStatusMap()).isSameAs(stored).containsEntry(GUIDANCE_KEY, "stored");
    }

    /** Catches: the stored map being mutated (the original is shared with the persisted document). */
    @Test
    void statusMapWithoutTheKeyIsACopyWithTheFlagAdded() {
        Map<String, Object> stored = new HashMap<>(Map.of(OTHER_KEY, 1));
        UserStatus status = UserStatus.builder().hasShowNewUserGuidance(true).statusMap(stored).build();

        Map<String, Object> result = status.getStatusMap();
        System.out.println("[UserModelLogicTest] stored=" + stored + " result=" + result);
        assertThat(result).containsEntry(GUIDANCE_KEY, true).containsEntry(OTHER_KEY, 1);
        assertThat(result).isNotSameAs(stored);
        assertThat(stored).doesNotContainKey(GUIDANCE_KEY);
    }

    /** Catches: a null Boolean throwing or counting as true; a banned user not being reported. */
    @Test
    void bannedAndGuidanceFlagsTreatNullAsFalse() {
        UserStatus none = UserStatus.builder().build();
        assertThat(none.isBanned()).isFalse();
        assertThat(none.hasShowNewUserGuidance()).isFalse();

        UserStatus set = UserStatus.builder().banned(true).hasShowNewUserGuidance(true).build();
        assertThat(set.isBanned()).isTrue();
        assertThat(set.hasShowNewUserGuidance()).isTrue();

        UserStatus unset = UserStatus.builder().banned(false).hasShowNewUserGuidance(false).build();
        assertThat(unset.isBanned()).isFalse();
        assertThat(unset.hasShowNewUserGuidance()).isFalse();
        System.out.println("[UserModelLogicTest] null/true/false flags checked");
    }

    // ---------------------------------------------------------------- Connection

    /** Catches: an NPE when tokens were never set; tokens added and removed wrongly. */
    @Test
    void tokensCanBeAddedAndRemovedEvenWhenNeverInitialised() {
        Connection fresh = connection(GITHUB, null);
        assertThat(fresh.getTokens()).isEmpty();
        fresh.addToken("t1");
        fresh.addToken("t2");
        assertThat(fresh.getTokens()).containsExactlyInAnyOrder("t1", "t2");
        fresh.removeToken("t1");
        assertThat(fresh.getTokens()).containsExactly("t2");

        Connection never = connection(GITHUB, null);
        never.removeToken("absent");
        assertThat(never.getTokens()).isEmpty();
        System.out.println("[UserModelLogicTest] add/remove token on null set ok");
    }

    /** Catches: a null or empty org set not being replaced by a mutable one, so addOrg would NPE. */
    @Test
    void orgsStartEmptyEvenFromNullAndCanBeAddedAndFound() {
        for (Set<String> given : new Set[] {null, Set.<String>of()}) {
            Connection connection = connection(GITHUB, given);
            assertThat(connection.containOrg(ORG_A)).isFalse();
            connection.addOrg(ORG_A);
            assertThat(connection.containOrg(ORG_A)).isTrue();
            assertThat(connection.containOrg(ORG_B)).isFalse();
        }
    }

    /**
     * Catches: the cloud match ignoring the organisation, or the self-host match requiring it.
     * Columns: sourceType asked for, whether the connection belongs to ORG_A, cloud result, self-host result.
     */
    @ParameterizedTest(name = "ask={0} inOrg={1} -> cloud={2} selfHost={3}")
    @CsvSource({
            "GITHUB,true,true,true",
            "GITHUB,false,false,true",
            "GOOGLE,true,false,false",
            "GOOGLE,false,false,false"
    })
    void thirdPartyMatchNeedsTheOrgOnlyInTheCloud(String asked, boolean inOrg, boolean cloud, boolean selfHost) {
        Connection connection = connection(GITHUB, inOrg ? new HashSet<>(Set.of(ORG_A)) : new HashSet<>(Set.of(ORG_B)));
        System.out.println("[UserModelLogicTest] ask=" + asked + " inOrg=" + inOrg + " -> cloud="
                + connection.matchThirdPartyLoginSourceInCloud(asked, ORG_A) + " selfHost="
                + connection.matchThirdPartyLoginSourceInSelfHost(asked));
        assertThat(connection.matchThirdPartyLoginSourceInCloud(asked, ORG_A)).isEqualTo(cloud);
        assertThat(connection.matchThirdPartyLoginSourceInSelfHost(asked)).isEqualTo(selfHost);
    }

    /**
     * Catches (BF-040): a connection stored without an auth id throwing, or a null id (a user without an active auth id)
     * matching such a connection. Columns: the connection's auth id, the id asked for, whether it matches.
     */
    @ParameterizedTest(name = "connection={0} asked={1} -> {2}")
    @CsvSource(value = {
            "auth-A,auth-A,true",
            "auth-A,auth-B,false",
            "auth-A,NULL,false",
            "NULL,auth-A,false",
            "NULL,NULL,false"
    }, nullValues = "NULL")
    void hasAuthIdMatchesOnlyTheSameNonNullIdBF040(String connectionAuthId, String asked, boolean matches) {
        Connection connection = Connection.builder().authId(connectionAuthId).source(GITHUB).rawId(RAW_ID).build();
        System.out.println("[UserModelLogicTest] connection authId=" + connectionAuthId + " asked=" + asked + " -> "
                + connection.hasAuthId(asked));
        assertThat(connection.hasAuthId(asked)).isEqualTo(matches);
    }

    /** Catches: the email source exposing the stored info, or other sources losing it; null info must not leak. */
    @Test
    void rawUserInfoIsDerivedFromTheRawIdForEmailAndStoredOtherwise() {
        Connection email = Connection.builder().source(AuthSourceConstants.EMAIL).rawId(RAW_ID)
                .rawUserInfo(Map.of("ignored", "x")).build();
        assertThat(email.getRawUserInfo()).isEqualTo(Map.of("email", RAW_ID));

        Connection github = Connection.builder().source(GITHUB).rawId(RAW_ID).rawUserInfo(Map.of("login", "u")).build();
        assertThat(github.getRawUserInfo()).isEqualTo(Map.of("login", "u"));

        Connection nothing = Connection.builder().source(GITHUB).rawId(RAW_ID).build();
        assertThat(nothing.getRawUserInfo()).isNotNull().isEmpty();
        System.out.println("[UserModelLogicTest] raw user info for EMAIL / other / null");
    }

    // ---------------------------------------------------------------- ConnectionAuthToken

    /** Catches: a missing expiry counting as valid; the comparison reversed. Values are an hour from now, so no clock race. */
    @ParameterizedTest(name = "expireAt offset {0}s -> expired={1}")
    @CsvSource({"-3600,true", "3600,false"})
    void accessTokenExpiryComparesWithNow(long offsetSeconds, boolean expired) {
        ConnectionAuthToken token = ConnectionAuthToken.builder().expireAt(nowSeconds() + offsetSeconds).build();
        System.out.println("[UserModelLogicTest] access expireAt offset " + offsetSeconds + " expired=" + token.isAccessTokenExpired());
        assertThat(token.isAccessTokenExpired()).isEqualTo(expired);
    }

    /** Catches: as above for the refresh token, which uses its own field. */
    @ParameterizedTest(name = "refreshTokenExpireAt offset {0}s -> expired={1}")
    @CsvSource({"-3600,true", "3600,false"})
    void refreshTokenExpiryComparesWithNow(long offsetSeconds, boolean expired) {
        ConnectionAuthToken token = ConnectionAuthToken.builder().refreshTokenExpireAt(nowSeconds() + offsetSeconds).build();
        assertThat(token.isRefreshTokenExpired()).isEqualTo(expired);
    }

    /** Catches: a token without any expiry being treated as still valid; the two fields being mixed up. */
    @Test
    void aMissingExpiryMeansExpiredAndEachFieldIsIndependent() {
        ConnectionAuthToken empty = ConnectionAuthToken.builder().build();
        assertThat(empty.isAccessTokenExpired()).isTrue();
        assertThat(empty.isRefreshTokenExpired()).isTrue();

        ConnectionAuthToken onlyAccessValid = ConnectionAuthToken.builder().expireAt(nowSeconds() + FAR_SECONDS).build();
        assertThat(onlyAccessValid.isAccessTokenExpired()).isFalse();
        assertThat(onlyAccessValid.isRefreshTokenExpired()).isTrue();

        ConnectionAuthToken onlyRefreshValid = ConnectionAuthToken.builder().refreshTokenExpireAt(nowSeconds() + FAR_SECONDS).build();
        assertThat(onlyRefreshValid.isAccessTokenExpired()).isTrue();
        assertThat(onlyRefreshValid.isRefreshTokenExpired()).isFalse();
    }

    /** Catches: the 60 s safety margin lost; the zero special case dropped; the two expiries mixed up. */
    @Test
    void conversionKeepsZeroAndSubtractsTheSafetyMarginOtherwise() {
        long expireIn = 3600;
        long refreshExpireIn = 7200;
        long before = nowSeconds();
        ConnectionAuthToken converted = ConnectionAuthToken.of(AuthToken.builder().accessToken("a").refreshToken("r")
                .expireIn((int) expireIn).refreshTokenExpireIn((int) refreshExpireIn).build());
        long after = nowSeconds();
        System.out.println("[UserModelLogicTest] converted expireAt=" + converted.getExpireAt() + " refreshAt="
                + converted.getRefreshTokenExpireAt() + " now~" + before);

        assertThat(converted.getAccessToken()).isEqualTo("a");
        assertThat(converted.getRefreshToken()).isEqualTo("r");
        assertThat(converted.getSource()).isNull();
        assertThat(converted.getExpireAt()).isBetween(before + expireIn - MARGIN_SECONDS, after + expireIn - MARGIN_SECONDS);
        assertThat(converted.getRefreshTokenExpireAt())
                .isBetween(before + refreshExpireIn - MARGIN_SECONDS, after + refreshExpireIn - MARGIN_SECONDS);

        ConnectionAuthToken zero = ConnectionAuthToken.of(AuthToken.builder().accessToken("a").build());
        assertThat(zero.getExpireAt()).isZero();
        assertThat(zero.getRefreshTokenExpireAt()).isZero();
        assertThat(zero.isAccessTokenExpired()).isTrue();

        ConnectionAuthToken onlyRefresh = ConnectionAuthToken.of(AuthToken.builder().refreshTokenExpireIn((int) refreshExpireIn).build());
        assertThat(onlyRefresh.getExpireAt()).isZero();
        assertThat(onlyRefresh.getRefreshTokenExpireAt()).isGreaterThan(before + refreshExpireIn - MARGIN_SECONDS - TOLERANCE_SECONDS);
    }
}
