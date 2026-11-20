package org.lowcoder.infra.mongo;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Duration;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.lowcoder.infra.InfraMongoTestConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * How the application's converter stores a {@link BigInteger} and a {@link BigDecimal}, against a real MongoDB (the context
 * and database of {@link InfraMongoTestConfiguration}, which reads the application's {@code application.yaml}). They have
 * always been stored as strings, and documents written by earlier releases hold strings; Spring Data MongoDB 5 would write
 * them as BSON decimals unless {@code spring.data.mongodb.representation.big-decimal} says {@code string}. A stored
 * {@code Decimal128} would also reach the API as a JSON number where a string was returned, so the format is pinned here.
 */
@SpringBootTest(classes = InfraMongoTestConfiguration.class)
@ActiveProfiles(InfraMongoTestConfiguration.PROFILE)
class MongoBigNumberStorageTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String COLLECTION_PREFIX = "bigNumberStorage_";
    private static final BigInteger BEYOND_LONG = new BigInteger("9223372036854775808");
    private static final BigDecimal DECIMAL = new BigDecimal("12345678901234567890.125");

    @Autowired
    private ReactiveMongoTemplate template;

    /** Holder of the two values, written by the application's converter. */
    private record Amounts(String id, BigInteger beyondLong, BigDecimal decimal) {
    }

    /** Catches the converter writing BSON decimals or numbers: both values must be stored as their decimal text. */
    @Test
    void bigIntegerAndBigDecimalAreStoredAsStrings() {
        String collection = COLLECTION_PREFIX + UUID.randomUUID();
        Amounts amounts = new Amounts("amounts", BEYOND_LONG, DECIMAL);

        template.save(amounts, collection).block(TIMEOUT);
        Document stored = template.findAll(Document.class, collection).blockFirst(TIMEOUT);
        template.dropCollection(collection).block(TIMEOUT);

        System.out.println("[MongoBigNumberStorageTest] stored document " + stored + " beyondLong "
                + stored.get("beyondLong").getClass().getName() + " decimal " + stored.get("decimal").getClass().getName());
        assertThat(stored.get("beyondLong")).as("BigInteger beyond the long range as stored").isEqualTo(BEYOND_LONG.toString());
        assertThat(stored.get("decimal")).as("BigDecimal as stored").isEqualTo(DECIMAL.toString());
    }
}
