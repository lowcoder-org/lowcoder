package org.lowcoder.api.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

class RandomPasswordGeneratorConfigTest {

    private static final int SAMPLES = 200;

    private final RandomPasswordGeneratorConfig generator = new RandomPasswordGeneratorConfig();

    private static long count(String password, java.util.function.IntPredicate kind) {
        return password.chars().filter(kind).count();
    }

    @Test
    void everyPasswordHasTheLengthAndEnoughCharactersOfEachClass() {
        for (int i = 0; i < SAMPLES; i++) {
            String password = generator.generatePassayPassword();
            assertEquals(RandomPasswordGeneratorConfig.PASSWORD_LENGTH, password.length(), password);
            long lower = count(password, c -> c >= 'a' && c <= 'z');
            long upper = count(password, c -> c >= 'A' && c <= 'Z');
            long digits = count(password, c -> c >= '0' && c <= '9');
            assertTrue(lower >= RandomPasswordGeneratorConfig.CHARACTERS_PER_CLASS, "lower case in " + password);
            assertTrue(upper >= RandomPasswordGeneratorConfig.CHARACTERS_PER_CLASS, "upper case in " + password);
            assertTrue(digits >= RandomPasswordGeneratorConfig.CHARACTERS_PER_CLASS, "digits in " + password);
            assertEquals(RandomPasswordGeneratorConfig.PASSWORD_LENGTH, lower + upper + digits, "only letters and digits in " + password);
        }
    }

    @Test
    void passwordsDiffer() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < SAMPLES; i++) {
            seen.add(generator.generatePassayPassword());
        }
        assertNotEquals(1, seen.size());
    }
}
