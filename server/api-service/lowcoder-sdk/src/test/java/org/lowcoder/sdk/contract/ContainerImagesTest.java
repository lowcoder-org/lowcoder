package org.lowcoder.sdk.contract;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Self-test of {@link ContainerImages}: every image a test can start is pinned by digest. Catches a constant added or
 * edited as a bare tag ({@code mysql:8.0}), which Docker would resolve to whatever build the tag points at that day.
 */
public class ContainerImagesTest {

    /** {@code <name>:<tag>@sha256:<64 hex digits>}; the name may carry a registry host and path. */
    static final Pattern PINNED = Pattern.compile("[a-z0-9.\\-/]+:[A-Za-z0-9._\\-]+@sha256:[0-9a-f]{64}");

    static List<String> constants() throws IllegalAccessException {
        List<String> values = new ArrayList<>();
        for (Field field : ContainerImages.class.getDeclaredFields()) {
            int modifiers = field.getModifiers();
            if (Modifier.isPublic(modifiers) && Modifier.isStatic(modifiers) && field.getType() == String.class) {
                values.add(field.getName() + "=" + field.get(null));
            }
        }
        return values;
    }

    @Test
    void everyImageIsTagAndDigest() throws IllegalAccessException {
        List<String> constants = constants();
        System.out.println("[ContainerImagesTest] " + constants.size() + " images: " + constants);
        assertThat(constants).isNotEmpty();
        for (String constant : constants) {
            String image = constant.substring(constant.indexOf('=') + 1);
            assertThat(PINNED.matcher(image).matches()).as("pinned by tag and digest: %s", constant).isTrue();
        }
    }

    @Test
    void patternRejectsATagWithoutDigest() {
        System.out.println("[ContainerImagesTest] mysql:8.0 and mysql@sha256:<digest> must both be rejected");
        assertThat(PINNED.matcher("mysql:8.0").matches()).isFalse();
        assertThat(PINNED.matcher("mysql@sha256:" + "a".repeat(64)).matches()).isFalse();
        assertThat(PINNED.matcher("mysql:8.0@sha256:" + "a".repeat(64)).matches()).isTrue();
    }
}
