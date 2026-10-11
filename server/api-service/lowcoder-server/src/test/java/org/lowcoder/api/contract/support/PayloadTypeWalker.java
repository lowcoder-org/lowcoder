package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.AnnotatedClass;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.sdk.contract.JacksonAnnotationGuard;
import org.lowcoder.sdk.util.JsonUtils;
import org.reactivestreams.Publisher;
import org.springframework.core.MethodParameter;
import org.springframework.core.ResolvableType;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.classreading.CachingMetadataReaderFactory;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.SortedMap;
import java.util.SortedSet;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * The transitive closure of the JSON payload types of the {@code lowcoder-server} REST endpoints, as the production
 * mapper ({@code JsonUtils.getObjectMapper()}) sees them (docs/API_PAYLOAD_TEST_PLAN.md §3.2). It is the closure
 * algorithm of {@code docs/tools/PayloadTypeClosure.java}, moved into test sources.
 *
 * <ul>
 *   <li><b>Discovery.</b> Every class file of package {@value #API_PACKAGE} in the main classes directory is read with
 *       Spring's {@link MetadataReader}. A declaration is a type with at least one declared method that carries
 *       {@link RequestMapping} directly or as a meta-annotation ({@code @GetMapping} and the like). Annotations
 *       inherited from an interface do not count, so a controller implementing an annotated {@code *Endpoints}
 *       interface is not a second declaration.</li>
 *   <li><b>Endpoints.</b> For each declaration, its own public methods for which
 *       {@code AnnotatedElementUtils.hasAnnotation(method, RequestMapping.class)} holds. The key is
 *       {@code Declaration#method(ParameterSimpleTypes)}.</li>
 *   <li><b>Roots.</b> The return type, and each {@link RequestBody} or {@link RequestPart} parameter, with
 *       {@link Mono}, {@link Flux}, any {@link Publisher}, {@link Optional} and {@link ResponseEntity} stripped and
 *       the {@link ResponseView} / {@link PageResponseView} envelope recorded and stripped.</li>
 *   <li><b>Walk.</b> Responses follow the properties Jackson can serialize, requests those it can deserialize (through
 *       the {@code @JsonPOJOBuilder} builder when there is one); containers, references, and registered subtypes are
 *       followed. {@code Object}, {@link JsonNode} and JDK interfaces are recorded as untyped payloads.</li>
 *   <li><b>Per type.</b> Kind, directions, the endpoints that reach it, its builder, {@code serializedProperties},
 *       {@code deserializedProperties} (builder-aware; both empty for an enum), enum values, and its Jackson annotations as
 *       {@link JacksonAnnotationGuard} reads them (also those of its builder, which {@link #guardedClasses} lists for
 *       gate rule 6 of §6.1).</li>
 * </ul>
 *
 * <p>Limits: functional routes ({@code RouterFunction} beans) and the JSON written by
 * {@code CustomErrorWebExceptionHandler} are not endpoints here (gate rule 7 covers them). Types reachable only
 * through a custom serializer or deserializer are not followed. The concrete types behind untyped payloads must be
 * resolved from the implementation (gate rule 3). Types of the JDK, Spring and BSON are leaves. Discovery needs the
 * main classes as a directory; it fails if they come from a jar.
 */
public final class PayloadTypeWalker {

    public static final String API_PACKAGE = "org.lowcoder.api";
    private static final String CLASS_FILE_PATTERN = "/**/*.class";
    private static final String KEY_SEPARATOR = "#";
    private static final String ENVELOPE_SUFFIX = "<>";
    private static final String CONTAINER_PATH = "[]";
    private static final String MAP_KEY_PATH = "{key}";
    private static final String PROPERTY_PATH = ".";
    private static final Set<Class<?>> WRAPPERS = Set.of(Mono.class, Flux.class, Optional.class, ResponseEntity.class);
    private static final Set<Class<?>> ENVELOPES = Set.of(ResponseView.class, PageResponseView.class);
    private static final List<String> LEAF_PACKAGE_PREFIXES = List.of("java.", "javax.", "jakarta.", "org.springframework.", "org.bson.");

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();

    public enum Direction { REQUEST, RESPONSE }

    public enum Kind { CLASS, ABSTRACT, INTERFACE, RECORD, ENUM }

    /** One endpoint method and the payload roots of its response and its request body or parts. */
    public record Endpoint(String key, Class<?> declaration, Method method, List<String> jsonViews, String returnType,
            List<String> responseRoots, List<String> requestRoots) {
    }

    /** A place where the walk meets a type it cannot follow statically. */
    public record UntypedPayload(String endpoint, Direction direction, String path, String type) {
    }

    /** A property as Jackson writes ({@code serializedProperties}) or reads ({@code deserializedProperties}) it. */
    public record Property(String name, String type, List<String> views) {
    }

    /** A closure type. */
    public record PayloadType(Class<?> type, Kind kind, Set<Direction> directions, SortedSet<String> usedBy,
            SortedSet<String> jacksonAnnotations, Class<?> builder, List<Property> serializedProperties,
            List<Property> deserializedProperties, List<String> enumValues) {
    }

    /** The walk's result; {@code types} is keyed by class name. */
    public record Closure(List<Class<?>> declarations, List<Endpoint> endpoints, List<UntypedPayload> untypedPayloads,
            SortedMap<String, PayloadType> types) {

        public Optional<Endpoint> endpoint(String key) {
            return endpoints.stream().filter(endpoint -> endpoint.key().equals(key)).findFirst();
        }

        /** Every closure type and builder class, the input of gate rule 6. */
        public List<Class<?>> guardedClasses() {
            List<Class<?>> classes = new ArrayList<>();
            types.values().forEach(type -> {
                classes.add(type.type());
                if (type.builder() != null) {
                    classes.add(type.builder());
                }
            });
            return classes;
        }
    }

    private final Map<String, TypeRecord> types = new TreeMap<>();
    private final List<Endpoint> endpoints = new ArrayList<>();
    private final List<UntypedPayload> untyped = new ArrayList<>();
    private final Set<String> visited = new HashSet<>();

    private PayloadTypeWalker() {
    }

    /** Discovers the declarations in the compiled main classes and walks them. */
    public static Closure walkCompiledApi() {
        return walk(discoverDeclarations(mainClassesDirectory()));
    }

    /** Walks the endpoints of {@code declarations}. */
    public static Closure walk(List<Class<?>> declarations) {
        PayloadTypeWalker walker = new PayloadTypeWalker();
        declarations.forEach(walker::scan);
        SortedMap<String, PayloadType> closureTypes = new TreeMap<>();
        walker.types.forEach((name, type) -> closureTypes.put(name, type.toPayloadType()));
        return new Closure(List.copyOf(declarations), List.copyOf(walker.endpoints), List.copyOf(walker.untyped), closureTypes);
    }

    /**
     * One type described as the walk describes closure types, for types outside the walk (the extra roots of
     * Appendix A); {@code directions} and {@code usedBy} are empty.
     */
    public static PayloadType describe(Class<?> type) {
        return TypeRecord.describe(MAPPER.constructType(type)).toPayloadType();
    }

    /** The directory holding the compiled main classes of {@code lowcoder-server}. */
    public static Path mainClassesDirectory() {
        try {
            Path location = Path.of(ServerApplication.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            if (!Files.isDirectory(location)) {
                throw new IllegalStateException("main classes are not a directory: " + location);
            }
            return location;
        } catch (URISyntaxException e) {
            throw new IllegalStateException("cannot locate the main classes of " + ServerApplication.class, e);
        }
    }

    /** The declaration types under {@code classesDirectory}, sorted by name (see the class comment). */
    public static List<Class<?>> discoverDeclarations(Path classesDirectory) {
        String pattern = classesDirectory.resolve(API_PACKAGE.replace('.', '/')).toUri() + CLASS_FILE_PATTERN;
        CachingMetadataReaderFactory readers = new CachingMetadataReaderFactory();
        List<Class<?>> declarations = new ArrayList<>();
        try {
            for (Resource resource : new PathMatchingResourcePatternResolver().getResources(pattern)) {
                MetadataReader reader = readers.getMetadataReader(resource);
                if (reader.getAnnotationMetadata().hasAnnotatedMethods(RequestMapping.class.getName())) {
                    declarations.add(Class.forName(reader.getClassMetadata().getClassName(), false,
                            PayloadTypeWalker.class.getClassLoader()));
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read class files matching " + pattern, e);
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException("declaration found in " + classesDirectory + " is not loadable", e);
        }
        declarations.sort(Comparator.comparing(Class::getName));
        return declarations;
    }

    private void scan(Class<?> declaration) {
        Arrays.stream(declaration.getMethods())
                .filter(method -> method.getDeclaringClass() == declaration)
                .filter(method -> AnnotatedElementUtils.hasAnnotation(method, RequestMapping.class))
                .sorted(Comparator.comparing(PayloadTypeWalker::signature))
                .forEach(method -> scanEndpoint(declaration, method));
    }

    private void scanEndpoint(Class<?> declaration, Method method) {
        String key = declaration.getSimpleName() + KEY_SEPARATOR + signature(method);
        JsonView view = method.getAnnotation(JsonView.class);
        List<String> views = view == null ? List.of() : Arrays.stream(view.value()).map(Class::getName).toList();
        ResolvableType returnType = ResolvableType.forMethodReturnType(method, declaration);
        List<String> responseRoots = new ArrayList<>();
        payloadRoots(returnType, key, Direction.RESPONSE, responseRoots);
        List<String> requestRoots = new ArrayList<>();
        for (int i = 0; i < method.getParameterCount(); i++) {
            MethodParameter parameter = new MethodParameter(method, i);
            if (parameter.hasParameterAnnotation(RequestBody.class) || parameter.hasParameterAnnotation(RequestPart.class)) {
                payloadRoots(ResolvableType.forMethodParameter(method, i, declaration), key, Direction.REQUEST, requestRoots);
            }
        }
        endpoints.add(new Endpoint(key, declaration, method, views, returnType.toString(), List.copyOf(responseRoots),
                List.copyOf(requestRoots)));
    }

    private static String signature(Method method) {
        return method.getName() + "(" + String.join(", ", Arrays.stream(method.getParameterTypes()).map(Class::getSimpleName).toList()) + ")";
    }

    /** Strips reactive and HTTP wrappers and the response envelope, then walks the payload type. */
    private void payloadRoots(ResolvableType type, String endpointKey, Direction direction, List<String> roots) {
        Class<?> raw = type.resolve(Object.class);
        if (WRAPPERS.contains(raw) || Publisher.class.isAssignableFrom(raw)) {
            payloadRoots(type.getGeneric(0), endpointKey, direction, roots);
            return;
        }
        if (ENVELOPES.contains(raw)) {
            roots.add(raw.getSimpleName() + ENVELOPE_SUFFIX);
            payloadRoots(type.getGeneric(0), endpointKey, direction, roots);
            return;
        }
        JavaType javaType = MAPPER.getTypeFactory().constructType(type.getType());
        roots.add(javaType.toCanonical());
        visit(javaType, endpointKey, direction, endpointKey);
    }

    private void visit(JavaType type, String endpointKey, Direction direction, String path) {
        if (type.isContainerType() || type.isReferenceType()) {
            if (type.isMapLikeType()) {
                visit(type.getKeyType(), endpointKey, direction, path + MAP_KEY_PATH);
            }
            visit(type.getContentType(), endpointKey, direction, path + CONTAINER_PATH);
            return;
        }
        Class<?> raw = type.getRawClass();
        if (raw == Object.class || JsonNode.class.isAssignableFrom(raw) || raw.isInterface() && isLeaf(raw)) {
            untyped.add(new UntypedPayload(endpointKey, direction, path, type.toCanonical()));
            return;
        }
        if (raw.isPrimitive() || isLeaf(raw) || raw.isArray()) {
            return;
        }
        TypeRecord record = types.computeIfAbsent(raw.getName(), name -> TypeRecord.describe(type));
        record.usedBy.add(endpointKey);
        record.directions.add(direction);
        // each type is followed once per endpoint and direction, which also ends cycles
        if (!visited.add(endpointKey + KEY_SEPARATOR + direction + KEY_SEPARATOR + raw.getName()) || raw.isEnum()) {
            return;
        }
        for (BeanPropertyDefinition property : beanDescription(type, direction).findProperties()) {
            // follow only what Jackson writes for responses and reads for requests (e.g. skips WRITE_ONLY passwords)
            boolean used = direction == Direction.RESPONSE ? property.couldSerialize() : property.couldDeserialize();
            if (used) {
                visit(property.getPrimaryType(), endpointKey, direction, path + PROPERTY_PATH + property.getName());
            }
        }
        // subtypes belong to the value type, never to its @JsonPOJOBuilder class
        AnnotatedClass annotatedClass = MAPPER.getSerializationConfig().introspectClassAnnotations(type).getClassInfo();
        Collection<NamedType> subtypes = direction == Direction.RESPONSE
                ? MAPPER.getSubtypeResolver().collectAndResolveSubtypesByClass(MAPPER.getSerializationConfig(), annotatedClass)
                : MAPPER.getSubtypeResolver().collectAndResolveSubtypesByTypeId(MAPPER.getDeserializationConfig(), annotatedClass);
        for (NamedType subtype : subtypes) {
            if (subtype.getType() != raw) {
                visit(MAPPER.getTypeFactory().constructType(subtype.getType()), endpointKey, direction,
                        path + "<" + subtype.getName() + ">");
            }
        }
    }

    /**
     * The production mapper's view of {@code type} in one direction: its serialization description for responses,
     * its deserialization description for requests, through its {@code @JsonPOJOBuilder} builder when it has one.
     */
    public static BeanDescription beanDescription(JavaType type, Direction direction) {
        if (direction == Direction.RESPONSE) {
            return MAPPER.getSerializationConfig().introspect(type);
        }
        BeanDescription description = MAPPER.getDeserializationConfig().introspect(type);
        Class<?> builder = description.findPOJOBuilder();
        if (builder != null) {
            return MAPPER.getDeserializationConfig().introspectForBuilder(MAPPER.getTypeFactory().constructType(builder), description);
        }
        return description;
    }

    private static boolean isLeaf(Class<?> raw) {
        return LEAF_PACKAGE_PREFIXES.stream().anyMatch(raw.getName()::startsWith);
    }

    /** The mutable state of one closure type during the walk. */
    private record TypeRecord(Class<?> type, Kind kind, Set<Direction> directions, SortedSet<String> usedBy,
            SortedSet<String> jacksonAnnotations, Class<?> builder, List<Property> serializedProperties,
            List<Property> deserializedProperties, List<String> enumValues) {

        static TypeRecord describe(JavaType type) {
            Class<?> raw = type.getRawClass();
            BeanDescription deserialization = MAPPER.getDeserializationConfig().introspect(type);
            Class<?> builder = deserialization.findPOJOBuilder();
            SortedSet<String> annotations = new TreeSet<>(JacksonAnnotationGuard.annotationNames(MAPPER, raw));
            if (builder != null) {
                annotations.addAll(JacksonAnnotationGuard.annotationNames(MAPPER, builder));
            }
            List<String> enumValues = raw.isEnum()
                    ? Arrays.stream(raw.getEnumConstants()).map(constant -> MAPPER.convertValue(constant, String.class)).toList()
                    : List.of();
            return new TypeRecord(raw, kind(raw), EnumSet.noneOf(Direction.class), new TreeSet<>(), annotations, builder,
                    raw.isEnum() ? List.of() : properties(MAPPER.getSerializationConfig().introspect(type), true),
                    raw.isEnum() ? List.of() : properties(beanDescription(type, Direction.REQUEST), false), enumValues);
        }

        PayloadType toPayloadType() {
            return new PayloadType(type, kind, Set.copyOf(directions), new TreeSet<>(usedBy), jacksonAnnotations, builder,
                    serializedProperties, deserializedProperties, enumValues);
        }

        private static Kind kind(Class<?> raw) {
            if (raw.isEnum()) {
                return Kind.ENUM;
            }
            if (raw.isRecord()) {
                return Kind.RECORD;
            }
            if (raw.isInterface()) {
                return Kind.INTERFACE;
            }
            return Modifier.isAbstract(raw.getModifiers()) ? Kind.ABSTRACT : Kind.CLASS;
        }

        private static List<Property> properties(BeanDescription description, boolean serialized) {
            Set<Property> properties = new LinkedHashSet<>();
            for (BeanPropertyDefinition property : description.findProperties()) {
                if (serialized ? property.couldSerialize() : property.couldDeserialize()) {
                    Class<?>[] views = property.findViews();
                    properties.add(new Property(property.getName(), property.getPrimaryType().toCanonical(),
                            views == null ? List.of() : Arrays.stream(views).map(Class::getSimpleName).toList()));
                }
            }
            return List.copyOf(properties);
        }
    }
}
