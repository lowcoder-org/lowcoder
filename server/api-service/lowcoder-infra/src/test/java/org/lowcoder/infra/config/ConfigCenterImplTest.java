package org.lowcoder.infra.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;

/**
 * {@link ConfigCenterImpl}: each group is a view that prefixes {@code <group>.} to the key and forwards to the one
 * delegate instance. Not covered by ConfigCenterContractTest, which reads AutoReloadConfigInstanceImpl directly.
 */
class ConfigCenterImplTest {

    private static final String KEY = "some.key";
    private final List<String> calls = new ArrayList<>();
    private ConfigCenterImpl center;

    @BeforeEach
    void setUp() throws ReflectiveOperationException {
        calls.clear();
        ConfigInstance recorder = (ConfigInstance) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[] {ConfigInstance.class},
                (proxy, method, args) -> {
                    calls.add(method.getName() + Arrays.toString(args));
                    return null;
                });
        center = new ConfigCenterImpl();
        Field delegate = ConfigCenterImpl.class.getDeclaredField("delegateConfigInstance");
        delegate.setAccessible(true);
        delegate.set(center, recorder);
    }

    static Stream<Arguments> groups() {
        return Stream.of(
                group("asset", ConfigCenter::asset), group("mysqlPlugin", ConfigCenter::mysqlPlugin),
                group("clickHousePlugin", ConfigCenter::clickHousePlugin), group("mongoPlugin", ConfigCenter::mongoPlugin),
                group("postgresPlugin", ConfigCenter::postgresPlugin), group("oraclePlugin", ConfigCenter::oraclePlugin),
                group("threshold", ConfigCenter::threshold), group("proxy", ConfigCenter::proxy), group("auth", ConfigCenter::auth),
                group("datasource", ConfigCenter::datasource), group("deployment", ConfigCenter::deployment),
                group("application", ConfigCenter::application));
    }

    private static Arguments group(String name, Function<ConfigCenter, ConfigInstance> accessor) {
        return Arguments.of(name, accessor);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("groups")
    void everyGroupPrefixesItsOwnNameAndForwardsEveryAccessorWithItsArguments(String name, Function<ConfigCenter, ConfigInstance> accessor) {
        ConfigInstance instance = accessor.apply(center);

        instance.ofInteger(KEY, 1);
        instance.ofString(KEY, "s");
        instance.ofBoolean(KEY, true);
        instance.ofJson(KEY, String.class, "j");
        instance.ofList(KEY, List.of("l"), String.class);
        instance.ofStringList(KEY, List.of("sl"));
        instance.ofIntList(KEY, List.of(2));
        instance.ofLongList(KEY, List.of(3L));
        instance.ofMap(KEY, String.class, Integer.class, Map.of("k", 4));

        String prefixed = name + "." + KEY;
        System.out.println("[ConfigCenterImplTest] " + name + " -> " + calls);
        assertThat(calls).containsExactly(
                "ofInteger[" + prefixed + ", 1]",
                "ofString[" + prefixed + ", s]",
                "ofBoolean[" + prefixed + ", true]",
                "ofJson[" + prefixed + ", class java.lang.String, j]",
                "ofList[" + prefixed + ", [l], class java.lang.String]",
                "ofStringList[" + prefixed + ", [sl]]",
                "ofIntList[" + prefixed + ", [2]]",
                "ofLongList[" + prefixed + ", [3]]",
                "ofMap[" + prefixed + ", class java.lang.String, class java.lang.Integer, {k=4}]");
    }

    @Test
    void groupsOtherThanClickHouseReturnTheSameViewOnEveryCall() {
        assertThat(center.asset()).isSameAs(center.asset());
        assertThat(center.application()).isSameAs(center.application());
        assertThat(center.asset()).isNotSameAs(center.proxy());
    }

    /** Behaviour pin, not a defect: the ClickHouse view is created anew on each call (equal as a record, not identical). */
    @Test
    void clickHouseGroupReturnsANewViewOnEveryCall() {
        assertThat(center.clickHousePlugin()).isNotSameAs(center.clickHousePlugin());
    }
}
