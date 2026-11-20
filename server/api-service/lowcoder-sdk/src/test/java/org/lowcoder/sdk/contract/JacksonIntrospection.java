package org.lowcoder.sdk.contract;

import tools.jackson.databind.BeanDescription;
import tools.jackson.databind.DeserializationConfig;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.SerializationConfig;
import tools.jackson.databind.introspect.AnnotatedClass;
import tools.jackson.databind.introspect.ClassIntrospector;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.jsontype.NamedType;

import java.util.Collection;

/**
 * Jackson's own view of a type, as the contract tests read it (what a mapper would serialize or bind), in one place:
 * Jackson 3 hands the introspection out through the mapper's serialization and deserialization contexts and its
 * configurations, not through the mapper itself.
 */
public final class JacksonIntrospection {

    private JacksonIntrospection() {
    }

    /** The class annotations of {@code type}, with mix-ins and the annotations of its supertypes, for serialization. */
    public static AnnotatedClass serializationClass(JsonMapper mapper, JavaType type) {
        return mapper._serializationContext().introspectClassAnnotations(type);
    }

    /** The class annotations of {@code type}, with mix-ins and the annotations of its supertypes, for deserialization. */
    public static AnnotatedClass deserializationClass(JsonMapper mapper, JavaType type) {
        return mapper._deserializationContext().introspectClassAnnotations(type);
    }

    /** What {@code mapper} writes of {@code type}: its serialization description. */
    public static BeanDescription serialization(JsonMapper mapper, JavaType type) {
        return mapper._serializationContext().introspectBeanDescription(type);
    }

    /** What {@code mapper} reads into {@code type}: its deserialization description, not following a builder. */
    public static BeanDescription deserialization(JsonMapper mapper, JavaType type) {
        return mapper._deserializationContext().introspectBeanDescription(type);
    }

    /** The {@code @JsonPOJOBuilder} class that {@code mapper} binds {@code type} through, or {@code null}. */
    public static Class<?> builderOf(JsonMapper mapper, BeanDescription deserialization) {
        DeserializationConfig config = mapper.deserializationConfig();
        return config.getAnnotationIntrospector().findPOJOBuilder(config, deserialization.getClassInfo());
    }

    /** The description of {@code builder}, as the builder of {@code deserialization}'s type. */
    public static BeanDescription builderDescription(JsonMapper mapper, JavaType builder, BeanDescription deserialization) {
        DeserializationConfig config = mapper.deserializationConfig();
        ClassIntrospector introspector = config.classIntrospectorInstance().forOperation(config);
        return introspector.introspectForDeserializationWithBuilder(builder, deserialization);
    }

    /** The registered subtypes of {@code type} with the class they stand for, as the serializer resolves them. */
    public static Collection<NamedType> subtypesByClass(JsonMapper mapper, AnnotatedClass type) {
        SerializationConfig config = mapper.serializationConfig();
        return config.getSubtypeResolver().collectAndResolveSubtypesByClass(config, type);
    }

    /** The registered subtypes of {@code type} with the type id they are read by, as the deserializer resolves them. */
    public static Collection<NamedType> subtypesByTypeId(JsonMapper mapper, AnnotatedClass type) {
        DeserializationConfig config = mapper.deserializationConfig();
        return config.getSubtypeResolver().collectAndResolveSubtypesByTypeId(config, type);
    }
}
