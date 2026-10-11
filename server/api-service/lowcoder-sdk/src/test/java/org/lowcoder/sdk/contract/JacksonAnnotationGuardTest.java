package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonEnumDefaultValue;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.deser.std.StringDeserializer;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.JsonUtils;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Self-test of {@link JacksonAnnotationGuard} (docs/API_PAYLOAD_TEST_PLAN.md §2, §8.1): it must fail on a
 * {@code @JsonFormat} type, wherever Jackson's introspection finds the annotation, and pass the allow-list.
 */
public class JacksonAnnotationGuardTest {

    private static final ObjectMapper PRODUCTION = JsonUtils.getObjectMapper();
    private static final String JSON_FORMAT = "@JsonFormat";

    static class FormattedDate {
        @JsonFormat(shape = JsonFormat.Shape.STRING)
        public Instant at;
    }

    static class View {
    }

    static class AllowedType {
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        public String password;
        @JsonIgnore
        public String internal;
        @JsonView(View.class)
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public String name;

        @JsonCreator
        AllowedType(@JsonProperty("name") String name) {
            this.name = name;
        }
    }

    @JsonDeserialize(builder = BuiltType.Builder.class)
    static class BuiltType {
        public String value;

        @JsonPOJOBuilder(withPrefix = "")
        static class Builder {
            private String value;

            public Builder value(String value) {
                this.value = value;
                return this;
            }

            public BuiltType build() {
                BuiltType built = new BuiltType();
                built.value = value;
                return built;
            }
        }
    }

    static class CustomDeserializer {
        @JsonDeserialize(using = StringDeserializer.class)
        public String value;
    }

    static class BareDeserialize {
        @JsonDeserialize
        public String value;
    }

    static class SerializedBySuperclass {
        @JsonSerialize(using = ToStringSerializer.class)
        public Object getValue() {
            return 1;
        }
    }

    static class InheritsSerializer extends SerializedBySuperclass {
        @Override
        public Object getValue() {
            return 2;
        }
    }

    static class FormattedCreatorParameter {
        public final Instant at;

        @JsonCreator
        FormattedCreatorParameter(@JsonProperty("at") @JsonFormat(shape = JsonFormat.Shape.STRING) Instant at) {
            this.at = at;
        }
    }

    enum WithDefault {
        KNOWN,
        @JsonEnumDefaultValue
        UNKNOWN
    }

    @Retention(RetentionPolicy.RUNTIME)
    @JacksonAnnotationsInside
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @interface Bundled {
    }

    static class BundledFormat {
        @Bundled
        public Instant at;
    }

    @JsonFormat(shape = JsonFormat.Shape.OBJECT)
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ClassFormatted {
        public String value;
    }

    static class InheritsClassFormat extends ClassFormatted {
    }

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    interface Formatted {
    }

    static class ImplementsFormatted implements Formatted {
        public String someValue;
    }

    @JsonPropertyOrder({"at"})
    abstract static class ClassFormatMixIn {
    }

    static class Plain {
        public Instant at;
    }

    abstract static class FormatMixIn {
        @JsonFormat(shape = JsonFormat.Shape.STRING)
        public Instant at;
    }

    private static List<JacksonAnnotationGuard.Occurrence> violationsOf(ObjectMapper mapper, Class<?> type) {
        List<JacksonAnnotationGuard.Occurrence> violations = JacksonAnnotationGuard.violations(mapper, List.of(type));
        System.out.println("[JacksonAnnotationGuardTest] " + type.getSimpleName() + ": occurrences="
                + JacksonAnnotationGuard.occurrences(mapper, type) + " violations=" + violations);
        return violations;
    }

    private static void assertViolation(ObjectMapper mapper, Class<?> type, String annotationName) {
        assertThat(violationsOf(mapper, type)).as(type.getSimpleName())
                .anySatisfy(violation -> assertThat(violation.annotationName()).isEqualTo(annotationName));
    }

    @Test
    public void jsonFormatTypeFails() {
        assertThatThrownBy(() -> JacksonAnnotationGuard.assertAllowed(PRODUCTION, List.of(FormattedDate.class)))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("§2")
                .hasMessageContaining(FormattedDate.class.getName())
                .hasMessageContaining("JsonFormat");
    }

    @Test
    public void allowListPasses() {
        JacksonAnnotationGuard.assertAllowed(PRODUCTION, List.of(AllowedType.class, BuiltType.class, BuiltType.Builder.class));
        assertThat(JacksonAnnotationGuard.annotationNames(PRODUCTION, AllowedType.class))
                .containsExactly("@JsonCreator", "@JsonIgnore", "@JsonInclude", "@JsonProperty", "@JsonView");
        assertThat(JacksonAnnotationGuard.annotationNames(PRODUCTION, BuiltType.class)).containsExactly("@JsonDeserialize");
        assertThat(JacksonAnnotationGuard.annotationNames(PRODUCTION, BuiltType.Builder.class)).containsExactly("@JsonPOJOBuilder");
    }

    @Test
    public void jsonDeserializeIsAllowedOnlyWithBuilder() {
        assertViolation(PRODUCTION, CustomDeserializer.class, "@JsonDeserialize");
        assertViolation(PRODUCTION, BareDeserialize.class, "@JsonDeserialize");
    }

    @Test
    public void annotationInheritedFromSuperclassIsFound() {
        assertViolation(PRODUCTION, InheritsSerializer.class, "@JsonSerialize");
    }

    @Test
    public void creatorParameterAnnotationIsFound() {
        assertViolation(PRODUCTION, FormattedCreatorParameter.class, JSON_FORMAT);
    }

    @Test
    public void enumConstantAnnotationIsFound() {
        assertViolation(PRODUCTION, WithDefault.class, "@JsonEnumDefaultValue");
    }

    @Test
    public void annotationBundleIsExpanded() {
        assertViolation(PRODUCTION, BundledFormat.class, JSON_FORMAT);
    }

    @Test
    public void classAnnotationsAreFoundOnTypeSupertypeAndMixIn() {
        assertViolation(PRODUCTION, ClassFormatted.class, JSON_FORMAT);
        assertViolation(PRODUCTION, InheritsClassFormat.class, JSON_FORMAT);
        assertViolation(PRODUCTION, ImplementsFormatted.class, "@JsonNaming");
        ObjectMapper withMixIn = new ObjectMapper().addMixIn(Plain.class, ClassFormatMixIn.class);
        assertViolation(withMixIn, Plain.class, "@JsonPropertyOrder");
    }

    @Test
    public void bundleMarkerIsItselfOutsideTheAllowList() {
        assertViolation(PRODUCTION, BundledFormat.class, "@JacksonAnnotationsInside");
    }

    @Test
    public void mixInOfTheGivenMapperIsSeen() {
        ObjectMapper withMixIn = new ObjectMapper().addMixIn(Plain.class, FormatMixIn.class);
        assertThat(violationsOf(PRODUCTION, Plain.class)).isEmpty();
        assertViolation(withMixIn, Plain.class, JSON_FORMAT);
    }
}
