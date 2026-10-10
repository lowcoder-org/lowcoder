package org.lowcoder.domain.enterprise;

import org.lowcoder.domain.encryption.EncryptionService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class EnterpriseLicenseCapabilityService {
    private final ReactiveMongoTemplate mongo;
    private final EncryptionService encryption;
    private final SecureRandom random = new SecureRandom();

    public EnterpriseLicenseCapabilityService(ReactiveMongoTemplate mongo, EncryptionService encryption) {
        this.mongo = mongo;
        this.encryption = encryption;
    }

    public Mono<String> token(String hostId, String orgId, String userId) {
        String id = ownerKey(hostId, orgId, userId);
        Query query = Query.query(Criteria.where("_id").is(id));
        return mongo.findById(id, EnterpriseLicenseCapability.class)
            .switchIfEmpty(Mono.defer(() -> {
                byte[] bytes = new byte[32];
                random.nextBytes(bytes);
                String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
                Update update = new Update().setOnInsert("encryptedToken", encryption.encryptString(token));
                // Concurrent first visits must all keep the original token, never rotate it.
                return mongo.findAndModify(query, update,
                    FindAndModifyOptions.options().upsert(true).returnNew(true), EnterpriseLicenseCapability.class)
                    .onErrorResume(DuplicateKeyException.class,
                        error -> mongo.findById(id, EnterpriseLicenseCapability.class));
            }))
            .switchIfEmpty(Mono.error(new IllegalStateException("License ownership credential unavailable")))
            .map(record -> encryption.decryptString(record.getEncryptedToken()));
    }

    static String ownerKey(String hostId, String orgId, String userId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            // Length-prefix each part so different tuples cannot collide by concatenation.
            for (String part : new String[]{hostId, orgId, userId}) {
                byte[] bytes = part.getBytes(StandardCharsets.UTF_8);
                digest.update((bytes.length + ":").getBytes(StandardCharsets.US_ASCII));
                digest.update(bytes);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
