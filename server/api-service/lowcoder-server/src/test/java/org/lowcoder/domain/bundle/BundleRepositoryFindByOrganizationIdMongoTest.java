package org.lowcoder.domain.bundle;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * {@link BundleRepository#findByOrganizationId} against the MongoDB test container (D-60): two bundles stored under
 * one organization and one under another must answer exactly the two, by id, never the third.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class BundleRepositoryFindByOrganizationIdMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String LOG_PREFIX = "[BundleRepositoryFindByOrganizationIdMongoTest] ";

    @Autowired
    private BundleRepository repository;
    @Autowired
    private ReactiveMongoTemplate mongo;

    private static String id() {
        return new ObjectId().toHexString();
    }

    private Bundle saveBundle(String organizationId, String gid) {
        Bundle bundle = Bundle.builder().name("find-by-org-bundle-" + gid).gid(gid).organizationId(organizationId).build();
        return mongo.save(bundle).block(TIMEOUT);
    }

    @Test
    void findByOrganizationIdAnswersExactlyThatOrganizationsBundlesD60() {
        String orgX = id();
        String orgY = id();
        String gidX1 = id();
        String gidX2 = id();
        String gidY = id();
        Bundle x1 = saveBundle(orgX, gidX1);
        Bundle x2 = saveBundle(orgX, gidX2);
        Bundle y = saveBundle(orgY, gidY);

        try {
            List<String> foundForX = repository.findByOrganizationId(orgX).map(Bundle::getId).collectList().block(TIMEOUT);
            List<String> foundForY = repository.findByOrganizationId(orgY).map(Bundle::getId).collectList().block(TIMEOUT);

            System.out.println(LOG_PREFIX + "org X bundles: " + foundForX + "; org Y bundles: " + foundForY);
            assertThat(foundForX).as("bundles of org X").containsExactlyInAnyOrder(x1.getId(), x2.getId());
            assertThat(foundForY).as("bundles of org Y").containsExactly(y.getId());
        } finally {
            long removed = mongo.remove(Query.query(Criteria.where(FieldName.GID).in(List.of(gidX1, gidX2, gidY))), Bundle.class)
                    .block(TIMEOUT).getDeletedCount();
            System.out.println(LOG_PREFIX + "removed " + removed + " of the 3 bundle(s) the test stored");
            assertThat(removed).as("bundles removed").isEqualTo(3);
        }
    }
}
