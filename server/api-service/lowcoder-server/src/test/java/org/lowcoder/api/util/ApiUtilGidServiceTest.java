package org.lowcoder.api.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.lowcoder.domain.datasource.repository.DatasourceDORepository;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.repository.GroupRepository;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.repository.LibraryQueryRepository;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit I2 (task L1-13, lane L5): {@code GidService}, the converters from the id a client sends (an object id, a slug or a gid) to
 * the stored object id. A gid is any text with a hyphen ({@code FieldName.isGID}); applications and organizations try the slug
 * first. Mockito: the seven repositories are mocks, the entities are real objects.
 *
 * <p>Not a re-pin: the permission-bypass row of plan section 9 ({@code DatasourceRepository.retainNoneExistAndNonCurrentOrgDatasourceIds},
 * pinned by 1f8d88dce and 1b81200d8, fixed as BF-002) starts from gids that come through {@code convertDatasourceIdToObjectId}; this class
 * asserts only the converter's own contract and never touches that repository or its callers.
 *
 * <p>Limits: the repositories are mocks; what the real queries match is not under test.
 */
@ExtendWith(MockitoExtension.class)
public class ApiUtilGidServiceTest {

    static final String TAG = "[ApiUtilGidServiceTest] ";
    static final String OBJECT_ID = "65a1b2c3d4e5f60718293a4b";
    static final String GID = "gid-1234-abcd";
    static final String REAL_ID = "real-object-id";
    static final String OTHER_ID = "other-object-id";
    static final String SLUG = "my-slug";

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private DatasourceDORepository datasourceDORepository;
    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private LibraryQueryRepository libraryQueryRepository;
    @Mock
    private FolderRepository folderRepository;
    @Mock
    private BundleRepository bundleRepository;
    @InjectMocks
    private GidService service;

