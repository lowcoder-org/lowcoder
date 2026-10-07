package org.lowcoder.domain.query;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.LibraryQuery;

/**
 * BF-076 (fixed; was pinned as plan section 9 row "LibraryQueryServiceImpl.getByIds picks id or gid from one element and
 * drops the other kind", task L3-11d): a mixed list answers the queries of both kinds, in either order. Reach:
 * MetaController.java:53 passes the client's libraryQueryIds list unchanged.
 */
class LibraryQueryServiceImplGetByIdsPinMongoTest extends LibraryQueryMongoTestBase {

    @Test
    void getByIdsOfAMixedListAnswersBothKindsBF076() {
        String orgId = newId();
        LibraryQuery a = insertQuery(orgId);
        LibraryQuery b = insertQuery(orgId);

        List<LibraryQuery> idFirst = libraryQueryService.getByIds(List.of(a.getId(), b.getGid())).collectList().block(TIMEOUT);
        List<LibraryQuery> gidFirst = libraryQueryService.getByIds(List.of(b.getGid(), a.getId())).collectList().block(TIMEOUT);

        System.out.println("[LibraryQueryServiceImplGetByIdsPinMongoTest] id first -> " + idFirst.size() + ", gid first -> " + gidFirst.size());
        assertThat(idFirst).extracting(LibraryQuery::getId).containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(gidFirst).extracting(LibraryQuery::getId).containsExactlyInAnyOrder(a.getId(), b.getId());
    }
}
