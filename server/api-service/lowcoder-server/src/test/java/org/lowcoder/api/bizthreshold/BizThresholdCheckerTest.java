package org.lowcoder.api.bizthreshold;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.test.StepVerifier;

/**
 * {@link BizThresholdChecker} over a mocked {@link ConfigCenter}: {@code init()} reads each {@code threshold.*} key with its
 * own default and each getter returns its own value. Every key answers a distinct value, so a swapped key or getter is noticed.
 * The keys are server configuration that only the deployment's super admin may write since BF-001 (not tested here).
 */
class BizThresholdCheckerTest {

    private static final int DEFAULT_ORGS_PER_USER = 11;
    private static final int DEFAULT_MEMBER_COUNT = 12;
    private static final int DEFAULT_GROUP_COUNT = 13;
    private static final int DEFAULT_APP_COUNT = 14;
    private static final int DEFAULT_DEVELOPER_COUNT = 15;

    private static final Map<String, Integer> INTEGER_VALUES = Map.of(
            "maxOrgPerUser", 101, "maxOrgMemberCount", 102, "maxOrgGroupCount", 103, "maxOrgAppCount", 104, "maxDeveloperCount", 105);
    private static final Map<String, Map<String, Integer>> MAP_VALUES = Map.of(
            "userOrgCountWhiteList", Map.of("u", 201),
            "orgMemberCountWhiteList", Map.of("o", 202),
            "orgAppCountWhiteList", Map.of("p", 203));

    private final Map<String, Integer> defaultsAsked = new HashMap<>();
    private final Map<String, Map<String, Integer>> mapDefaultsAsked = new HashMap<>();
    private BizThresholdChecker checker;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        ConfigInstance threshold = mock(ConfigInstance.class);
        when(threshold.ofInteger(anyString(), anyInt())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            defaultsAsked.put(key, invocation.getArgument(1));
            Conf<Integer> conf = () -> INTEGER_VALUES.get(key);
            return conf;
        });
        when(threshold.ofMap(anyString(), eq(String.class), eq(Integer.class), anyMap())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            mapDefaultsAsked.put(key, invocation.getArgument(3));
            Conf<Map<String, Integer>> conf = () -> MAP_VALUES.get(key);
            return conf;
        });
        ConfigCenter configCenter = mock(ConfigCenter.class);
        when(configCenter.threshold()).thenReturn(threshold);

        checker = new BizThresholdChecker();
        ReflectionTestUtils.setField(checker, "defaultMaxOrgPerUser", DEFAULT_ORGS_PER_USER);
        ReflectionTestUtils.setField(checker, "defaultMaxOrgMemberCount", DEFAULT_MEMBER_COUNT);
        ReflectionTestUtils.setField(checker, "defaultMaxOrgGroupCount", DEFAULT_GROUP_COUNT);
        ReflectionTestUtils.setField(checker, "defaultMaxOrgAppCount", DEFAULT_APP_COUNT);
        ReflectionTestUtils.setField(checker, "defaultMaxDeveloperCount", DEFAULT_DEVELOPER_COUNT);
        ReflectionTestUtils.setField(checker, "configCenter", configCenter);
        ReflectionTestUtils.invokeMethod(checker, "init");
    }

    @Test
    void init_readsEveryKeyWithItsOwnDefault() {
        assertThat(defaultsAsked).containsExactlyInAnyOrderEntriesOf(Map.of(
                "maxOrgPerUser", DEFAULT_ORGS_PER_USER, "maxOrgMemberCount", DEFAULT_MEMBER_COUNT,
                "maxOrgGroupCount", DEFAULT_GROUP_COUNT, "maxOrgAppCount", DEFAULT_APP_COUNT,
                "maxDeveloperCount", DEFAULT_DEVELOPER_COUNT));
        assertThat(mapDefaultsAsked.keySet()).containsExactlyInAnyOrder("userOrgCountWhiteList", "orgMemberCountWhiteList", "orgAppCountWhiteList");
        mapDefaultsAsked.values().forEach(defaultMap -> assertThat(defaultMap).isEqualTo(Collections.emptyMap()));
    }

    @Test
    void everyGetterReturnsItsOwnValue() {
        assertThat((int) ReflectionTestUtils.invokeMethod(checker, "getMaxOrgPerUser")).isEqualTo(101);
        assertThat((int) ReflectionTestUtils.invokeMethod(checker, "getMaxOrgMemberCount")).isEqualTo(102);
        assertThat((int) ReflectionTestUtils.invokeMethod(checker, "getMaxOrgGroupCount")).isEqualTo(103);
        assertThat((int) ReflectionTestUtils.invokeMethod(checker, "getMaxOrgAppCount")).isEqualTo(104);
        assertThat(ReflectionTestUtils.<Map<String, Integer>>invokeMethod(checker, "getUserOrgCountWhiteList")).containsEntry("u", 201);
        assertThat(ReflectionTestUtils.<Map<String, Integer>>invokeMethod(checker, "getOrgMemberCountWhiteList")).containsEntry("o", 202);
        assertThat(ReflectionTestUtils.<Map<String, Integer>>invokeMethod(checker, "getOrgAppCountWhiteList")).containsEntry("p", 203);
        StepVerifier.create(ReflectionTestUtils.<reactor.core.publisher.Mono<Integer>>invokeMethod(checker, "getMaxDeveloperCount"))
                .expectNext(105).verifyComplete();
    }
}
