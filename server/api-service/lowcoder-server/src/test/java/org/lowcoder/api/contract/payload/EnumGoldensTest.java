package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Kind;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The enum cases of docs/API_PAYLOAD_TEST_PLAN.md §4.0 for every closure enum, with the production mapper: all
 * constants written as one array, pinned in {@code types/<enum>.S1.json}; each constant read back from what was
 * written; and an unknown constant rejected with {@link InvalidFormatException}. The request enums are also decoded
 * through an endpoint by X3 ({@code ErrorCasesContractTest}). Limits: case variants and numeric indexes are D5's
 * ({@code ScalarCoercionContractTest}), for the enum targets of request properties.
 */
class EnumGoldensTest {

    static final String S1 = "S1";
    static final String UNKNOWN_CONSTANT = "\"ENUM_GOLDENS_UNKNOWN\"";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    static Stream<Class<?>> closureEnums() {
        return PayloadTypeWalker.walkCompiledApi().types().values().stream()
                .filter(type -> type.kind() == Kind.ENUM).map(PayloadTypeWalker.PayloadType::type);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("closureEnums")
    void everyConstantIsWrittenAndReadBack(Class<?> enumType) throws IOException {
        List<?> constants = List.of(enumType.getEnumConstants());
        String written = MAPPER.writeValueAsString(constants);
        System.out.println("[EnumGoldensTest] " + enumType.getName() + " " + constants + " written as " + written);
        GOLDEN.assertJson("types/" + enumType.getName() + "." + S1 + ".json", written);
        for (Object constant : constants) {
            assertThat(MAPPER.readValue(MAPPER.writeValueAsString(constant), enumType)).isSameAs(constant);
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("closureEnums")
    void anUnknownConstantFails(Class<?> enumType) {
        assertThatThrownBy(() -> MAPPER.readValue(UNKNOWN_CONSTANT, enumType))
                .isInstanceOf(InvalidFormatException.class)
                .satisfies(e -> System.out.println("[EnumGoldensTest] " + enumType.getName() + " " + UNKNOWN_CONSTANT + ": "
                        + ((InvalidFormatException) e).getOriginalMessage()));
    }
}
