package org.lowcoder.api.common;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.io.IOUtils;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.test.JsonFileReader;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.util.MoreMapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Flux;

/**
 * Loads the seed documents from {@code org/lowcoder/api/common/json} into the test database.
 * <p>
 * Safe to call more than once against the same database: test classes share one cached Spring context
 * and one database (TestContainersInitializer: one per context), so every class may call {@link #init()} in its setup. A seed document is
 * inserted only when no document with its id exists yet.
 * <p>
 * Does not cover: a seed document that already exists is left as it is, so changes an earlier test
 * made to it (a rename, a permission grant) are <b>not</b> reverted. Tests that need pristine data
 * must not modify shared seed documents, or must create their own.
 */
@Component
public class InitData {

    private static final String SEED_DIRECTORY = "org/lowcoder/api/common/json";
    private static final String SEED_FILE_EXTENSION = ".json";
    private static final String MONGO_ID_FIELD = "_id";

    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    public void init() {
        try {
            execute();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings({"ConstantConditions"})
    private void execute() {

        String currentDirPath = JsonFileReader.buildPath(SEED_DIRECTORY);
        File dir = new File(currentDirPath);
        Stream.of(dir.listFiles())
                .filter(file -> file.isFile() && file.getName().endsWith(SEED_FILE_EXTENSION))
                .forEach(file -> {
                    try (Reader reader = new FileReader(file)) {
                        Map<String, Object> map = JsonUtils.fromJsonMap(IOUtils.toString(reader));
                        insertMissing(map);
                    } catch (IOException | ClassNotFoundException e) {
                        throw new RuntimeException(e);
                    }
                });
    }

    @SuppressWarnings("ConstantConditions")
    private void insertMissing(Map<String, Object> map) throws ClassNotFoundException {
        Class<?> clazz = Class.forName(MapUtils.getString(map, "class"));
        List<Object> data = MoreMapUtils.getList(map, "data");
        List<?> objects = JsonUtils.fromJsonList(JsonUtils.toJson(data), clazz);
        Flux.fromIterable(objects)
                .cast(HasIdAndAuditing.class)
                .concatMap(object -> mongoTemplate.exists(Query.query(Criteria.where(MONGO_ID_FIELD).is(object.getId())), clazz)
                        .filter(exists -> !exists)
                        .flatMap(notExists -> {
                            object.setCreatedAt(Instant.now());
                            return mongoTemplate.insert(object);
                        }))
                .blockLast();
    }
}
