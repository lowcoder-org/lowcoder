package org.lowcoder.infra.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.dynamic.Conf;

/** {@link AutoReloadConfImpl} resolution rules and the {@code ConfKey} caching of {@link AutoReloadConfigInstanceImpl}. */
class AutoReloadConfImplTest {

    private static final String KEY = "k";
    private static final int DEFAULT = 5;
    private static final String GOOD = "10";
    private static final int GOOD_VALUE = 10;
    private static final String UNPARSABLE = "bad";
    private static final String NEXT_GOOD = "12";
    private static final int NEXT_GOOD_VALUE = 12;

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
     * BF-082 (fixed; was pinned as plan section 9 row A1, D-6: the sequence was 10, 5, 10, because the string was
     * recorded before the resolver ran and the value of the string before it was kept). A value the resolver cannot
     * resolve gives the default on every read, the resolver runs once for it, and the next good string is resolved.
     */
    @Test
    void aValueThatCannotBeResolvedGivesTheDefaultOnEveryReadBF082() {
        AtomicInteger resolutions = new AtomicInteger();
        AutoReloadConfImpl<Integer> conf = new AutoReloadConfImpl<>(KEY, DEFAULT, factory, s -> {
            resolutions.incrementAndGet();
            return Integer.valueOf(s);
        });
        stored.put(KEY, GOOD);
        int first = conf.get();
        stored.put(KEY, UNPARSABLE);
        int second = conf.get();
        int third = conf.get();
        int resolutionsOfTheBadValue = resolutions.get() - 1;
        stored.put(KEY, NEXT_GOOD);
        int recovered = conf.get();

        System.out.println("[AutoReloadConfImplTest] sequence " + first + ", " + second + ", " + third + ", then " + NEXT_GOOD
                + " -> " + recovered + "; resolutions of '" + UNPARSABLE + "': " + resolutionsOfTheBadValue);
        assertThat(List.of(first, second, third)).containsExactly(GOOD_VALUE, DEFAULT, DEFAULT);
        assertThat(resolutionsOfTheBadValue).as("an unchanged unresolvable string is not resolved again").isEqualTo(1);
        assertThat(recovered).isEqualTo(NEXT_GOOD_VALUE);
        assertThat(resolutions.get()).as("the good, the bad and the next good string, each resolved once").isEqualTo(3);
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
