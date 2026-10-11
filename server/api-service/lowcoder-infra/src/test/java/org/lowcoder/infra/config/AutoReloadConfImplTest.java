package org.lowcoder.infra.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.dynamic.Conf;

/** {@link AutoReloadConfImpl} resolution rules and the {@code ConfKey} caching of {@link AutoReloadConfigInstanceImpl}. */
class AutoReloadConfImplTest {

    private static final String KEY = "k";
    private static final int DEFAULT = 5;

    /** The factory's stored strings, mutable so a test can change the "configured" value between reads. */
    private final Map<String, String> stored = new HashMap<>();

    private final AutoReloadConfigFactory factory = new AutoReloadConfigFactory() {
        @Override
        public String getValue(String confKey) {
            return stored.get(confKey);
        }
    };

    private AutoReloadConfImpl<Integer> intConf() {
        return new AutoReloadConfImpl<>(KEY, DEFAULT, factory, Integer::valueOf);
    }

    @Test
    void absentValueGivesTheDefault() {
        assertThat(intConf().get()).isEqualTo(DEFAULT);
    }

    @Test
    void configuredValueIsResolvedAndAnUnchangedStringReturnsTheResolvedValueAgain() {
        stored.put(KEY, "10");
        AutoReloadConfImpl<Integer> conf = intConf();

        assertThat(conf.get()).isEqualTo(10);
        assertThat(conf.get()).isEqualTo(10);
    }

    @Test
    void aChangedStringIsResolvedAgain() {
        AutoReloadConfImpl<Integer> conf = intConf();
        stored.put(KEY, "10");
        assertThat(conf.get()).isEqualTo(10);

        stored.put(KEY, "11");
        assertThat(conf.get()).isEqualTo(11);

        stored.remove(KEY);
        assertThat(conf.get()).as("a removed value falls back to the default").isEqualTo(DEFAULT);
    }

    @Test
    void aResolverThatReturnsNullGivesTheDefault() {
        stored.put(KEY, "x");
        AutoReloadConfImpl<Integer> conf = new AutoReloadConfImpl<>(KEY, DEFAULT, factory, s -> null);

        assertThat(conf.get()).isEqualTo(DEFAULT);
        assertThat(conf.get()).isEqualTo(DEFAULT);
    }

    /**
     * DEFECT pinned (plan section 9 row A1, D-6, fix deferred): a value the resolver cannot parse is answered with the
     * default only on the first read. {@code previousStrValue} is stored before the resolver runs, so the second read
     * sees an unchanged string and returns {@code currentValue}, which still holds the value resolved from the
     * previous string (10). Observed sequence 10, 5, 10. The obvious fix is to record {@code previousStrValue} only
     * after a successful resolve (or to reset {@code currentValue} on failure), which makes the sequence 10, 5, 5.
     */
    @Test
    void aValueThatCannotBeResolvedGivesTheDefaultOnlyOnceAndThenTheStaleEarlierValue() {
        AutoReloadConfImpl<Integer> conf = intConf();
        stored.put(KEY, "10");
        int first = conf.get();
        stored.put(KEY, "bad");
        int second = conf.get();
        int third = conf.get();

        System.out.println("[AutoReloadConfImplTest] sequence " + first + ", " + second + ", " + third);
        assertThat(List.of(first, second, third)).containsExactly(10, DEFAULT, 10);
    }

    @Test
    void confInstanceCachesTheConfPerKeyAndDefault() throws ReflectiveOperationException {
        AutoReloadConfigInstanceImpl instance = new AutoReloadConfigInstanceImpl();
        Field field = AutoReloadConfigInstanceImpl.class.getDeclaredField("autoReloadConfigFactory");
        field.setAccessible(true);
        field.set(instance, factory);

        Conf<Integer> first = instance.ofInteger("a", 1);

        assertThat(instance.ofInteger("a", 1)).isSameAs(first);
        assertThat(instance.ofInteger("a", 2)).as("another default is another conf").isNotSameAs(first);
        assertThat(instance.ofInteger("b", 1)).as("another key is another conf").isNotSameAs(first);
    }
}
