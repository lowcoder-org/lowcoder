package org.lowcoder.sdk.models;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import org.slf4j.LoggerFactory;

/**
 * Merge, password stripping and encryption of {@link JsDatasourceConnectionConfig}, the config of dynamic (JS)
 * datasource plugins. The stored config carries the plugin {@code definition}; the update never does.
 */
class JsDatasourceConnectionConfigTest {

    private static final String PLUGIN_TYPE = "jsPlugin";
    private static final String KEY_HOST = "host";
    private static final String KEY_PASSWORD = "password";
    private static final String KEY_DYN_USER = "dynUser";
    private static final String KEY_DYN_PASSWORD = "dynPassword";
    private static final String KEY_DYN_CONFIG = "dynamicParamsConfig";
    private static final String KEY_DYN_DEF = "dynamicParamsDef";
    private static final String KEY_EXTRA = "extra";
    private static final String KEY_AUTH = "authConfig";
    private static final String STORED_PASSWORD = "stored-secret";
    private static final String NEW_PASSWORD = "new-secret";

    private static Map<String, Object> param(String key, String type) {
        Map<String, Object> param = new HashMap<>();
        param.put("key", key);
        param.put("type", type);
        return param;
    }

    private static Map<String, Object> definition() {
        Map<String, Object> dataSourceConfig = new HashMap<>();
        dataSourceConfig.put("params", List.of(param(KEY_HOST, "text"), param(KEY_PASSWORD, "password")));
        Map<String, Object> definition = new HashMap<>();
        definition.put("dataSourceConfig", dataSourceConfig);
        return definition;
    }

    private static List<Object> dynamicDef() {
        return new ArrayList<>(List.of(param(KEY_DYN_USER, "text"), param(KEY_DYN_PASSWORD, "password")));
    }

    private static JsDatasourceConnectionConfig config(String type, Object definition, Map<String, Object> values) {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.setType(type);
        config.setDefinition(definition);
        config.putAll(values);
        return config;
    }

