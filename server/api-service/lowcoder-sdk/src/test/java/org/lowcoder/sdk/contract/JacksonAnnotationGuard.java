package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.cfg.MapperConfig;
import com.fasterxml.jackson.databind.introspect.AnnotatedClass;
import com.fasterxml.jackson.databind.introspect.AnnotatedMember;
import com.fasterxml.jackson.databind.introspect.AnnotatedWithParams;
import com.fasterxml.jackson.databind.introspect.AnnotationMap;
import com.fasterxml.jackson.databind.util.ClassUtil;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * Fails on per-property Jackson configuration that the contract tests are not organized for
 * (docs/API_PAYLOAD_TEST_PLAN.md §2, gate rule 6 of §6.1).
 *
 * <p>It reads the annotations of a type as Jackson's own introspection sees them, through the {@link AnnotatedClass}
 * of the given mapper's serialization and deserialization configurations (so mix-ins and annotations inherited from
 * supertypes are included, and spelling, imports and fully qualified names do not matter): the class annotations,
 * {@link AnnotatedMember#getAllAnnotations()} of every field, member method, static method, constructor and factory,
 * and the annotations of their parameters. Enum constants are read by reflection, because Jackson's
 * {@link AnnotatedClass} does not list static fields.
 *
 * <p>Every annotation of the packages {@link #JACKSON_ANNOTATION_PACKAGES} must be in {@link #ALLOWED};
 * {@link JsonDeserialize} is allowed only with {@value #BUILDER_ATTRIBUTE} set and no other attribute set.
 *
 * <p>Limits: it inspects only the types it is given; following properties to further types is the caller's job (the
 * payload walker in {@code lowcoder-server}). A {@code @JsonPOJOBuilder} class must be passed on its own. Jackson
 * configuration that is not an annotation (modules, custom serializers registered in code, mapper features) is not
 * seen; the codec guards of §5.4 pin that. Member methods with more than two parameters are not collected by
 * Jackson, so their annotations are not seen either.
 */
public final class JacksonAnnotationGuard {

    public static final Set<String> JACKSON_ANNOTATION_PACKAGES = Set.of(
            "com.fasterxml.jackson.annotation", "com.fasterxml.jackson.databind.annotation");
    public static final Set<Class<? extends Annotation>> ALLOWED = Set.of(
            JsonProperty.class, JsonAlias.class, JsonIgnore.class, JsonView.class, JsonInclude.class,
            JsonCreator.class, JsonTypeInfo.class, JsonSubTypes.class, JsonTypeName.class,
            JsonIgnoreProperties.class, JsonPOJOBuilder.class, JsonDeserialize.class);
    public static final String BUILDER_ATTRIBUTE = "builder";
    private static final String CLASS_MEMBER = "<class>";
    private static final String ANNOTATION_PREFIX = "@";

    private JacksonAnnotationGuard() {
    }

    /** One Jackson annotation found on {@code member} of {@code type}; {@code allowed} says whether §2 permits it. */
    public record Occurrence(String type, String member, Annotation annotation, boolean allowed) {

        public String annotationName() {
            return ANNOTATION_PREFIX + annotation.annotationType().getSimpleName();
        }

        @Override
        public String toString() {
            return type + " " + member + " " + annotation;
        }
    }

    /** Every Jackson annotation of {@code type}, allowed or not, ordered by member and annotation. */
    public static List<Occurrence> occurrences(ObjectMapper mapper, Class<?> type) {
        SortedSet<String> seen = new TreeSet<>();
        List<Occurrence> result = new ArrayList<>();
        for (MapperConfig<?> config : List.of(mapper.getSerializationConfig(), mapper.getDeserializationConfig())) {
            AnnotatedClass annotatedClass = config.introspectClassAnnotations(config.constructType(type)).getClassInfo();
            add(type, CLASS_MEMBER, classAnnotations(config, annotatedClass), seen, result);
            annotatedClass.fields().forEach(field -> add(type, field.getFullName(), annotations(field.getAllAnnotations()), seen, result));
            annotatedClass.memberMethods().forEach(method -> addWithParameters(type, method, seen, result));
            annotatedClass.getStaticMethods().forEach(method -> addWithParameters(type, method, seen, result));
            annotatedClass.getFactoryMethods().forEach(method -> addWithParameters(type, method, seen, result));
            annotatedClass.getConstructors().forEach(constructor -> addWithParameters(type, constructor, seen, result));
            if (annotatedClass.getDefaultConstructor() != null) {
                addWithParameters(type, annotatedClass.getDefaultConstructor(), seen, result);
            }
        }
        if (type.isEnum()) {
            for (Field field : type.getDeclaredFields()) {
                if (field.isEnumConstant()) {
                    add(type, type.getName() + "#" + field.getName(), List.of(field.getAnnotations()), seen, result);
                }
            }
        }
        result.sort((a, b) -> (a.member() + a.annotationName()).compareTo(b.member() + b.annotationName()));
        return result;
    }

    /** The simple names ({@code @JsonProperty}) of every Jackson annotation of {@code type}. */
    public static SortedSet<String> annotationNames(ObjectMapper mapper, Class<?> type) {
        return occurrences(mapper, type).stream().map(Occurrence::annotationName).collect(Collectors.toCollection(TreeSet::new));
    }

    /** The Jackson annotations of {@code types} that §2 does not allow. */
    public static List<Occurrence> violations(ObjectMapper mapper, Collection<Class<?>> types) {
        return types.stream().flatMap(type -> occurrences(mapper, type).stream()).filter(o -> !o.allowed()).toList();
    }

    /** Fails with every violation of {@code types}, one per line. */
    public static void assertAllowed(ObjectMapper mapper, Collection<Class<?>> types) {
        List<Occurrence> violations = violations(mapper, types);
        System.out.println("[jackson-annotation-guard] " + types.size() + " type(s) inspected, " + violations.size() + " violation(s)");
        if (!violations.isEmpty()) {
            throw new AssertionError("Jackson annotations outside the allow-list of docs/API_PAYLOAD_TEST_PLAN.md §2:\n"
                    + violations.stream().map(Occurrence::toString).collect(Collectors.joining("\n")));
        }
    }

    /** Whether §2 allows {@code annotation}; annotations outside {@link #JACKSON_ANNOTATION_PACKAGES} are not judged. */
    public static boolean isAllowed(Annotation annotation) {
        Class<? extends Annotation> annotationType = annotation.annotationType();
        if (!ALLOWED.contains(annotationType)) {
            return false;
        }
        return annotationType != JsonDeserialize.class || onlyBuilderSet(annotation);
    }

    private static boolean isJackson(Annotation annotation) {
        return JACKSON_ANNOTATION_PACKAGES.contains(annotation.annotationType().getPackageName());
    }

    /** Whether {@code annotation} sets {@value #BUILDER_ATTRIBUTE} and leaves every other attribute at its default. */
    private static boolean onlyBuilderSet(Annotation annotation) {
        for (Method attribute : annotation.annotationType().getDeclaredMethods()) {
            boolean isDefault = isDefault(annotation, attribute);
            if (attribute.getName().equals(BUILDER_ATTRIBUTE) == isDefault) {
                return false;
            }
        }
        return true;
    }

    private static boolean isDefault(Annotation annotation, Method attribute) {
        try {
            return Objects.deepEquals(attribute.getDefaultValue(), attribute.invoke(annotation));
        } catch (IllegalAccessException | InvocationTargetException e) {
            throw new IllegalStateException("cannot read " + attribute + " of " + annotation, e);
        }
    }

    private static void addWithParameters(Class<?> type, AnnotatedWithParams member, SortedSet<String> seen, List<Occurrence> result) {
        String name = member.getFullName() + "(" + member.getParameterCount() + " parameter(s))";
        add(type, name, annotations(member.getAllAnnotations()), seen, result);
        for (int i = 0; i < member.getParameterCount(); i++) {
            add(type, name + " parameter " + i, annotations(member.getParameterAnnotations(i)), seen, result);
        }
    }

    /**
     * The class annotations Jackson resolved for {@code annotatedClass}. Jackson keeps one or two of them in holders
     * that cannot be iterated, so the candidate types are read by reflection from where Jackson takes class
     * annotations (the class, its superclasses and interfaces, their mix-ins, and the contents of
     * {@link JacksonAnnotationsInside} bundles), and each is then looked up in Jackson's resolved annotations.
     */
    private static Iterable<Annotation> classAnnotations(MapperConfig<?> config, AnnotatedClass annotatedClass) {
        Set<Class<? extends Annotation>> candidates = new LinkedHashSet<>();
        List<Class<?>> sources = new ArrayList<>();
        sources.add(annotatedClass.getRawType());
        sources.addAll(ClassUtil.findSuperTypes(annotatedClass.getRawType(), null));
        for (Class<?> source : sources) {
            addCandidates(source.getAnnotations(), candidates);
            Class<?> mixIn = config.findMixInClassFor(source);
            if (mixIn != null) {
                addCandidates(mixIn.getAnnotations(), candidates);
                ClassUtil.findSuperTypes(mixIn, null).forEach(mixInSuper -> addCandidates(mixInSuper.getAnnotations(), candidates));
            }
        }
        List<Annotation> resolved = new ArrayList<>();
        for (Class<? extends Annotation> candidate : candidates) {
            Annotation annotation = annotatedClass.getAnnotation(candidate);
            if (annotation != null) {
                resolved.add(annotation);
            }
        }
        return resolved;
    }

    private static void addCandidates(Annotation[] annotations, Set<Class<? extends Annotation>> candidates) {
        for (Annotation annotation : annotations) {
            if (candidates.add(annotation.annotationType()) && annotation.annotationType().isAnnotationPresent(JacksonAnnotationsInside.class)) {
                addCandidates(annotation.annotationType().getAnnotations(), candidates);
            }
        }
    }

    /** Jackson leaves the map {@code null} for a member or parameter without annotations. */
    private static Iterable<Annotation> annotations(AnnotationMap map) {
        return map == null ? List.of() : map.annotations();
    }

    private static void add(Class<?> type, String member, Iterable<Annotation> annotations, SortedSet<String> seen, List<Occurrence> result) {
        for (Annotation annotation : annotations) {
            if (isJackson(annotation) && seen.add(member + " " + annotation)) {
                result.add(new Occurrence(type.getName(), member, annotation, isAllowed(annotation)));
            }
        }
    }
}
