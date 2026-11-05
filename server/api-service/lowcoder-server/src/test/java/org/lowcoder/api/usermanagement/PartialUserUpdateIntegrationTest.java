package org.lowcoder.api.usermanagement;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * NEW-136: a partial {@link User} passed to an update must not overwrite the stored nickname flag. A language-only or
 * empty profile update and a photo upload used to write {@code hasSetNickname=false} (a primitive's default); a name
 * update sets it to true on purpose. Every case reads the raw Mongo document.
 *
 * <p>Each case asserts its prerequisites first, with a message that starts {@code [NEW-136][prerequisite <case> <n>]};
 * the case's own assertion starts {@code [NEW-136][flag <case>]}. The user id holds no hyphen:
 * {@code FieldName.guessFieldNameFromId} reads an id with one as a gid.
 */
@SpringBootTest
@ActiveProfiles("test")
class PartialUserUpdateIntegrationTest {

    private static final String PARTIAL_UPDATE_FLAG_USER_ID = "usernew136flag";
    private static final String FLAG_FIELD = "hasSetNickname";
    private static final String UI_LANGUAGE_FIELD = "uiLanguage";
    private static final String AVATAR_FIELD = "avatar";
    private static final String NAME_FIELD = "name";
    private static final String ID_FIELD = "_id";
    private static final String OTHER_LANGUAGE = "xx-NEW136";
    private static final String ASSET_ID = "new136-asset";
    private static final String SEEDED_NAME = "NEW-136 user";
    private static final String RENAMED = "NEW-136 renamed";
    private static final String LOG = "[NEW-136] ";
    private static final String UNSET_USER_JSON = "{\"id\":\"x\"}";
    private static final String SET_USER_JSON = "{\"id\":\"x\",\"hasSetNickname\":true}";
    private static final String JSON_FLAG_FALSE = "\"hasSetNickname\":false";

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MongoUpsertHelper mongoUpsertHelper;
    @Autowired
    private ReactiveMongoTemplate reactiveMongoTemplate;

    @AfterEach
    void removeTheUser() {
        userRepository.deleteById(PARTIAL_UPDATE_FLAG_USER_ID).block();
    }

    private void seedUserWithFlag(boolean flag) {
        userRepository.deleteById(PARTIAL_UPDATE_FLAG_USER_ID).block();
        userRepository.save(User.builder().id(PARTIAL_UPDATE_FLAG_USER_ID).name(SEEDED_NAME)
                .state(UserState.ACTIVATED).hasSetNickname(flag).build()).block();
    }

    /** The raw document; a missing one fails as the prerequisite {@code what} names, e.g. {@code "R1 3"} (case, number). */
    private Document rawDocument(String what) {
        Document document = reactiveMongoTemplate.findById(PARTIAL_UPDATE_FLAG_USER_ID, Document.class,
                reactiveMongoTemplate.getCollectionName(User.class)).block();
        System.out.println(LOG + "raw document of " + PARTIAL_UPDATE_FLAG_USER_ID + ": " + document);
        assertNotNull(document, "[NEW-136][prerequisite " + what + "] the raw document of " + PARTIAL_UPDATE_FLAG_USER_ID + " is not found");
        return document;
    }

    /** Prerequisites p1 (the seeded flag) and p3 (the document read is the seeded one). */
    private void assertSeeded(String caze, boolean flag) {
        Document seeded = rawDocument(caze + " 3");
        assertNotNull(seeded, "[NEW-136][prerequisite " + caze + " 3] the seeded document is not found");
        assertAll(
                () -> assertEquals(PARTIAL_UPDATE_FLAG_USER_ID, seeded.get(ID_FIELD),
                        "[NEW-136][prerequisite " + caze + " 3] the document read is not the seeded one"),
                () -> assertEquals(flag, seeded.get(FLAG_FIELD),
                        "[NEW-136][prerequisite " + caze + " 1] the seeded document does not hold the flag " + flag));
    }

    private void assertFlagKept(String caze) {
        Document after = rawDocument(caze + " 3");
        assertEquals(true, after.get(FLAG_FIELD), "[NEW-136][flag " + caze + "] the stored flag after the update");
    }

    /** R1: the partial of a language-only profile update (UserController.updateUser) keeps the stored flag. */
    @Test
    void aLanguageOnlyUpdateKeepsTheNicknameFlagNEW136() {
        seedUserWithFlag(true);
        assertSeeded("R1", true);
        User partial = new User();
        partial.setUiLanguage(OTHER_LANGUAGE);

        User updated = userService.update(PARTIAL_UPDATE_FLAG_USER_ID, partial).block();

        assertNotNull(updated, "[NEW-136][prerequisite R1 2] the update answered no user");
        assertEquals(OTHER_LANGUAGE, rawDocument("R1 2").get(UI_LANGUAGE_FIELD),
                "[NEW-136][prerequisite R1 2] the language was not written");
        assertFlagKept("R1");
    }

    /** R2: the partial of a photo upload (UserServiceImpl.updateUserAvatar) keeps the stored flag. */
    @Test
    void aPhotoUpdateKeepsTheNicknameFlagNEW136() {
        seedUserWithFlag(true);
        assertSeeded("R2", true);

        Boolean written = mongoUpsertHelper.updateById(User.builder().avatar(ASSET_ID).build(), PARTIAL_UPDATE_FLAG_USER_ID).block();

        assertAll(
                () -> assertEquals(Boolean.TRUE, written, "[NEW-136][prerequisite R2 2] the update did not modify a document"),
                () -> assertEquals(ASSET_ID, rawDocument("R2 2").get(AVATAR_FIELD), "[NEW-136][prerequisite R2 2] the avatar was not written"));
        assertFlagKept("R2");
    }

    /** R3: an empty profile update (an empty PUT /api/users body builds a bare User) keeps the stored flag. */
    @Test
    void anEmptyProfileUpdateKeepsTheNicknameFlagNEW136() {
        seedUserWithFlag(true);
        assertSeeded("R3", true);

        User updated = userService.update(PARTIAL_UPDATE_FLAG_USER_ID, new User()).block();

        assertNotNull(updated, "[NEW-136][prerequisite R3 2] the update answered no user");
        assertFlagKept("R3");
    }

    /** K1 (control): a name update sets the flag, on purpose (UserController.updateUser). */
    @Test
    void aNameUpdateSetsTheNicknameFlagNEW136() {
        seedUserWithFlag(false);
        assertSeeded("K1", false);
        User partial = new User();
        partial.setName(RENAMED);
        partial.setHasSetNickname(true);

        User updated = userService.update(PARTIAL_UPDATE_FLAG_USER_ID, partial).block();

        assertNotNull(updated, "[NEW-136][prerequisite K1 2] the update answered no user");
        Document after = rawDocument("K1 2");
        assertEquals(RENAMED, after.get(NAME_FIELD), "[NEW-136][prerequisite K1 2] the name was not written");
        assertEquals(true, after.get(FLAG_FIELD), "[NEW-136][flag K1] the stored flag after a name update");
    }

    /** R4: a user saved without the flag stores no key, reads false, and shows false in JSON (the unset state). */
    @Test
    void aUserWithoutTheFlagStoresNoKeyReadsFalseAndShowsFalseNEW136() {
        userRepository.deleteById(PARTIAL_UPDATE_FLAG_USER_ID).block();
        userRepository.save(User.builder().id(PARTIAL_UPDATE_FLAG_USER_ID).name(SEEDED_NAME).state(UserState.ACTIVATED).build()).block();
        Document raw = rawDocument("R4 1");
        User read = userRepository.findById(PARTIAL_UPDATE_FLAG_USER_ID).block();
        assertNotNull(read, "[NEW-136][prerequisite R4 1] the saved user cannot be read");

        assertAll(
                () -> assertFalse(raw.containsKey(FLAG_FIELD), "[NEW-136][flag R4 a] the raw document holds the key: " + raw.get(FLAG_FIELD)),
                () -> assertFalse(read.isHasSetNickname(), "[NEW-136][flag R4 b] a user without the key reads true"),
                () -> assertTrue(JsonUtils.toJson(read).contains(JSON_FLAG_FALSE), "[NEW-136][flag R4 c] the JSON of the user: " + JsonUtils.toJson(read)),
                () -> assertFalse(JsonUtils.fromJson(UNSET_USER_JSON, User.class).isHasSetNickname(), "[NEW-136][flag R4 d] JSON without the flag reads true"),
                () -> assertTrue(JsonUtils.fromJson(SET_USER_JSON, User.class).isHasSetNickname(), "[NEW-136][flag R4 d] JSON with true reads false"));
    }
}
