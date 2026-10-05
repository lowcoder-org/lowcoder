package org.lowcoder.api.util;

import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit I2 (task L1-13, lane L5): {@code ViewBuilder.multiBuild}: items are combined with the objects their ids point to, in the
 * items' order, and an item whose object is missing is silently dropped. Pinned here at the {@code ViewBuilder} level as behaviour;
 * the same consequence at the service level (a record whose creator is not in the user map disappears from the list) is lane
 * L2's test of {@code ApplicationRecordApiServiceImpl} and is not repeated.
 *
 * <p>Limits: plain Java values stand in for the items; no Spring, no repositories.
 */
public class ApiUtilViewBuilderTest {

    static final String TAG = "[ApiUtilViewBuilderTest] ";
    static final Duration TIMEOUT = Duration.ofSeconds(10);

    /** An item that points at an object id. */
    record Member(String name, String userId) {
    }

    /** The object an id points to. */
    record User(String id, String display) {
    }

    private static final List<Member> MEMBERS = List.of(new Member("m1", "u2"), new Member("m2", "u1"), new Member("m3", "u3"));
    private static final Map<String, User> USERS = Map.of("u1", new User("u1", "Ann"), "u2", new User("u2", "Bob"), "u3", new User("u3", "Cid"));

    private static List<String> build(List<Member> members, Map<String, User> users, AtomicReference<Collection<String>> askedFor) {
        List<String> result = ViewBuilder.<Member, String, User, String>multiBuild(members, Member::userId,
                ids -> {
                    askedFor.set(ids);
                    return Mono.just(users);
                },
                (member, user) -> member.name() + ":" + user.display()).block(TIMEOUT);
        System.out.println(TAG + members + " -> " + result);
        return result;
    }

    @Test
    public void resultKeepsTheItemsOrderAndMergesEachItemWithItsObject() {
        AtomicReference<Collection<String>> asked = new AtomicReference<>();
        assertEquals(List.of("m1:Bob", "m2:Ann", "m3:Cid"), build(MEMBERS, USERS, asked));
        assertEquals(List.of("u2", "u1", "u3"), new ArrayList<>(asked.get()), "the supplier is asked for the ids in the items' order");
    }

    @Test
    public void duplicateIdsAreAskedForAsTheyAreAndEveryItemIsMerged() {
        AtomicReference<Collection<String>> asked = new AtomicReference<>();
        List<Member> members = List.of(new Member("a", "u1"), new Member("b", "u1"));
        assertEquals(List.of("a:Ann", "b:Ann"), build(members, USERS, asked));
        assertEquals(List.of("u1", "u1"), new ArrayList<>(asked.get()), "duplicates are kept in the request");
    }

    @Test
    public void anEmptyInputGivesAnEmptyList() {
        AtomicReference<Collection<String>> asked = new AtomicReference<>();
        assertEquals(List.of(), build(List.of(), USERS, asked));
        assertEquals(List.of(), new ArrayList<>(asked.get()), "the supplier is still called, with no ids");
    }

    /**
     * Behaviour, pinned at this level: an item whose object is not in the supplied map is silently dropped from the result, with no
     * error, no placeholder and no count of what was lost. The rest keep their order.
     */
    @Test
    public void anItemWhoseObjectIsMissingIsSilentlyDropped() {
        Map<String, User> withoutU1 = new HashMap<>(USERS);
        withoutU1.remove("u1");
        AtomicReference<Collection<String>> asked = new AtomicReference<>();
        assertEquals(List.of("m1:Bob", "m3:Cid"), build(MEMBERS, withoutU1, asked));
        assertEquals(3, asked.get().size(), "all three ids were asked for");
        assertEquals(List.of(), build(MEMBERS, Map.of(), asked), "with no object at all the result is empty, not an error");
    }

    @Test
    public void aMergerThatReturnsNullDropsTheItemToo() {
        List<String> result = ViewBuilder.<Member, String, User, String>multiBuild(MEMBERS, Member::userId, ids -> Mono.just(USERS),
                (member, user) -> "m2".equals(member.name()) ? null : member.name()).block(TIMEOUT);
        assertEquals(List.of("m1", "m3"), result);
    }

    @Test
    public void anItemWithANullIdIsLookedUpAsANullKey() {
        Map<String, User> users = new HashMap<>(USERS);
        users.put(null, new User("none", "Nobody"));
        List<Member> members = new ArrayList<>(MEMBERS);
        members.add(new Member("m4", null));
        AtomicReference<Collection<String>> asked = new AtomicReference<>();
        assertEquals(List.of("m1:Bob", "m2:Ann", "m3:Cid", "m4:Nobody"), build(members, users, asked));
        assertEquals(null, new ArrayList<>(asked.get()).get(3));
        assertEquals(List.of("m1:Bob", "m2:Ann", "m3:Cid"), build(members, new HashMap<>(USERS), asked), "with no entry for the null key the item is dropped");
        assertThrows(NullPointerException.class, () -> build(members, USERS, asked), "an immutable Map.of refuses a null key lookup");
    }

    // ---- the overload with a Flux supplier

    @Test
    public void theFluxOverloadBuildsTheMapByTheObjectsOwnIdAndKeepsTheItemsOrder() {
        AtomicReference<Collection<String>> asked = new AtomicReference<>();
        List<String> result = ViewBuilder.<Member, String, User, String>multiBuild(MEMBERS, Member::userId,
                ids -> {
                    asked.set(ids);
                    return Flux.fromIterable(List.of(USERS.get("u3"), USERS.get("u1"), USERS.get("u2")));
                },
                User::id,
                (member, user) -> member.name() + ":" + user.display()).block(TIMEOUT);
        System.out.println(TAG + "flux overload -> " + result);
        assertEquals(List.of("m1:Bob", "m2:Ann", "m3:Cid"), result);
        assertEquals(List.of("u2", "u1", "u3"), new ArrayList<>(asked.get()));
    }

    @Test
    public void theFluxOverloadDropsItemsWithoutAnObjectAndTheLaterObjectWinsOnADuplicateId() {
        List<String> dropped = ViewBuilder.<Member, String, User, String>multiBuild(MEMBERS, Member::userId,
                ids -> Flux.just(USERS.get("u1")), User::id, (member, user) -> member.name() + ":" + user.display()).block(TIMEOUT);
        assertEquals(List.of("m2:Ann"), dropped);

        Map<String, User> unused = new LinkedHashMap<>();
        assertTrue(unused.isEmpty());
        List<String> duplicate = ViewBuilder.<Member, String, User, String>multiBuild(List.of(new Member("m1", "u1")), Member::userId,
                ids -> Flux.just(new User("u1", "First"), new User("u1", "Second")), User::id,
                (member, user) -> member.name() + ":" + user.display()).block(TIMEOUT);
        assertEquals(List.of("m1:Second"), duplicate, "the later object replaces the earlier one");
        List<String> none = ViewBuilder.<Member, String, User, String>multiBuild(MEMBERS, Member::userId, ids -> Flux.<User>empty(), User::id,
                (member, user) -> member.name()).block(TIMEOUT);
        assertEquals(List.of(), none);
    }
}
