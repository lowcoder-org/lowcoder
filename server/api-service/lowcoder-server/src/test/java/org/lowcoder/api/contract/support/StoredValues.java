package org.lowcoder.api.contract.support;

import org.bson.Document;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import java.util.List;
import java.util.Map;

/**
 * Values as the store gives them back (docs/API_PAYLOAD_TEST_PLAN.md §9 O19): written into a document by Spring
 * Data's {@link MappingMongoConverter} and read back, the converter built as Spring Boot builds it (an empty
 * {@link MongoCustomConversions}) with the map-key dot replacement that {@code MongoConfig#init} sets. Limit: the
 * database driver's encoding between write and read is not run.
 */
public final class StoredValues {

    /** The map-key dot replacement {@code MongoConfig#init} sets on the production converter. */
    public static final String MAP_KEY_DOT_REPLACEMENT = "##OB_REPLACE##";

    private StoredValues() {
    }

    /** {@code dsl} as a record's or an application's DSL read from the store holds it. */
    public static Map<String, Object> dsl(Map<String, Object> dsl) {
        MongoCustomConversions conversions = new MongoCustomConversions(List.of());
        MongoMappingContext context = new MongoMappingContext();
        context.setSimpleTypeHolder(conversions.getSimpleTypeHolder());
        context.afterPropertiesSet();
        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setCustomConversions(conversions);
        converter.setMapKeyDotReplacement(MAP_KEY_DOT_REPLACEMENT);
        converter.afterPropertiesSet();
        Document document = new Document();
        converter.write(ApplicationVersion.builder().applicationDSL(dsl).build(), document);
        return converter.read(ApplicationVersion.class, document).getApplicationDSL();
    }
}
