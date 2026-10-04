package org.lowcoder.sdk.contract;

import org.junit.Test;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Self-test of {@link FieldTree}: it reads fields, not getters, records every class by pointer, sorts sets, and stops
 * at cycles and at classes outside {@link FieldTree#DESCENDED_PACKAGE}.
 */
public class FieldTreeTest {

    static final long DEFAULT_PORT = 3306L;

    enum Mode { GUI }

    record Pair(String left, Object right) {
    }

    static class Base {
        private final String hidden = "base";
        private final Long port;

        Base(Long port) {
            this.port = port;
        }

        /** A getter default that a getter-based dump would show instead of the bound {@code null}. */
        public long getPort() {
            return port == null ? DEFAULT_PORT : port;
        }
    }

    static class Config extends Base {
        private static final String CONSTANT = "not dumped";
        private final String hidden = "subclass";
        private final Mode mode = Mode.GUI;
        private final Set<String> cookies = new LinkedHashSet<>(List.of("b", "a"));
        private final Map<String, Object> extra = new LinkedHashMap<>(Map.of("big", BigInteger.TWO.pow(64)));
        private final StringBuilder notDescended = new StringBuilder("text");
        private final Pair pair = new Pair("l", 1.5);
        private Object self;

        Config() {
            super(null);
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    public void dumpsFieldsWithClassesAndOrder() {
        Config config = new Config();
        config.self = config;
        Map<String, Object> tree = FieldTree.of(config);
        System.out.println("[FieldTreeTest] " + ConfigBinding.write(tree));
        Map<String, Object> values = (Map<String, Object>) tree.get(FieldTree.VALUES_KEY);
        Map<String, String> classes = (Map<String, String>) tree.get(FieldTree.CLASSES_KEY);

        assertThat(new ArrayList<>(values.keySet())).containsExactly(FieldTree.CLASS_KEY, "hidden", "mode", "cookies", "extra",
                "notDescended", "pair", "self", "port");
        assertThat(values.get("port")).as("the field, not getPort()'s default").isNull();
        assertThat(values.get("hidden")).as("the subclass field hides the superclass one").isEqualTo("subclass");
        assertThat(values.get("mode")).isEqualTo("GUI");
        assertThat(values.get("cookies")).isEqualTo(List.of("a", "b"));
        assertThat(values.get("notDescended")).isEqualTo("text");
        assertThat(values.get("self")).isEqualTo(FieldTree.CYCLE);
        assertThat((Map<String, Object>) values.get("pair")).containsEntry(FieldTree.CLASS_KEY, Pair.class.getName())
                .containsEntry("right", 1.5);

        assertThat(classes).containsEntry("", Config.class.getName())
                .containsEntry("/port", JavaValueWalker.NULL)
                .containsEntry("/cookies", LinkedHashSet.class.getName())
                .containsEntry("/extra/big", BigInteger.class.getName())
                .containsEntry("/pair/right", Double.class.getName())
                .containsEntry("/self", Config.class.getName())
                .doesNotContainKey("/CONSTANT");
    }

    @Test
    public void leavesStayAsTheyAre() {
        assertThat(FieldTree.of(null).get(FieldTree.VALUES_KEY)).isNull();
        assertThat(FieldTree.of(7L).get(FieldTree.VALUES_KEY)).isEqualTo(7L);
        assertThat(FieldTree.of(new int[] {1, 2}).get(FieldTree.VALUES_KEY)).isEqualTo(List.of(1, 2));
    }
}
