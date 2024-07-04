package org.lowcoder.api.authentication;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.util.AdvancedMapUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class AdvancedMapUtilsTest {
    @Test
    public void testGetStringFromMap() throws Exception {
        Map<String, Object> nestedMap = new HashMap<>();
        nestedMap.put("abc", Arrays.asList(
                Collections.singletonMap("def", Collections.singletonMap("hi", "hello world")),
                Collections.singletonMap("def", Collections.singletonMap("hi", "another value"))
        ));
        nestedMap.put("false", "123");

        String value0 = AdvancedMapUtils.getString(nestedMap, "abc[0].def.hi");
        String value1 = AdvancedMapUtils.getString(nestedMap, "abc[1].def.hi");
        String value2 = AdvancedMapUtils.getString(nestedMap, "false");
        Assertions.assertSame("hello world", value0);
        Assertions.assertSame("another value", value1);
        Assertions.assertSame(null, value2);
    }
}