    private static <T extends HasIdAndAuditing> T withId(T entity, String id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    private static Application application(String id) {
        return withId(new Application(), id);
    }

    private static Organization organization(String id) {
        return withId(new Organization(), id);
    }

    /** Every repository of the service is the mock (a field mismatch would leave one null and fail here). */
    @Test
    public void injectionReachedEveryField() {
        assertSame(applicationRepository, ReflectionTestUtils.getField(service, "applicationRepository"));
        assertSame(datasourceDORepository, ReflectionTestUtils.getField(service, "datasourceDORepository"));
        assertSame(organizationRepository, ReflectionTestUtils.getField(service, "organizationRepository"));
        assertSame(groupRepository, ReflectionTestUtils.getField(service, "groupRepository"));
        assertSame(libraryQueryRepository, ReflectionTestUtils.getField(service, "libraryQueryRepository"));
        assertSame(folderRepository, ReflectionTestUtils.getField(service, "folderRepository"));
        assertSame(bundleRepository, ReflectionTestUtils.getField(service, "bundleRepository"));
        assertNotNull(service);
    }

    // ---- datasource, group, library query, bundle: same shape

    @Test
    public void aNonGidIdIsReturnedUnchangedWithoutAnyLookup() {
        StepVerifier.create(service.convertDatasourceIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        StepVerifier.create(service.convertGroupIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        StepVerifier.create(service.convertLibraryQueryIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        StepVerifier.create(service.convertBundleIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        StepVerifier.create(service.convertDatasourceIdToObjectId("")).expectNext("").verifyComplete();
        verifyNoInteractions(datasourceDORepository, groupRepository, libraryQueryRepository, bundleRepository);
    }

    @Test
    public void aGidIsLookedUpAndTheFirstMatchsRealIdIsReturned() {
        when(datasourceDORepository.findByGid(GID)).thenReturn(Flux.just(withId(new DatasourceDO(), REAL_ID), withId(new DatasourceDO(), OTHER_ID)));
        when(groupRepository.findByGid(GID)).thenReturn(Flux.just(withId(new Group(), REAL_ID)));
        when(libraryQueryRepository.findByGid(GID)).thenReturn(Flux.just(withId(new LibraryQuery(), REAL_ID)));
        when(bundleRepository.findByGid(GID)).thenReturn(Flux.just(withId(new Bundle(), REAL_ID)));
        StepVerifier.create(service.convertDatasourceIdToObjectId(GID)).expectNext(REAL_ID).verifyComplete();
        StepVerifier.create(service.convertGroupIdToObjectId(GID)).expectNext(REAL_ID).verifyComplete();
        StepVerifier.create(service.convertLibraryQueryIdToObjectId(GID)).expectNext(REAL_ID).verifyComplete();
        StepVerifier.create(service.convertBundleIdToObjectId(GID)).expectNext(REAL_ID).verifyComplete();
    }

    /**
     * Observation (the callers are named in the Turn 2 report): an unknown gid, and a match without an id, give an empty Mono, not an
     * error and not the gid itself.
     */
    @Test
    public void anUnknownGidOrAMatchWithoutAnIdGivesAnEmptyMono() {
        when(datasourceDORepository.findByGid(GID)).thenReturn(Flux.empty());
        when(groupRepository.findByGid(GID)).thenReturn(Flux.empty());
        when(libraryQueryRepository.findByGid(GID)).thenReturn(Flux.just(new LibraryQuery()));
        when(bundleRepository.findByGid(GID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertDatasourceIdToObjectId(GID)).verifyComplete();
        StepVerifier.create(service.convertGroupIdToObjectId(GID)).verifyComplete();
        StepVerifier.create(service.convertLibraryQueryIdToObjectId(GID)).verifyComplete();
        StepVerifier.create(service.convertBundleIdToObjectId(GID)).verifyComplete();
    }

    // ---- application and organization: slug first


    @Test
    public void applicationSlugBeatsGidAndNonGidIdsFallBackToThemselves() {
        when(applicationRepository.findBySlug(SLUG)).thenReturn(Flux.just(application(REAL_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(SLUG)).expectNext(REAL_ID).verifyComplete();
        verify(applicationRepository, never()).findByGid(SLUG);

        when(applicationRepository.findBySlug(GID)).thenReturn(Flux.empty());
        when(applicationRepository.findByGid(GID)).thenReturn(Flux.just(application(OTHER_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(GID)).expectNext(OTHER_ID).verifyComplete();

        when(applicationRepository.findBySlug(OBJECT_ID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertApplicationIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        verify(applicationRepository, never()).findByGid(OBJECT_ID);

        String unknown = "unknown-gid-1";
        when(applicationRepository.findBySlug(unknown)).thenReturn(Flux.empty());
        when(applicationRepository.findByGid(unknown)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertApplicationIdToObjectId(unknown)).verifyComplete();
    }

    @Test
    public void organizationSlugBeatsGidAndNonGidIdsFallBackToThemselves() {
        when(organizationRepository.findBySlug(SLUG)).thenReturn(Flux.just(organization(REAL_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectId(SLUG)).expectNext(REAL_ID).verifyComplete();
        verify(organizationRepository, never()).findByGid(SLUG);

        when(organizationRepository.findBySlug(GID)).thenReturn(Flux.empty());
        when(organizationRepository.findByGid(GID)).thenReturn(Flux.just(organization(OTHER_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectId(GID)).expectNext(OTHER_ID).verifyComplete();

        when(organizationRepository.findBySlug(OBJECT_ID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        verify(organizationRepository, never()).findByGid(OBJECT_ID);

        String unknown = "unknown-gid-2";
        when(organizationRepository.findBySlug(unknown)).thenReturn(Flux.empty());
        when(organizationRepository.findByGid(unknown)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectId(unknown)).verifyComplete();
    }

    /** A slug match whose entity has no id is treated as no match, so the lookup goes on to the gid (and then to the id itself). */
    @Test
    public void aSlugMatchWithoutAnIdFallsThroughToTheGidLookup() {
        when(applicationRepository.findBySlug(GID)).thenReturn(Flux.just(new Application()));
        when(applicationRepository.findByGid(GID)).thenReturn(Flux.just(application(REAL_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(GID)).expectNext(REAL_ID).verifyComplete();
    }

    // ---- folder: the one converter that returns an Optional

    @Test
    public void folderConverterReturnsAnOptionalInEveryCase() {
        StepVerifier.create(service.convertFolderIdToObjectId(OBJECT_ID)).expectNext(Optional.of(OBJECT_ID)).verifyComplete();
        StepVerifier.create(service.convertFolderIdToObjectId(null)).expectNext(Optional.empty()).verifyComplete();
        when(folderRepository.findByGid(GID)).thenReturn(Flux.just(withId(new Folder(), REAL_ID)));
        StepVerifier.create(service.convertFolderIdToObjectId(GID)).expectNext(Optional.of(REAL_ID)).verifyComplete();
        String unknown = "unknown-gid-3";
        when(folderRepository.findByGid(unknown)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertFolderIdToObjectId(unknown)).expectNext(Optional.empty()).verifyComplete();
        when(folderRepository.findByGid("no-id-gid")).thenReturn(Flux.just(new Folder()));
        StepVerifier.create(service.convertFolderIdToObjectId("no-id-gid")).expectNext(Optional.empty()).verifyComplete();
    }

    @Test
    public void anObjectIdWithoutAHyphenIsNeverTreatedAsAGid() {
        for (String id : List.of(OBJECT_ID, "abc", "with space", "under_score")) {
            StepVerifier.create(service.convertBundleIdToObjectId(id)).expectNext(id).verifyComplete();
        }
        verifyNoInteractions(bundleRepository);
    }
}
