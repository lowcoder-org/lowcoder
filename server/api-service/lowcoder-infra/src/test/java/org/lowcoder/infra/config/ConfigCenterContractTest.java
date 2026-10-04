package org.lowcoder.infra.config;

import org.junit.Test;
import org.lowcoder.infra.localcache.ReloadableCache;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.contract.QueryResults;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;

/**
 * Group {@code config-center} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T9.4): a server config value stored in MongoDB
 * is written to JSON by {@code AutoReloadConfigFactory.getValue} ({@code toJson}) and read back by the
 * {@code AutoReloadConfigInstanceImpl} accessor that asks for it ({@code fromJson}, {@code fromJsonList},
 * {@code fromJsonMap}); a value that does not read gives the accessor's default. Every accessor is asked for every
 * stored value of {@link #STORED} (integers, a long, whole and fractional doubles, numbers and booleans as strings,
 * lists and maps), and what it returns is pinned with the Java class of every value ({@link JavaValueWalker}) and the
 * production mapper's text, in {@value #REPORT}. The defaults are sentinels ({@link #DEFAULT_INT} and the like, in
 * mutable JDK containers so that no JDK-internal class is pinned), so a value that fell back to its default is visible.
 *
 * <p>Limits: the stored values are the Java values MongoDB hands out, set as the value of the factory's cache, a
 * {@code ReloadableCache} made without its builder; the factory's reload from {@code ServerConfigRepository} and the
 * cache's reload schedule are not run. {@code ofBoolean}'s default is
 * {@code false}, which a stored {@code false} cannot be told apart from.
 */
public class ConfigCenterContractTest {

    static final String REPORT = "config-center/AutoReloadConfig.values.json";
    static final String CACHE_FIELD = "allConfigs";
    static final String FACTORY_FIELD = "autoReloadConfigFactory";
    static final String CACHED_VALUE_FIELD = "cachedValue";
    static final int DEFAULT_INT = -1;
    static final long DEFAULT_LONG = -1L;
    static final String DEFAULT_STRING = "<default>";
    static final boolean DEFAULT_BOOLEAN = false;
    static final Map<String, Object> STORED = stored();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    /** A JSON accessor's target type, as the configs that use {@code ofJson} declare one. */
    public record Setting(String name, Integer limit) {
    }

    @BoundarySites({
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigFactory.java#AutoReloadConfigFactory.getValue#toJson#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofInteger#fromJson#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofString#fromJson#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofBoolean#fromJson#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofJson#fromJson#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofList#fromJsonList#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofStringList#fromJsonList#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofIntList#fromJsonList#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofLongList#fromJsonList#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.ofMap#fromJsonMap#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.fromJson#fromJson#1",
            "lowcoder-infra/src/main/java/org/lowcoder/infra/config/AutoReloadConfigInstanceImpl.java#AutoReloadConfigInstanceImpl.fromJsonList#fromJsonList#1"})
    @Test
    public void valuesAsRead() throws ReflectiveOperationException {
        AutoReloadConfigFactory factory = factory();
        Map<String, BiFunction<AutoReloadConfigInstanceImpl, String, Conf<?>>> accessors = new LinkedHashMap<>();
        accessors.put("ofInteger", (instance, key) -> instance.ofInteger(key, DEFAULT_INT));
        accessors.put("ofString", (instance, key) -> instance.ofString(key, DEFAULT_STRING));
        accessors.put("ofBoolean", (instance, key) -> instance.ofBoolean(key, DEFAULT_BOOLEAN));
        accessors.put("ofJson", (instance, key) -> instance.ofJson(key, Setting.class, new Setting(DEFAULT_STRING, DEFAULT_INT)));
        accessors.put("ofList", (instance, key) -> instance.ofList(key, new ArrayList<>(List.of(DEFAULT_STRING)), Object.class));
        accessors.put("ofStringList", (instance, key) -> instance.ofStringList(key, new ArrayList<>(List.of(DEFAULT_STRING))));
        accessors.put("ofIntList", (instance, key) -> instance.ofIntList(key, new ArrayList<>(List.of(DEFAULT_INT))));
        accessors.put("ofLongList", (instance, key) -> instance.ofLongList(key, new ArrayList<>(List.of(DEFAULT_LONG))));
        accessors.put("ofMap", (instance, key) -> instance.ofMap(key, String.class, Integer.class, new LinkedHashMap<>(Map.of(DEFAULT_STRING, DEFAULT_INT))));
        Map<String, Object> report = new LinkedHashMap<>();
        Map<String, Object> stored = new LinkedHashMap<>();
        STORED.keySet().forEach(key -> stored.put(key, factory.getValue(key)));
        report.put("getValue", stored);
        for (Map.Entry<String, BiFunction<AutoReloadConfigInstanceImpl, String, Conf<?>>> accessor : accessors.entrySet()) {
            AutoReloadConfigInstanceImpl instance = instance(factory);
            Map<String, Object> values = new LinkedHashMap<>();
            STORED.keySet().forEach(key -> values.put(key, read(() -> accessor.getValue().apply(instance, key).get())));
            report.put(accessor.getKey(), values);
        }
        String actual = ConfigBinding.write(report);
        System.out.println("[ConfigCenterContractTest] " + STORED.size() + " stored values\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The value an accessor returns, with its classes, or the error. */
    private static Object read(java.util.function.Supplier<Object> get) {
        Map<String, Object> outcome = new LinkedHashMap<>();
        try {
            Object value = get.get();
            outcome.put("classes", JavaValueWalker.shape(value).get(JavaValueWalker.CLASSES_KEY));
            outcome.put("written", QueryResults.written(value));
        } catch (RuntimeException e) {
            outcome.put(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        return outcome;
    }

    /**
     * A factory whose cache holds {@link #STORED}. The cache is made with its private constructor and its value set,
     * because {@code ReloadableCache.Builder.build()} starts a scheduled reload thread, which this test does not need.
     */
    private static AutoReloadConfigFactory factory() throws ReflectiveOperationException {
        Constructor<?> constructor = ReloadableCache.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        Object cache = constructor.newInstance();
        set(cache, CACHED_VALUE_FIELD, STORED);
        AutoReloadConfigFactory factory = new AutoReloadConfigFactory();
        set(factory, CACHE_FIELD, cache);
        return factory;
    }

    private static AutoReloadConfigInstanceImpl instance(AutoReloadConfigFactory factory) {
        AutoReloadConfigInstanceImpl instance = new AutoReloadConfigInstanceImpl();
        try {
            set(instance, FACTORY_FIELD, factory);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot wire " + FACTORY_FIELD, e);
        }
        return instance;
    }

    private static void set(Object target, String name, Object value) throws ReflectiveOperationException {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    /** Server config values as MongoDB hands them out, by key. */
    private static Map<String, Object> stored() {
        Map<String, Object> stored = new LinkedHashMap<>();
        stored.put("int", 999);
        stored.put("long", 3_000_000_001L);
        stored.put("wholeDouble", 1.0);
        stored.put("double", 1.5);
        stored.put("intText", "999");
        stored.put("decimalText", "1.0");
        stored.put("bool", true);
        stored.put("boolText", "true");
        stored.put("text", "žluť \"q\"");
        stored.put("list", Arrays.asList(1, 2.0, "3", null));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("name", "n");
        map.put("limit", 1.0);
        map.put("extra", 3_000_000_001L);
        stored.put("map", map);
        Map<String, Object> intMap = new LinkedHashMap<>();
        intMap.put("a", 1);
        intMap.put("b", 1.0);
        intMap.put("c", "2");
        stored.put("intMap", intMap);
        return stored;
    }
}
