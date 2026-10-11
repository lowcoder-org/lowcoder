package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Closure;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Endpoint;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Kind;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Property;
import org.lowcoder.api.contract.support.PayloadTypeWalker.UntypedPayload;
import org.lowcoder.api.framework.StateEndpoints;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.misc.JsLibraryController;
import org.lowcoder.api.misc.JsLibraryEndpoints;
import org.lowcoder.api.npm.PrivateNpmRegistryController;
import org.lowcoder.api.npm.PrivateNpmRegistryEndpoint;
import org.lowcoder.sdk.contract.JacksonAnnotationGuard;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Self-test of {@link PayloadTypeWalker} (docs/API_PAYLOAD_TEST_PLAN.md §3.2, §8.1): today's compiled API gives 24
 * declaration types, 175 endpoints and 123 closure types, and a test-only API ({@link SampleApi}) shows each rule of
 * the walk.
 */
class PayloadTypeWalkerTest {

    /** §1.3 and §3.2: today's declaration, endpoint and closure-type counts. */
    private static final int DECLARATION_TYPES = 24;
    private static final int ENDPOINTS = 175;
    private static final int CLOSURE_TYPES = 123;
    private static final String HEALTH_CHECK = "StateEndpoints#healthCheck()";
    private static final String SAMPLE_UPDATE = "SampleApi#update(SampleRequest)";
    private static final String SAMPLE_LIST = "SampleApi#list()";

    private static Closure production;
    private static Closure sample;

    // ---- test-only API: one declaration that is not named *Endpoints, with every rule of the walk ----

    static class SampleViews {
        static class Public {
        }
    }

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
    @JsonSubTypes({@JsonSubTypes.Type(value = SampleCircle.class, name = "circle")})
    abstract static class SampleShape {
        public String label;
    }

    static class SampleCircle extends SampleShape {
        public int radius;
    }

    enum SampleStatus { ACTIVE, ARCHIVED }

    static class SampleResponse {
        @JsonView(SampleViews.Public.class)
        public String name;
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        public String password;
        public SampleStatus status;
        public List<SampleShape> shapes;
        public Map<String, Object> extra;
        public SampleResponse self;
    }

    @JsonDeserialize(builder = SampleRequest.Builder.class)
    static class SampleRequest {
        private final String title;

        SampleRequest(String title) {
            this.title = title;
        }

        public String getTitle() {
            return title;
        }

        @JsonPOJOBuilder(withPrefix = "")
        static class Builder {
            private String title;

            public Builder title(String title) {
                this.title = title;
                return this;
            }

            public SampleRequest build() {
                return new SampleRequest(title);
            }
        }
    }

    @RequestMapping("/sample")
    interface SampleApi {
        @JsonView(SampleViews.Public.class)
        @GetMapping
        Mono<ResponseView<List<SampleResponse>>> list();

        @PostMapping
        Mono<ResponseView<Boolean>> update(@RequestBody SampleRequest request);

        String notAnEndpoint();
    }

    @BeforeAll
    static void walk() {
        production = PayloadTypeWalker.walkCompiledApi();
        sample = PayloadTypeWalker.walk(List.of(SampleApi.class));
        System.out.println("[PayloadTypeWalkerTest] production: " + production.declarations().size() + " declarations, "
                + production.endpoints().size() + " endpoints, " + production.types().size() + " closure types, "
                + production.untypedPayloads().size() + " untyped payload places");
        production.declarations().forEach(declaration -> System.out.println("[PayloadTypeWalkerTest] declaration " + declaration.getName()));
        sample.types().values().forEach(type -> System.out.println("[PayloadTypeWalkerTest] sample type " + type));
        sample.untypedPayloads().forEach(untyped -> System.out.println("[PayloadTypeWalkerTest] sample untyped " + untyped));
    }

    @Test
    void productionApiHasTodaysDeclarationsEndpointsAndClosure() {
        assertThat(production.declarations()).hasSize(DECLARATION_TYPES);
        assertThat(production.endpoints()).hasSize(ENDPOINTS);
        assertThat(production.endpoints()).extracting(Endpoint::key).doesNotHaveDuplicates();
        assertThat(production.types()).hasSize(CLOSURE_TYPES);
        assertThat(production.endpoint(HEALTH_CHECK)).as("direct @RequestMapping at StateEndpoints.java:25-26").isPresent();
        assertThat(production.declarations()).contains(StateEndpoints.class, JsLibraryEndpoints.class, PrivateNpmRegistryEndpoint.class);
    }

    @Test
    void controllersImplementingAnnotatedInterfacesAreNotDeclarations() throws NoSuchMethodException {
        assertThat(production.declarations()).doesNotContain(JsLibraryController.class, PrivateNpmRegistryController.class);
        // a hierarchy search would count the controller as a second declaration of the same endpoints
        Method controllerMethod = JsLibraryController.class.getMethod("getRecommendationMetas");
        System.out.println("[PayloadTypeWalkerTest] hierarchy search on " + controllerMethod + ": "
                + AnnotatedElementUtils.hasAnnotation(controllerMethod, RequestMapping.class));
        assertThat(AnnotatedElementUtils.hasAnnotation(controllerMethod, RequestMapping.class)).isTrue();
        assertThat(controllerMethod.getDeclaredAnnotations()).isEmpty();
    }

