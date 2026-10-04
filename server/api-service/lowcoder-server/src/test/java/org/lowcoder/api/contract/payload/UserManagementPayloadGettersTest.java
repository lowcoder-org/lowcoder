package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.OrganizationSamples;
import org.lowcoder.api.contract.support.UserSamples;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.mongodb.MongodbInterceptorContext;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.CanonicalJson.ArrayValue;
import org.lowcoder.sdk.contract.CanonicalJson.Member;
import org.lowcoder.sdk.contract.CanonicalJson.Node;
import org.lowcoder.sdk.contract.CanonicalJson.ObjectValue;
import org.lowcoder.sdk.contract.CanonicalJson.ScalarValue;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The {@code payload-getters} group of docs/API_PAYLOAD_TEST_PLAN.md §4.10 for {@code User} and
 * {@code OrganizationDomain} (R12, task T4.5): the MongoDB hooks that convert typed lists to {@code List<Object>} and
 * back with Jackson ({@code User.java:147-160}, {@code OrganizationDomain.java:31-40}), called through their real entry
 * points, the {@code BeforeMongodbWrite} and {@code AfterMongodbRead} hooks of {@code User} and {@code Organization}
 * (whose hooks call the package-private ones of its domain), with an {@link EncryptionService} that marks what it
 * encrypts.
 *
 * <p>Write hooks: the stored {@code List<Object>} is compared with its golden
 * ({@code boundary/payload-getters/<Type>.beforeMongodbWrite.json}) by the §1.2 contract, and its Java value with
 * {@link CanonicalJson#assertSameJava} against the golden read by {@link #javaValue}, which binds JSON as the production
 * mapper binds {@code Object} (§4.6) without Jackson: so a change of the classes the conversion produces fails here.
 * Read hooks: the golden, as MongoDB hands it back, is converted to the typed list, which must equal the sample's
 * list field by field with the same element classes (the beans have no {@code equals}, so {@code assertSameJava} does
 * not apply to them). Limits: {@link #javaValue} handles the JSON these goldens hold (objects, arrays, strings,
 * booleans, null) and rejects numbers; the {@code JsonViews.Internal} view the write hooks use is pinned only through
 * what it writes (the secrets are written, encrypted).
 */
class UserManagementPayloadGettersTest {

    static final String USER_WRITE_GOLDEN = "boundary/payload-getters/User.beforeMongodbWrite.json";
    static final String ORGANIZATION_DOMAIN_WRITE_GOLDEN = "boundary/payload-getters/OrganizationDomain.beforeMongodbWrite.json";
    /** {@code OrganizationDomain}'s stored list: a private field without accessor, which only MongoDB reads and writes. */
    static final String AUTH_CONFIGS_FIELD = "authConfigs";
    /** What {@link MarkingEncryptionService} puts before an encrypted string. */
    static final String ENCRYPTED_PREFIX = "encrypted:";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static final MongodbInterceptorContext CONTEXT = new MongodbInterceptorContext(new MarkingEncryptionService());

    /** The API keys are encrypted and stored as maps, every property written under the {@code Internal} view. */
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/user/model/User.java#User.beforeMongodbWrite#fromJsonSafely#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/user/model/User.java#User.beforeMongodbWrite#toJsonSafely#1"})
    @Test
    void userBeforeMongodbWrite() throws JsonProcessingException {
        User user = UserSamples.user();
        user.beforeMongodbWrite(CONTEXT);
        assertStored(USER_WRITE_GOLDEN, user.getApiKeys());
    }

    /** The stored maps become the sample's API keys again, their tokens decrypted. */
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/user/model/User.java#User.afterMongodbRead#fromJsonSafely#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/user/model/User.java#User.afterMongodbRead#toJson#1"})
    @Test
    void userAfterMongodbRead() {
        User user = new User();
        user.setApiKeys(storedList(USER_WRITE_GOLDEN));
        user.afterMongodbRead(CONTEXT);
        assertSameBeans(UserSamples.user().getApiKeysList(), user.getApiKeysList());
    }

    /** The auth configs are encrypted and stored as maps; their type is the {@code authType} property. */
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/organization/model/OrganizationDomain.java#OrganizationDomain.beforeMongodbWrite#fromJsonSafely#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/organization/model/OrganizationDomain.java#OrganizationDomain.beforeMongodbWrite#toJsonSafely#1"})
    @Test
    void organizationDomainBeforeMongodbWrite() throws JsonProcessingException {
        Organization organization = OrganizationSamples.organization();
        organization.beforeMongodbWrite(CONTEXT);
        assertStored(ORGANIZATION_DOMAIN_WRITE_GOLDEN, ReflectionTestUtils.getField(organization.getOrganizationDomain(), AUTH_CONFIGS_FIELD));
    }

    /** The stored maps become the sample's five auth configs again, each of its class, their secrets decrypted. */
    @BoundarySites({"lowcoder-domain/src/main/java/org/lowcoder/domain/organization/model/OrganizationDomain.java#OrganizationDomain.afterMongodbRead#fromJsonSafely#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/organization/model/OrganizationDomain.java#OrganizationDomain.afterMongodbRead#toJson#1"})
    @Test
    void organizationDomainAfterMongodbRead() {
        OrganizationDomain domain = new OrganizationDomain();
        ReflectionTestUtils.setField(domain, AUTH_CONFIGS_FIELD, storedList(ORGANIZATION_DOMAIN_WRITE_GOLDEN));
        Organization organization = Organization.builder().organizationDomain(domain).build();
        organization.afterMongodbRead(CONTEXT);
        assertSameBeans(OrganizationSamples.organization().getOrganizationDomain().getConfigs(), domain.getConfigs());
    }

    /** The stored value against its golden, as JSON and as Java values. */
    private static void assertStored(String golden, Object stored) throws JsonProcessingException {
        System.out.println("[UserManagementPayloadGettersTest] " + golden + ": stored " + stored);
        GOLDEN.assertJson(golden, JsonUtils.getObjectMapper().writeValueAsString(stored));
        CanonicalJson.assertSameJava(javaValue(CanonicalJson.parse(GOLDEN.read(golden))), stored);
    }

    /** The golden as MongoDB hands the stored list back: maps, lists and scalars. */
    @SuppressWarnings("unchecked")
    private static List<Object> storedList(String golden) {
        return (List<Object>) javaValue(CanonicalJson.parse(GOLDEN.read(golden)));
    }

    /** Same size, the same class element by element, and equal fields, recursively. */
    private static void assertSameBeans(List<?> expected, List<?> actual) {
        System.out.println("[UserManagementPayloadGettersTest] read back " + actual);
        assertThat(actual).as("read back").hasSameSizeAs(expected);
        for (int i = 0; i < expected.size(); i++) {
            assertThat(actual.get(i)).as("element " + i).isExactlyInstanceOf(expected.get(i).getClass())
                    .usingRecursiveComparison().isEqualTo(expected.get(i));
        }
    }

    /**
     * A parsed golden as the production mapper binds JSON to {@code Object} (§4.6): {@code LinkedHashMap},
     * {@code ArrayList}, {@code String}, {@code Boolean}, {@code null}. Numbers are rejected: their classes depend on
     * the lexeme, and these goldens hold none.
     */
    static Object javaValue(Node node) {
        if (node instanceof ObjectValue object) {
            Map<String, Object> map = new LinkedHashMap<>();
            for (Member member : object.members()) {
                map.put(member.key(), javaValue(member.value()));
            }
            return map;
        }
        if (node instanceof ArrayValue array) {
            List<Object> list = new ArrayList<>();
            array.elements().forEach(element -> list.add(javaValue(element)));
            return list;
        }
        ScalarValue scalar = (ScalarValue) node;
        return switch (scalar.kind()) {
            case STRING -> scalar.value();
            case TRUE -> Boolean.TRUE;
            case FALSE -> Boolean.FALSE;
            case NULL -> null;
            case NUMBER -> throw new IllegalArgumentException("number " + scalar.raw() + ": not handled by javaValue");
        };
    }

    /** Encrypts by marking, decrypts by removing the mark (and fails on an unmarked value); nothing else is used. */
    static final class MarkingEncryptionService implements EncryptionService {

        @Override
        public String encryptString(String plaintext) {
            return ENCRYPTED_PREFIX + plaintext;
        }

        @Override
        public String decryptString(String encryptedText) {
            assertThat(encryptedText).as("a value the hook decrypts").startsWith(ENCRYPTED_PREFIX);
            return encryptedText.substring(ENCRYPTED_PREFIX.length());
        }

        @Override
        public String encryptStringForNodeServer(String plaintext) {
            throw new UnsupportedOperationException("not used by the payload hooks");
        }

        @Override
        public String encryptPassword(String plaintext) {
            throw new UnsupportedOperationException("not used by the payload hooks");
        }

        @Override
        public boolean matchPassword(String password1, String password2) {
            throw new UnsupportedOperationException("not used by the payload hooks");
        }
    }
}
