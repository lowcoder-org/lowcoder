package org.lowcoder.api.subscription;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

class WorkspaceSeatCounterTest {
    private OrgMember member(String id, MemberRole role) {
        return new OrgMember("workspace", id, role, "normal", 0);
    }
    private GroupMember editor(String id) {
        return new GroupMember("developers", id, MemberRole.MEMBER, "workspace", 0);
    }

    @Test void countsAdminsAndEditorsOnceAndNeverViewers() {
        assertEquals(3, WorkspaceSeatCounter.count("workspace", List.of(
                member("admin", MemberRole.ADMIN), member("super", MemberRole.SUPER_ADMIN),
                member("editor", MemberRole.MEMBER), member("viewer", MemberRole.MEMBER),
                member("editor", MemberRole.MEMBER)),
                List.of(editor("admin"), editor("editor"), editor("editor"), editor("removed"))));
    }

    @Test void promotionsAndDemotionsChangeOnlyBillableMembership() {
        assertEquals(0, WorkspaceSeatCounter.count("workspace", List.of(member("user", MemberRole.MEMBER)), List.of()));
        assertEquals(1, WorkspaceSeatCounter.count("workspace", List.of(member("user", MemberRole.ADMIN)), List.of()));
        assertEquals(1, WorkspaceSeatCounter.count("workspace", List.of(member("user", MemberRole.MEMBER)), List.of(editor("user"))));
        assertEquals(0, WorkspaceSeatCounter.count("workspace", List.of(), List.of(editor("user"))));
    }

    @Test void ignoresForeignWorkspaceMembershipAndAllowsZeroSeats() {
        assertEquals(0, WorkspaceSeatCounter.count("workspace", List.of(
                new OrgMember("other", "foreign-admin", MemberRole.ADMIN, "normal", 0),
                member("viewer", MemberRole.MEMBER)), List.of(
                new GroupMember("other-dev", "viewer", MemberRole.MEMBER, "other", 0))));
    }
}
