package org.lowcoder.runner.migrations;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.bson.Document;
import org.lowcoder.api.common.TestContainers;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Sorts;

/**
 * A database of its own on the module's MongoDB test container ({@link TestContainers#mongoUri}) with a blocking
 * {@link MongoTemplate} over it, dropped on {@link #close()}. The runner tests use it instead of a Spring context, so each
 * test controls the history and the lock collections completely.
 */
final class MigrationTestDatabase implements AutoCloseable {

    /** The history Mongock 5.4.0 wrote for the 29 change sets and its own system change, on an empty database. */
    static final String MONGOCK_HISTORY_FIXTURE = "/migrations/mongock-5.4.0-history.jsonl";
    static final String MONGOCK_SYSTEM_CHANGE_PREFIX = "system-change-";

    private static final String DATABASE_PREFIX = "migration_runner_";

    final String name = DATABASE_PREFIX + UUID.randomUUID().toString().replace("-", "");
    final MongoClient client = MongoClients.create(TestContainers.mongoUri(name));
    final MongoTemplate template = new MongoTemplate(new SimpleMongoClientDatabaseFactory(client, name));

    MongoCollection<Document> history() {
        return template.getCollection(MigrationHistory.COLLECTION);
    }

    MongoCollection<Document> lock() {
        return template.getCollection(MigrationLock.COLLECTION);
    }

    /** All history documents in insertion order. */
    List<Document> historyEntries() {
        return history().find().sort(Sorts.ascending("_id")).into(new ArrayList<>());
    }

    List<Document> historyEntriesOf(String changeId) {
        return historyEntries().stream().filter(d -> changeId.equals(d.getString(MigrationHistory.CHANGE_ID))).toList();
    }

    /** The documents of the Mongock fixture, parsed from its extended JSON, in the order Mongock wrote them. */
    static List<Document> mongockFixture() {
        try (InputStream in = MigrationTestDatabase.class.getResourceAsStream(MONGOCK_HISTORY_FIXTURE)) {
            if (in == null) {
                throw new IllegalStateException("test resource missing: " + MONGOCK_HISTORY_FIXTURE);
            }
            BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            List<Document> documents = new ArrayList<>();
            for (String line = reader.readLine(); line != null; line = reader.readLine()) {
                documents.add(Document.parse(line));
            }
            return documents;
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + MONGOCK_HISTORY_FIXTURE, e);
        }
    }

    /** The fixture entries of the 29 change sets, without Mongock's own system change. */
    static List<Document> mongockChangeSetEntries() {
        return mongockFixture().stream()
                .filter(d -> !d.getString(MigrationHistory.CHANGE_ID).startsWith(MONGOCK_SYSTEM_CHANGE_PREFIX))
                .toList();
    }

    @Override
    public void close() {
        try {
            client.getDatabase(name).drop();
        } finally {
            client.close();
        }
    }
}