    @Test
    void discoveryIsByAnnotationNotByName() throws URISyntaxException {
        Path testClasses = Path.of(PayloadTypeWalkerTest.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        assertThat(PayloadTypeWalker.discoverDeclarations(testClasses)).contains(SampleApi.class)
                .doesNotContain(SampleResponse.class, PayloadTypeWalkerTest.class);
    }

    @Test
    void endpointsAreAnnotatedMethodsWithStrippedRoots() {
        assertThat(sample.endpoints()).extracting(Endpoint::key).containsExactly(SAMPLE_LIST, SAMPLE_UPDATE);
        Endpoint list = sample.endpoint(SAMPLE_LIST).orElseThrow();
        assertThat(list.responseRoots()).containsExactly("ResponseView<>",
                "java.util.List<" + SampleResponse.class.getName() + ">");
        assertThat(list.requestRoots()).isEmpty();
        assertThat(list.jsonViews()).containsExactly(SampleViews.Public.class.getName());
        Endpoint update = sample.endpoint(SAMPLE_UPDATE).orElseThrow();
        assertThat(update.responseRoots()).containsExactly("ResponseView<>", "java.lang.Boolean");
        assertThat(update.requestRoots()).containsExactly(SampleRequest.class.getName());
        assertThat(update.jsonViews()).isEmpty();
    }

    @Test
    void responsePropertiesAreWhatJacksonWrites() {
        PayloadType response = type(SampleResponse.class);
        assertThat(response.kind()).isEqualTo(Kind.CLASS);
        assertThat(response.directions()).containsExactly(Direction.RESPONSE);
        assertThat(response.usedBy()).containsExactly(SAMPLE_LIST);
        assertThat(response.serializedProperties()).extracting(Property::name)
                .containsExactly("name", "status", "shapes", "extra", "self");
        assertThat(response.serializedProperties()).filteredOn(property -> property.name().equals("name"))
                .extracting(Property::views).containsExactly(List.of("Public"));
        assertThat(response.deserializedProperties()).extracting(Property::name).contains("password");
        assertThat(response.jacksonAnnotations()).containsExactly("@JsonProperty", "@JsonView");
    }

    @Test
    void requestPropertiesAreReadThroughTheBuilder() {
        PayloadType request = type(SampleRequest.class);
        assertThat(request.directions()).containsExactly(Direction.REQUEST);
        assertThat(request.builder()).isEqualTo(SampleRequest.Builder.class);
        assertThat(request.deserializedProperties()).containsExactly(new Property("title", "java.lang.String", List.of()));
        assertThat(request.serializedProperties()).extracting(Property::name).containsExactly("title");
        assertThat(request.jacksonAnnotations()).as("value type and builder").containsExactly("@JsonDeserialize", "@JsonPOJOBuilder");
        assertThat(sample.guardedClasses()).contains(SampleRequest.class, SampleRequest.Builder.class);
    }

    @Test
    void subtypesEnumsAndCyclesAreFollowed() {
        assertThat(type(SampleShape.class).kind()).isEqualTo(Kind.ABSTRACT);
        assertThat(type(SampleCircle.class).serializedProperties()).extracting(Property::name).contains("radius", "label");
        PayloadType status = type(SampleStatus.class);
        assertThat(status.kind()).isEqualTo(Kind.ENUM);
        assertThat(status.enumValues()).containsExactly("ACTIVE", "ARCHIVED");
        assertThat(status.serializedProperties()).isEmpty();
        assertThat(sample.types().keySet()).containsExactlyInAnyOrder(SampleResponse.class.getName(), SampleRequest.class.getName(),
                SampleShape.class.getName(), SampleCircle.class.getName(), SampleStatus.class.getName());
    }

    @Test
    void untypedPayloadsAreRecordedWithTheirPath() {
        assertThat(sample.untypedPayloads()).containsExactly(new UntypedPayload(SAMPLE_LIST, Direction.RESPONSE,
                SAMPLE_LIST + "[].extra[]", "java.lang.Object"));
    }

    @Test
    void annotationsAreThoseTheGuardReads() {
        production.types().values().forEach(type -> {
            Set<String> expected = new TreeSet<>(JacksonAnnotationGuard.annotationNames(JsonUtils.getObjectMapper(), type.type()));
            if (type.builder() != null) {
                expected.addAll(JacksonAnnotationGuard.annotationNames(JsonUtils.getObjectMapper(), type.builder()));
            }
            assertThat(type.jacksonAnnotations()).as(type.type().getName()).isEqualTo(expected);
        });
        assertThat(production.types().values()).as("some closure type carries @JsonProperty")
                .anySatisfy(type -> assertThat(type.jacksonAnnotations()).contains("@JsonProperty"));
    }

    private static PayloadType type(Class<?> type) {
        PayloadType payloadType = sample.types().get(type.getName());
        assertThat(payloadType).as(type.getName()).isNotNull();
        return payloadType;
    }
}
