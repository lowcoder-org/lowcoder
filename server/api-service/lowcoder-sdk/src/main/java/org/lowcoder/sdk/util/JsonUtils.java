package org.lowcoder.sdk.util;

import tools.jackson.core.StreamReadConstraints;
import tools.jackson.core.json.JsonFactory;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ObjectWriter;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.cfg.ConstructorDetector;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.jsontype.NamedType;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import tools.jackson.databind.type.CollectionType;
import tools.jackson.databind.type.MapType;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.auth.*;
import tools.jackson.core.JacksonException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.lowcoder.sdk.auth.constants.AuthTypeConstants.*;

@Slf4j
public final class JsonUtils {

    /** Jackson 2's read limits: Jackson 3 lowers the nesting depth to 500 and raises the string length. */
    private static final int MAX_NESTING_DEPTH = 1000;
    private static final int MAX_STRING_LENGTH = 20_000_000;

    private static final JsonFactory JSON_FACTORY = JsonFactory.builderWithJackson2Defaults()
            .streamReadConstraints(StreamReadConstraints.builder()
                    .maxNestingDepth(MAX_NESTING_DEPTH)
                    .maxStringLength(MAX_STRING_LENGTH)
                    .build())
            .build();

    /**
     * Jackson 3 changed several defaults. The mapper keeps the Jackson 2 ones through {@link JsonMapper.Builder#configureForJackson2()}
     * (dates as timestamps, for one), and states the settings the application has always relied on that it does not
     * restore: constructor parameters are named by the compiler's {@code -parameters} (the Jackson 2 parameter names
     * module was registered), a constructor of any visibility can be the creator (Lombok's all-args constructor is
     * package-private) but only when the class has no default constructor, accessor names are lower-cased as in Jackson 2 ({@link LegacyBeanNaming}), properties
     * without a {@code @JsonView} stay in every view, and unknown properties and empty beans are tolerated.
     */
    private static final JsonMapper OBJECT_MAPPER = JsonMapper.builder(JSON_FACTORY).configureForJackson2()
            .propertyNamingStrategy(new LegacyBeanNaming())
            .changeDefaultVisibility(visibility -> visibility.withCreatorVisibility(Visibility.ANY))
            .constructorDetector(ConstructorDetector.DEFAULT.withAllowImplicitWithDefaultConstructor(false))
            .enable(MapperFeature.DETECT_PARAMETER_NAMES)
            .enable(MapperFeature.DEFAULT_VIEW_INCLUSION)
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
            // register sub types
            .registerSubtypes(new NamedType(EmailAuthConfig.class, FORM))
            .registerSubtypes(new NamedType(Oauth2SimpleAuthConfig.class, GITHUB))
            .registerSubtypes(new NamedType(Oauth2SimpleAuthConfig.class, GOOGLE))
            .registerSubtypes(new NamedType(Oauth2OryAuthConfig.class, ORY))
            .registerSubtypes(new NamedType(Oauth2KeycloakAuthConfig.class, KEYCLOAK))
            .registerSubtypes(new NamedType(Oauth2GenericAuthConfig.class, GENERIC))
            .build();

    public static final JsonNode EMPTY_JSON_NODE = createObjectNode();

    private static final ObjectWriter WRITER = OBJECT_MAPPER.writer();

    public static JsonMapper getObjectMapper() {
        return OBJECT_MAPPER;
    }

    public static String toJson(Object obj) {
        try {
            return WRITER.writeValueAsString(obj);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", obj.getClass().getSimpleName(), e);
            return "";
        }
    }

    public static String toJsonSafely(Object obj, Class<?> viewClass) {
        try {
            return OBJECT_MAPPER.writerWithView(viewClass).writeValueAsString(obj);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", obj.getClass().getSimpleName(), e);
            return "";
        }
    }

    public static String toJsonThrows(Object obj) {
        return WRITER.writeValueAsString(obj);
    }

    public static <T> T fromJson(String obj, Class<T> tClass) {
        try {
            return OBJECT_MAPPER.readValue(obj, tClass);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", obj.getClass().getSimpleName(), e);
            return null;
        }
    }

    public static <T> T fromJsonSafely(String obj, TypeReference<T> valueTypeRef, @Nullable T defaultValue) {
        try {
            return OBJECT_MAPPER.readValue(obj, valueTypeRef);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", valueTypeRef.getType().getTypeName(), e);
            return defaultValue;
        }
    }

    public static <T> T fromJsonQuietly(String obj, Class<T> tClass) {
        try {
            return OBJECT_MAPPER.readValue(obj, tClass);
        } catch (JacksonException e) {
            return null;
        }
    }

    public static List<Object> fromJsonList(String obj) {
        return fromJsonList(obj, Object.class);
    }

    public static <T> List<T> fromJsonList(String obj, Class<T> tClass) {
        try {
            CollectionType javaType = OBJECT_MAPPER.getTypeFactory().constructCollectionType(List.class, tClass);
            return OBJECT_MAPPER.readValue(obj, javaType);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", obj.getClass().getSimpleName(), e);
            return null;
        }
    }

    public static <T> Set<T> fromJsonSet(String obj, Class<T> tClass) {
        try {
            CollectionType javaType = OBJECT_MAPPER.getTypeFactory().constructCollectionType(Set.class, tClass);
            return OBJECT_MAPPER.readValue(obj, javaType);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", obj.getClass().getSimpleName(), e);
            return null;
        }
    }

    public static Map<String, Object> fromJsonMap(String obj) {
        return fromJsonMap(obj, String.class, Object.class);
    }

    public static <K, V> Map<K, V> fromJsonMap(String obj, Class<K> kClass, Class<V> vClass) {
        try {
            MapType mapType = OBJECT_MAPPER.getTypeFactory().constructMapType(Map.class, kClass, vClass);
            return OBJECT_MAPPER.readValue(obj, mapType);
        } catch (JacksonException e) {
            log.error("fail to print json of class type: {}", obj.getClass().getSimpleName(), e);
            return null;
        }
    }

    public static JsonNode readTree(byte[] body) {
        return OBJECT_MAPPER.readTree(new String(body, StandardCharsets.UTF_8));
    }

    public static JsonNode readTree(String value) {
        return OBJECT_MAPPER.readTree(value);
    }

    public static JsonNode valueToTree(Object value) {
        return OBJECT_MAPPER.valueToTree(value);
    }

    public static ObjectNode createObjectNode() {
        return OBJECT_MAPPER.createObjectNode();
    }

    public static ArrayNode createArrayNode() {
        return OBJECT_MAPPER.createArrayNode();
    }

    public static Object jsonNodeToObject(JsonNode jsonNode) {
        try {
            return OBJECT_MAPPER.treeToValue(jsonNode, Object.class);
        } catch (JacksonException e) {
            log.error("jsonNode to object error ", e);
            return null;
        }
    }
}
