package org.lowcoder.api.util;

import org.passay.data.EnglishCharacterData;
import org.passay.generate.PasswordGenerator;
import org.passay.rule.CharacterRule;

public class RandomPasswordGeneratorConfig {

    public static final int PASSWORD_LENGTH = 10;
    public static final int CHARACTERS_PER_CLASS = 3;

    public String generatePassayPassword() {
        PasswordGenerator gen = new PasswordGenerator(
                PASSWORD_LENGTH,
                new CharacterRule(EnglishCharacterData.LowerCase, CHARACTERS_PER_CLASS),
                new CharacterRule(EnglishCharacterData.UpperCase, CHARACTERS_PER_CLASS),
                new CharacterRule(EnglishCharacterData.Digit, CHARACTERS_PER_CLASS));
        return gen.generate().toString();
    }
}
