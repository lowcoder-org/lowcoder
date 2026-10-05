package org.lowcoder.domain.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.springframework.dao.IncorrectResultSizeDataAccessException;

/**
 * BF-068, task L3-11d. This class pinned the plan section 9 row on the unscoped single-result name finder: once two orgs had a
 * library query of the same name, by-name execution failed for both with IncorrectResultSizeDataAccessException. The lookup is
 * now scoped to the organization (LibraryQueryRepository.findByOrganizationIdAndName), so a second organization choosing the
 * same name changes nothing for the first: each organization's lookup answers its own query. Two queries of one name in the
 * same organization still fail the single-result lookup, the limit documented on
 * LibraryQueryService.getByOrganizationIdAndName and shown by the second test.
 */
class LibraryQueryServiceImplGetByNamePinMongoTest extends LibraryQueryMongoTestBase {

    @Test
    void twoOrgsWithTheSameNameEachGetTheirOwnQuery() {
        String name = "lq-same-" + newId();
        LibraryQuery inFirstOrg = insertQuery(newId(), name, COMP_TYPE);
        assertThat(libraryQueryService.getByOrganizationIdAndName(inFirstOrg.getOrganizationId(), name).block(TIMEOUT).getId())
                .as("unique so far").isEqualTo(inFirstOrg.getId());

        LibraryQuery inSecondOrg = insertQuery(newId(), name, COMP_TYPE);

        LibraryQuery firstAnswer = libraryQueryService.getByOrganizationIdAndName(inFirstOrg.getOrganizationId(), name).block(TIMEOUT);
        LibraryQuery secondAnswer = libraryQueryService.getByOrganizationIdAndName(inSecondOrg.getOrganizationId(), name).block(TIMEOUT);
        System.out.println("[LibraryQueryServiceImplGetByNamePinMongoTest] same name in two orgs: first org -> " + firstAnswer.getId()
                + ", second org -> " + secondAnswer.getId());
        assertThat(firstAnswer.getId()).as("the first org still gets its own query").isEqualTo(inFirstOrg.getId());
        assertThat(secondAnswer.getId()).as("the second org gets its own query").isEqualTo(inSecondOrg.getId());
    }

    /** The documented limit: names are not unique within one organization, and the single-result lookup fails for a duplicate. */
    @Test
    void twoQueriesWithTheSameNameInOneOrgStillFailTheLookup() {
        String orgId = newId();
        String name = "lq-dup-" + newId();
        insertQuery(orgId, name, COMP_TYPE);
        insertQuery(orgId, name, COMP_TYPE);

        IncorrectResultSizeDataAccessException failure = assertThrows(IncorrectResultSizeDataAccessException.class,
                () -> libraryQueryService.getByOrganizationIdAndName(orgId, name).block(TIMEOUT));
        System.out.println("[LibraryQueryServiceImplGetByNamePinMongoTest] LIMIT same name twice in one org: " + failure.getMessage());
    }
}
