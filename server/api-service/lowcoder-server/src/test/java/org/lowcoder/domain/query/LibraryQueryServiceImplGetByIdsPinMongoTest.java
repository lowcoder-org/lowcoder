package org.lowcoder.domain.query;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.LibraryQuery;

/**
 * Pins plan section 9 row "LibraryQueryServiceImpl.getByIds picks id or gid from one element and drops the other kind"
 * (task L3-11d, same shape as the L3-11c DatasourceRepository.findByIds row). The key kind of the whole list is decided by
 * its first element (LibraryQueryServiceImpl.getByIds, findFirst), so a mixed list only returns the queries of that element's
 * kind. Reach: MetaController.java:53 passes the client's libraryQueryIds list unchanged. A fix (query both kinds) changes
 * this test on purpose.
 */
class LibraryQueryServiceImplGetByIdsPinMongoTest extends LibraryQueryMongoTestBase {

    @Test
    void getByIdsOfAMixedListDropsTheOtherKind_pinsTheSection9Row() {
        String orgId = newId();
        LibraryQuery a = insertQuery(orgId);
        LibraryQuery b = insertQuery(orgId);

        List<LibraryQuery> idFirst = libraryQueryService.getByIds(List.of(a.getId(), b.getGid())).collectList().block(TIMEOUT);
        List<LibraryQuery> gidFirst = libraryQueryService.getByIds(List.of(b.getGid(), a.getId())).collectList().block(TIMEOUT);

        System.out.println("[LibraryQueryServiceImplGetByIdsPinMongoTest] PINNED id first -> " + idFirst.size() + ", gid first -> " + gidFirst.size());
        assertThat(idFirst).extracting(LibraryQuery::getId).containsExactly(a.getId());
        assertThat(gidFirst).extracting(LibraryQuery::getId).containsExactly(b.getId());
    }
}
