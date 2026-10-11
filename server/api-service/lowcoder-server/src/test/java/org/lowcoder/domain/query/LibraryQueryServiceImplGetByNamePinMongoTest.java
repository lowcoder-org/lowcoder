package org.lowcoder.domain.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.springframework.dao.IncorrectResultSizeDataAccessException;

/**
 * Pins plan section 9 row "LibraryQueryServiceImpl.getByName is a single-result finder across all orgs: once two orgs have a
 * library query of the same name, by-name execution fails for both (IncorrectResultSizeDataAccessException; caller
 * LibraryQueryApiServiceImpl:277)" (task L3-11d). Related to, but separate from, the section 9 tenant-isolation row (L1-7):
 * that row is about the lookup answering another org's query; this one is a functional failure, the lookup answers nothing
 * for anyone. The lookup is the Mono finder LibraryQueryRepository.findByName, with no org parameter. A fix (scope by org)
 * changes this test on purpose.
 */
class LibraryQueryServiceImplGetByNamePinMongoTest extends LibraryQueryMongoTestBase {

    @Test
    void getByNameFailsForBothOrgsOnceTwoOrgsUseTheSameName_pinsTheSection9Row() {
        String name = "lq-same-" + newId();
        LibraryQuery inFirstOrg = insertQuery(newId(), name, COMP_TYPE);
        assertThat(libraryQueryService.getByName(name).block(TIMEOUT).getId()).as("unique so far").isEqualTo(inFirstOrg.getId());

        insertQuery(newId(), name, COMP_TYPE);

        IncorrectResultSizeDataAccessException failure = assertThrows(IncorrectResultSizeDataAccessException.class,
                () -> libraryQueryService.getByName(name).block(TIMEOUT));
        System.out.println("[LibraryQueryServiceImplGetByNamePinMongoTest] PINNED second org's same name: " + failure.getMessage());
        assertThat(libraryQueryService.getByOrganizationId(inFirstOrg.getOrganizationId()).collectList().block(TIMEOUT))
                .as("the first org's own query is still there").hasSize(1);
    }
}