    private static Map<String, Object> values(Object... keyValues) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }

    private static JsDatasourceConnectionConfig stored(Map<String, Object> values) {
        return config(PLUGIN_TYPE, definition(), values);
    }

    private static JsDatasourceConnectionConfig update(Map<String, Object> values) {
        return config(PLUGIN_TYPE, null, values);
    }

    private static JsDatasourceConnectionConfig merge(JsDatasourceConnectionConfig stored, JsDatasourceConnectionConfig update) {
        return (JsDatasourceConnectionConfig) stored.mergeWithUpdatedConfig(update);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> dynamicConfigOf(JsDatasourceConnectionConfig config) {
        return (Map<String, Object>) config.get(KEY_DYN_CONFIG);
    }

    @Test
    void mergeKeepsStoredStaticPasswordWhenUpdateHasNone() {
        JsDatasourceConnectionConfig merged = merge(stored(values(KEY_HOST, "old", KEY_PASSWORD, STORED_PASSWORD)),
                update(values(KEY_HOST, "new")));

        assertThat(merged.get(KEY_PASSWORD)).isEqualTo(STORED_PASSWORD);
        assertThat(merged.get(KEY_HOST)).isEqualTo("new");
        System.out.println("[JsDatasourceConnectionConfigTest] password kept on edit without password: " + merged);
    }

    @Test
    void mergeReplacesStaticPasswordWhenUpdateSendsOne() {
        JsDatasourceConnectionConfig merged = merge(stored(values(KEY_PASSWORD, STORED_PASSWORD)),
                update(values(KEY_PASSWORD, NEW_PASSWORD)));

        assertThat(merged.get(KEY_PASSWORD)).isEqualTo(NEW_PASSWORD);
        System.out.println("[JsDatasourceConnectionConfigTest] new password wins over the stored one");
    }

    @Test
    void mergeTakesNonPasswordStaticKeyFromUpdateAndDropsKeysOutsideDefinition() {
        JsDatasourceConnectionConfig merged = merge(
                stored(values(KEY_HOST, "stored-host", "stale", "stored-stale")),
                update(values("outside", "ignored")));

        assertThat(merged).containsKey(KEY_HOST);
        assertThat(merged.get(KEY_HOST)).as("host absent in the update must not fall back to the stored host").isNull();
        assertThat(merged).doesNotContainKeys("stale", "outside");
        System.out.println("[JsDatasourceConnectionConfigTest] non-password key comes from the update only: " + merged);
    }

    /** The Lowcoder plugin's datasource params (node-service {@code plugins/lowcoder/index.ts}): the plugin of GitHub #2053. */
    private static Map<String, Object> lowcoderPluginDefinition() {
        Map<String, Object> dataSourceConfig = new HashMap<>();
        dataSourceConfig.put("params", List.of(param("serverURL", "textInput"), param("bearerAuth.value", "password"),
                param("specVersion", "select")));
        return values("dataSourceConfig", dataSourceConfig);
    }

    /** What the plugin form sends on save for the Lowcoder plugin with every advanced setting filled in (GitHub #2053). */
    private static Map<String, Object> lowcoderFormUpdate() {
        return values("serverURL", "http://api:8080", "specVersion", "v1.3",
                JsDatasourceConnectionConfig.HEADERS_KEY, List.of(values("key", "X-A", "value", "1")),
                JsDatasourceConnectionConfig.FORWARD_COOKIES_KEY, List.of("LOWCODER_CE_SELFHOST_TOKEN"),
                JsDatasourceConnectionConfig.FORWARD_ALL_COOKIES_KEY, true,
                JsDatasourceConnectionConfig.SSL_CERT_VERIFICATION_TYPE_KEY, "VERIFY_SELF_SIGNED_CERT",
                JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY, "-----BEGIN CERTIFICATE-----",
                "outside", "ignored");
    }

    /**
     * NEW-18 (GitHub #2053): the headers and advanced settings the plugin form sends are kept on update, as create keeps
     * them; they used to be dropped with every key outside the plugin definition. Catches a setting left out of the kept
     * keys, the stored password lost, and other keys outside the definition kept.
     */
    @Test
    void mergeKeepsTheHeadersAndAdvancedSettingsTheFormSendsNEW18() {
        JsDatasourceConnectionConfig storedConfig = config(PLUGIN_TYPE, lowcoderPluginDefinition(),
                values("serverURL", "http://old", "bearerAuth.value", "enc", "specVersion", "v1.3"));
        Map<String, Object> sent = lowcoderFormUpdate();

        JsDatasourceConnectionConfig merged = merge(storedConfig, update(sent));

        System.out.println("[JsDatasourceConnectionConfigTest] NEW-18 update sent: " + sent);
        System.out.println("[JsDatasourceConnectionConfigTest] NEW-18 merged     : " + merged);
        for (String key : List.of(JsDatasourceConnectionConfig.HEADERS_KEY, JsDatasourceConnectionConfig.FORWARD_COOKIES_KEY,
                JsDatasourceConnectionConfig.FORWARD_ALL_COOKIES_KEY, JsDatasourceConnectionConfig.SSL_CERT_VERIFICATION_TYPE_KEY,
                JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY)) {
            assertThat(merged.get(key)).as(key).isEqualTo(sent.get(key));
        }
        assertThat(merged).containsEntry("serverURL", "http://api:8080").containsEntry("bearerAuth.value", "enc")
                .doesNotContainKey("outside");
    }

    /**
     * NEW-18: the update decides, as for a non-password param: a stored setting the update leaves out is cleared, and an
     * update without settings adds no keys. Catches a stored setting falling back in and settings added as nulls.
     */
    @Test
    void aSettingTheUpdateLeavesOutIsClearedAndNoneIsAddedNEW18() {
        JsDatasourceConnectionConfig storedConfig = config(PLUGIN_TYPE, lowcoderPluginDefinition(), values("serverURL", "http://old",
                JsDatasourceConnectionConfig.FORWARD_COOKIES_KEY, List.of("stored"), JsDatasourceConnectionConfig.FORWARD_ALL_COOKIES_KEY, true));

        JsDatasourceConnectionConfig merged = merge(storedConfig, update(values("serverURL", "http://new",
                JsDatasourceConnectionConfig.FORWARD_ALL_COOKIES_KEY, false)));

        System.out.println("[JsDatasourceConnectionConfigTest] NEW-18 settings left out of the update: " + merged);
        assertThat(merged).containsEntry(JsDatasourceConnectionConfig.FORWARD_ALL_COOKIES_KEY, false)
                .doesNotContainKeys(JsDatasourceConnectionConfig.FORWARD_COOKIES_KEY, JsDatasourceConnectionConfig.HEADERS_KEY,
                        JsDatasourceConnectionConfig.SSL_CERT_VERIFICATION_TYPE_KEY, JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY);
    }

    /**
     * NEW-18: a plugin that declares a setting's key as its own param keeps that param's handling; for a password param an
     * update sending no value keeps the stored one. Catches the kept settings overwriting the static param handling.
     */
    @Test
    void aSettingKeyThePluginDeclaresAsAPasswordKeepsThePasswordHandlingNEW18() {
        Map<String, Object> dataSourceConfig = values("params", List.of(param(JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY, "password")));
        JsDatasourceConnectionConfig storedConfig = config(PLUGIN_TYPE, values("dataSourceConfig", dataSourceConfig),
                values(JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY, STORED_PASSWORD));

        JsDatasourceConnectionConfig merged = merge(storedConfig, update(values(JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY, null)));

        System.out.println("[JsDatasourceConnectionConfigTest] NEW-18 declared password param sent empty: " + merged);
        assertThat(merged).containsEntry(JsDatasourceConnectionConfig.SELF_SIGNED_CERT_KEY, STORED_PASSWORD);
    }

    @Test
    void mergeHandlesDynamicParamsDefinitionAndConfig() {
        JsDatasourceConnectionConfig storedConfig = stored(values(
                KEY_DYN_DEF, dynamicDef(),
                KEY_DYN_CONFIG, values(KEY_DYN_USER, "old-user", KEY_DYN_PASSWORD, STORED_PASSWORD)));
        List<Object> updatedDef = List.of(param("updatedDefMarker", "text"));

        // update sends no dynamic password
        JsDatasourceConnectionConfig keepsOld = merge(storedConfig, update(values(
                KEY_DYN_DEF, updatedDef,
                KEY_DYN_CONFIG, values(KEY_DYN_USER, "new-user"))));
        assertThat(dynamicConfigOf(keepsOld)).containsEntry(KEY_DYN_PASSWORD, STORED_PASSWORD)
                .containsEntry(KEY_DYN_USER, "new-user");
        assertThat(keepsOld.get(KEY_DYN_DEF)).as("dynamicParamsDef comes from the update").isEqualTo(updatedDef);

        // update sends a dynamic password; a non-password dynamic key missing in the update is null, not the stored value
        JsDatasourceConnectionConfig replaces = merge(storedConfig, update(values(
                KEY_DYN_CONFIG, values(KEY_DYN_PASSWORD, NEW_PASSWORD))));
        assertThat(dynamicConfigOf(replaces)).containsEntry(KEY_DYN_PASSWORD, NEW_PASSWORD).containsEntry(KEY_DYN_USER, null);

        // update without any dynamicParamsConfig at all
        JsDatasourceConnectionConfig noDynamicConfig = merge(storedConfig, update(values()));
        assertThat(dynamicConfigOf(noDynamicConfig)).containsEntry(KEY_DYN_PASSWORD, STORED_PASSWORD);
        System.out.println("[JsDatasourceConnectionConfigTest] dynamic merge: " + keepsOld + " / " + replaces + " / " + noDynamicConfig);
    }

    @Test
    void mergeRejectsNonJsConfig() {
        DatasourceConnectionConfig other = new DatasourceConnectionConfig() {
            @Override
            public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
                return this;
            }
        };
        assertThatThrownBy(() -> stored(values()).mergeWithUpdatedConfig(other))
                .isInstanceOfSatisfying(BizException.class,
                        e -> assertThat(e.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIG_TYPE));
        System.out.println("[JsDatasourceConnectionConfigTest] non-Js update rejected");
    }

    @Test
    void mergeRejectsDifferentPluginType() {
        JsDatasourceConnectionConfig otherType = config("otherPlugin", null, values());
        assertThatThrownBy(() -> stored(values()).mergeWithUpdatedConfig(otherType))
                .isInstanceOfSatisfying(BizException.class,
                        e -> assertThat(e.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIG_TYPE));
        System.out.println("[JsDatasourceConnectionConfigTest] update of another plugin type rejected");
    }

    static Stream<Arguments> extraCases() {
        return Stream.of(
                Arguments.of(values(KEY_EXTRA, "stored"), values(), true, "stored"),
                Arguments.of(values(), values(KEY_EXTRA, "updated"), true, "updated"),
                Arguments.of(values(KEY_EXTRA, "stored"), values(KEY_EXTRA, "updated"), true, "updated"),
                Arguments.of(values(KEY_EXTRA, "stored"), values(KEY_EXTRA, null), true, "stored"),
                Arguments.of(values(), values(), false, null));
    }

    @ParameterizedTest
    @MethodSource("extraCases")
    void mergeKeepsExtraOnlyWhenOneSideHasIt(Map<String, Object> storedValues, Map<String, Object> updateValues,
            boolean expectPresent, String expectedValue) {
        JsDatasourceConnectionConfig merged = merge(stored(storedValues), update(updateValues));

        assertThat(merged.containsKey(KEY_EXTRA)).isEqualTo(expectPresent);
        assertThat(merged.getExtra()).isEqualTo(expectedValue);
        System.out.println("[JsDatasourceConnectionConfigTest] extra " + storedValues + " + " + updateValues + " -> " + merged.getExtra());
    }

    static Stream<Arguments> authConfigCases() {
        Map<String, Object> storedAuth = values("type", "STORED");
        Map<String, Object> updatedAuth = values("type", "UPDATED");
        return Stream.of(
                Arguments.of(true, true, updatedAuth),
                Arguments.of(true, false, null),
                Arguments.of(false, true, updatedAuth),
                Arguments.of(false, false, null));
    }

    @ParameterizedTest
    @MethodSource("authConfigCases")
    void mergeAuthConfigTruthTable(boolean storedHasAuth, boolean updateHasAuth, Map<String, Object> expectedAuth) {
        Map<String, Object> storedValues = storedHasAuth ? values(KEY_AUTH, values("type", "STORED")) : values();
        Map<String, Object> updateValues = updateHasAuth ? values(KEY_AUTH, values("type", "UPDATED")) : values();

        JsDatasourceConnectionConfig merged = merge(stored(storedValues), update(updateValues));

        assertThat(merged.containsKey(KEY_AUTH)).isEqualTo(expectedAuth != null);
        assertThat(merged.get(KEY_AUTH)).isEqualTo(expectedAuth);
        System.out.println("[JsDatasourceConnectionConfigTest] authConfig stored=" + storedHasAuth + " update=" + updateHasAuth + " -> " + merged.get(KEY_AUTH));
    }

    @Test
    void mergeWithNullDefinitionYieldsNoStaticKeysAndLogsTheMissingDefinition() {
        Logger logger = (Logger) LoggerFactory.getLogger(JsDatasourceConnectionConfig.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            JsDatasourceConnectionConfig merged = merge(config(PLUGIN_TYPE, null, values(KEY_HOST, "old", KEY_PASSWORD, STORED_PASSWORD)),
                    update(values(KEY_HOST, "new", KEY_PASSWORD, NEW_PASSWORD)));

            assertThat(merged).doesNotContainKeys(KEY_HOST, KEY_PASSWORD);
            assertThat(appender.list).anySatisfy(event -> {
                assertThat(event.getLevel()).isEqualTo(Level.ERROR);
                assertThat(event.getFormattedMessage()).isEqualTo("definition is null: " + PLUGIN_TYPE);
            });
            System.out.println("[JsDatasourceConnectionConfigTest] null definition: no static keys, logged: " + appender.list.get(0).getFormattedMessage());
        } finally {
            logger.detachAppender(appender);
        }
    }

    @Test
    void removePasswordsRemovesStaticAndDynamicPasswordsOnly() {
        JsDatasourceConnectionConfig config = stored(values(
                KEY_HOST, "h", KEY_PASSWORD, STORED_PASSWORD,
                KEY_DYN_DEF, dynamicDef(),
                KEY_DYN_CONFIG, values(KEY_DYN_USER, "u", KEY_DYN_PASSWORD, STORED_PASSWORD)));

        config.removePasswords();

        assertThat(config).containsEntry(KEY_HOST, "h").doesNotContainKey(KEY_PASSWORD);
        assertThat(dynamicConfigOf(config)).containsEntry(KEY_DYN_USER, "u").doesNotContainKey(KEY_DYN_PASSWORD);
        System.out.println("[JsDatasourceConnectionConfigTest] after removePasswords: " + config);
    }

    @Test
    void removePasswordsToleratesMissingDynamicParamsConfig() {
        JsDatasourceConnectionConfig config = stored(values(KEY_PASSWORD, STORED_PASSWORD, KEY_DYN_DEF, dynamicDef()));

        config.removePasswords();

        assertThat(config).doesNotContainKeys(KEY_PASSWORD, KEY_DYN_CONFIG);
        System.out.println("[JsDatasourceConnectionConfigTest] removePasswords without dynamicParamsConfig: " + config);
    }

    @Test
    void encryptAndDecryptApplyFunctionOnceToStringPasswordValuesOnly() {
        AtomicInteger calls = new AtomicInteger();
        JsDatasourceConnectionConfig config = stored(values(
                KEY_HOST, "plain-host", KEY_PASSWORD, "pw",
                KEY_DYN_DEF, dynamicDef(),
                KEY_DYN_CONFIG, values(KEY_DYN_USER, "plain-user", KEY_DYN_PASSWORD, "dynpw")));

        DatasourceConnectionConfig encrypted = config.doEncrypt(s -> {
            calls.incrementAndGet();
            return "enc(" + s + ")";
        });

        assertThat(encrypted).isSameAs(config);
        assertThat(calls).as("one call per password value, static + dynamic").hasValue(2);
        assertThat(config).containsEntry(KEY_PASSWORD, "enc(pw)").containsEntry(KEY_HOST, "plain-host");
        assertThat(dynamicConfigOf(config)).containsEntry(KEY_DYN_PASSWORD, "enc(dynpw)").containsEntry(KEY_DYN_USER, "plain-user");

        DatasourceConnectionConfig decrypted = config.doDecrypt(s -> s.substring("enc(".length(), s.length() - 1));
        assertThat(decrypted).isSameAs(config);
        assertThat(config).containsEntry(KEY_PASSWORD, "pw");
        assertThat(dynamicConfigOf(config)).containsEntry(KEY_DYN_PASSWORD, "dynpw");
        System.out.println("[JsDatasourceConnectionConfigTest] encrypt/decrypt roundtrip: " + config);
    }

    @Test
    void encryptSkipsNonStringPasswordValues() {
        AtomicInteger calls = new AtomicInteger();
        JsDatasourceConnectionConfig config = stored(values(KEY_PASSWORD, 12345));

        config.doEncrypt(s -> {
            calls.incrementAndGet();
            return "enc(" + s + ")";
        });

        assertThat(calls).hasValue(0);
        assertThat(config.get(KEY_PASSWORD)).isEqualTo(12345);
        System.out.println("[JsDatasourceConnectionConfigTest] non-String password value left alone");
    }

    static Stream<Arguments> oauthInheritCases() {
        return Stream.of(
                Arguments.of("no authConfig", null, false, null),
                Arguments.of("inherit from login", values("type", RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN.name(), "authId", "auth-1"), true, "auth-1"),
                Arguments.of("other type", values("type", RestApiAuthType.BASIC_AUTH.name(), "authId", "auth-2"), false, null));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("oauthInheritCases")
    void isOauth2InheritFromLoginAndAuthId(String label, Map<String, Object> authConfig, boolean expectedInherit, String expectedAuthId) {
        JsDatasourceConnectionConfig config = authConfig == null ? stored(values()) : stored(values(KEY_AUTH, new HashMap<>(authConfig)));

        assertThat(config.isOauth2InheritFromLogin()).isEqualTo(expectedInherit);
        assertThat(config.getAuthId()).isEqualTo(expectedAuthId);
        System.out.println("[JsDatasourceConnectionConfigTest] " + label + " -> inherit=" + expectedInherit + ", authId=" + expectedAuthId);
    }

    static Stream<Arguments> malformedAuthConfigs() {
        return Stream.of(
                Arguments.of("map without type", new HashMap<>(values("authId", "auth-3"))),
                Arguments.of("not a map", RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN.name()));
    }

    /**
     * BF-091 (plan section 9 row "JsDatasourceConnectionConfig.isOauth2InheritFromLogin ... throws a NullPointerException
     * when the stored authConfig map has no type key", was pinned): the authConfig is user-supplied JSON; one without a
     * type, or one that is not a map, is not OAuth inherited from login and has no auth id, instead of throwing.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("malformedAuthConfigs")
    void aMalformedAuthConfigIsNotInheritedFromLoginAndHasNoAuthIdBF091(String label, Object authConfig) {
        JsDatasourceConnectionConfig config = stored(values(KEY_AUTH, authConfig));

        assertThat(config.isOauth2InheritFromLogin()).isFalse();
        assertThat(config.getAuthId()).isNull();
        System.out.println("[JsDatasourceConnectionConfigTest] authConfig " + label + " -> inherit=false, authId=null");
    }
}
