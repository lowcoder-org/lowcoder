package org.lowcoder.api.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit I2 (task L1-13, lane L5): {@code GidService}, the converters from the id a client sends (an object id, a slug or a gid) to
 * the stored object id. A gid is any text with a hyphen ({@code FieldName.isGID}); organizations try the slug first, applications
 * try the object id or gid first and a unique slug after it (NEW-78). Mockito: the seven repositories are mocks, the entities are real objects.
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
    static final String UNKNOWN_FOLDER_GID = "unknown-gid-3";
    static final String FOLDER_GID_WITHOUT_ID = "no-id-gid";
    static final String FOLDER_NOT_EXIST_KEY = "FOLDER_NOT_EXIST";
    static final String UNKNOWN_APPLICATION_GID = "unknown-gid-1";
    static final String APPLICATION_GID_WITHOUT_ID = "no-id-app-gid";
    static final String SLUG_WITHOUT_ID_GID = "slug-without-id-gid";
    static final String CANT_FIND_APPLICATION_KEY = "CANT_FIND_APPLICATION";
    /** A slug without a hyphen, so it is told from a gid only by the lookups that find nothing by id. */
    static final String PLAIN_SLUG = "myslug";
    static final String SHARED_SLUG = "sharedslug";
    static final String SLUG_OWNER_ID = "slug-owner-id";
    /** The id of an application that holds a key as its slug while another application has that key as its id or gid. */
    static final String SLUG_DECOY_ID = "slug-decoy-id";
    static final String UNKNOWN_OBJECT_ID = "65a1b2c3d4e5f60718293a99";
    static final String UNKNOWN_ORGANIZATION_GID = "unknown-org-gid-4";
    static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";

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

    // ---- application: object id or gid first, then a unique slug (NEW-78); organization: slug first


    /**
     * Catches (NEW-78): the slug asked before the object id or gid. A decoy application holds each id or gid as its slug; an
     * object id and a gid are answered by their own application and never ask the slug, only a key nothing names by id or gid
     * is answered by its one slug owner, and an unknown object id with no slug owner is answered as given.
     */
    @Test
    public void applicationIdOrGidBeatsSlugNEW78() {
        // lenient: the decoy slug stubs are not reached after the fix, the id stubs are not reached before it; either way the
        // case must fail on the assertions below instead of on an unstubbed mock
        lenient().when(applicationRepository.findBySlug(OBJECT_ID)).thenReturn(Flux.just(application(SLUG_DECOY_ID)));
        when(applicationRepository.findById(OBJECT_ID)).thenReturn(Mono.just(application(REAL_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(OBJECT_ID)).expectNext(REAL_ID).verifyComplete();
        verify(applicationRepository, never()).findBySlug(OBJECT_ID);
        verify(applicationRepository, never()).findByGid(OBJECT_ID);

        lenient().when(applicationRepository.findBySlug(GID)).thenReturn(Flux.just(application(SLUG_DECOY_ID)));
        when(applicationRepository.findByGid(GID)).thenReturn(Flux.just(application(OTHER_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(GID)).expectNext(OTHER_ID).verifyComplete();
        verify(applicationRepository, never()).findBySlug(GID);
        verify(applicationRepository, never()).findById(GID);

        lenient().when(applicationRepository.findById(PLAIN_SLUG)).thenReturn(Mono.empty());
        when(applicationRepository.findBySlug(PLAIN_SLUG)).thenReturn(Flux.just(application(SLUG_OWNER_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(PLAIN_SLUG)).expectNext(SLUG_OWNER_ID).verifyComplete();

        lenient().when(applicationRepository.findById(UNKNOWN_OBJECT_ID)).thenReturn(Mono.empty());
        when(applicationRepository.findBySlug(UNKNOWN_OBJECT_ID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertApplicationIdToObjectId(UNKNOWN_OBJECT_ID)).expectNext(UNKNOWN_OBJECT_ID).verifyComplete();
        System.out.println(TAG + "id " + OBJECT_ID + " -> " + REAL_ID + ", gid " + GID + " -> " + OTHER_ID + ", slug " + PLAIN_SLUG
                + " -> " + SLUG_OWNER_ID + ", unknown " + UNKNOWN_OBJECT_ID + " -> itself");
    }

    /**
     * NEW-30 (fixed; the L1-13 pin answered an empty Mono): a gid that no application has, a gid whose application has no id,
     * and a gid whose slug match has no id while no application has the gid are the error NO_RESOURCE_FOUND with
     * CANT_FIND_APPLICATION naming the gid. Since NEW-78 the gid is asked before the slug, and a gid that an application has
     * (without an id) is not looked up as a slug.
     */
    @Test
    public void applicationConverterRefusesAGidThatNamesNoApplicationNEW30() {
        when(applicationRepository.findByGid(UNKNOWN_APPLICATION_GID)).thenReturn(Flux.empty());
        when(applicationRepository.findBySlug(UNKNOWN_APPLICATION_GID)).thenReturn(Flux.empty());
        when(applicationRepository.findByGid(APPLICATION_GID_WITHOUT_ID)).thenReturn(Flux.just(new Application()));
        // lenient: before NEW-78 the slug was asked first, so that this case fails on the verifications below
        lenient().when(applicationRepository.findBySlug(APPLICATION_GID_WITHOUT_ID)).thenReturn(Flux.empty());
        when(applicationRepository.findByGid(SLUG_WITHOUT_ID_GID)).thenReturn(Flux.empty());
        when(applicationRepository.findBySlug(SLUG_WITHOUT_ID_GID)).thenReturn(Flux.just(new Application()));
        for (String gid : List.of(UNKNOWN_APPLICATION_GID, APPLICATION_GID_WITHOUT_ID, SLUG_WITHOUT_ID_GID)) {
            StepVerifier.create(service.convertApplicationIdToObjectId(gid)).expectErrorSatisfies(error -> {
                System.out.println(TAG + "application gid " + gid + " -> " + error);
                assertTrue(error instanceof BizException, "BizException expected, was " + error);
                assertEquals(BizError.NO_RESOURCE_FOUND, ((BizException) error).getError());
                assertEquals(CANT_FIND_APPLICATION_KEY, ((BizException) error).getMessageKey());
                assertEquals(List.of(gid), List.of(((BizException) error).getArgs()));
            }).verify();
            InOrder order = inOrder(applicationRepository);
            order.verify(applicationRepository).findByGid(gid);
            if (APPLICATION_GID_WITHOUT_ID.equals(gid)) {
                verify(applicationRepository, never()).findBySlug(gid);
            } else {
                order.verify(applicationRepository).findBySlug(gid);
            }
        }
    }

    /** Catches (NEW-78): a slug two applications share answered with the first one instead of the refusal CANT_FIND_APPLICATION. */
    @Test
    public void anApplicationSlugTwoApplicationsShareIsRefusedNEW78() {
        lenient().when(applicationRepository.findById(SHARED_SLUG)).thenReturn(Mono.empty());
        when(applicationRepository.findBySlug(SHARED_SLUG)).thenReturn(Flux.just(application(REAL_ID), application(OTHER_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(SHARED_SLUG)).expectErrorSatisfies(error -> {
            System.out.println(TAG + "shared slug " + SHARED_SLUG + " -> " + error);
            assertTrue(error instanceof BizException, "BizException expected, was " + error);
            assertEquals(BizError.NO_RESOURCE_FOUND, ((BizException) error).getError());
            assertEquals(CANT_FIND_APPLICATION_KEY, ((BizException) error).getMessageKey());
            assertEquals(List.of(SHARED_SLUG), List.of(((BizException) error).getArgs()));
        }).verify();
    }

    /** Catches (NEW-78, NEW-86's rule): a blank application key looked up as a slug: it is answered as given and no repository is asked. */
    @ParameterizedTest(name = "key=[{0}]")
    @ValueSource(strings = {"", " ", "\t \n"})
    public void aBlankApplicationKeyIsNotLookedUpNEW78(String key) {
        // lenient: the fixed converter never asks; before it, the stub makes the slug lookup answer another application, so that
        // the case fails on the assertions below instead of on an unstubbed mock
        lenient().when(applicationRepository.findBySlug(key)).thenReturn(Flux.just(application(SLUG_DECOY_ID)));
        StepVerifier.create(service.convertApplicationIdToObjectId(key)).expectNext(key).verifyComplete();
        System.out.println(TAG + "application key [" + key + "] answered as given");
        verifyNoInteractions(applicationRepository);
    }

    /**
     * NEW-86: catches a blank organization key looked up as a slug: it is answered as given and no repository is asked.
     */
    @ParameterizedTest(name = "key=[{0}]")
    @ValueSource(strings = {"", " ", "\t \n"})
    public void aBlankOrganizationKeyIsNotLookedUpAsASlugNEW86(String key) {
        // lenient: the fixed converter never asks; before it, the stub makes the slug lookup answer no match, so that the
        // case fails on the assertions below instead of on an unstubbed mock
        lenient().when(organizationRepository.findBySlug(key)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(key)).expectNext(key).verifyComplete();
        System.out.println(TAG + "organization key [" + key + "] answered as given");
        verifyNoInteractions(organizationRepository);
    }

    @Test
    public void organizationSlugBeatsGidAndNonGidIdsFallBackToThemselves() {
        when(organizationRepository.findBySlug(SLUG)).thenReturn(Flux.just(organization(REAL_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(SLUG)).expectNext(REAL_ID).verifyComplete();
        verify(organizationRepository, never()).findByGid(SLUG);

        when(organizationRepository.findBySlug(GID)).thenReturn(Flux.empty());
        when(organizationRepository.findByGid(GID)).thenReturn(Flux.just(organization(OTHER_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(GID)).expectNext(OTHER_ID).verifyComplete();

        when(organizationRepository.findBySlug(OBJECT_ID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        verify(organizationRepository, never()).findByGid(OBJECT_ID);

        when(organizationRepository.findBySlug(UNKNOWN_ORGANIZATION_GID)).thenReturn(Flux.empty());
        when(organizationRepository.findByGid(UNKNOWN_ORGANIZATION_GID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(UNKNOWN_ORGANIZATION_GID)).expectErrorSatisfies(error -> {
            System.out.println(TAG + "organization gid " + UNKNOWN_ORGANIZATION_GID + " that names nothing -> " + error);
            assertTrue(error instanceof BizException, "BizException expected, was " + error);
            assertEquals(BizError.NOT_AUTHORIZED, ((BizException) error).getError());
        }).verify();
    }

    /** H1, NEW-132: the refusing organization converter passes a key that names an organization as the plain converter does. */
    @Test
    public void theRefusingOrganizationConverterPassesAKeyThatNamesAnOrganizationNEW132() {
        when(organizationRepository.findBySlug(SLUG)).thenReturn(Flux.just(organization(REAL_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(SLUG)).expectNext(REAL_ID).verifyComplete();

        when(organizationRepository.findBySlug(GID)).thenReturn(Flux.empty());
        when(organizationRepository.findByGid(GID)).thenReturn(Flux.just(organization(OTHER_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(GID)).expectNext(OTHER_ID).verifyComplete();

        when(organizationRepository.findBySlug(OBJECT_ID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        System.out.println(TAG + "refusing organization converter: slug " + SLUG + " -> " + REAL_ID + ", gid " + GID + " -> " + OTHER_ID
                + ", object id " + OBJECT_ID + " -> itself");
    }

    /** H2, NEW-132: a gid that names no organization is NOT_AUTHORIZED, the key without arguments; both lookups ran. */
    @Test
    public void theRefusingOrganizationConverterRefusesAGidThatNamesNothingNEW132() {
        when(organizationRepository.findBySlug(UNKNOWN_ORGANIZATION_GID)).thenReturn(Flux.empty());
        when(organizationRepository.findByGid(UNKNOWN_ORGANIZATION_GID)).thenReturn(Flux.empty());
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(UNKNOWN_ORGANIZATION_GID)).expectErrorSatisfies(error -> {
            System.out.println(TAG + "refusing organization converter, gid " + UNKNOWN_ORGANIZATION_GID + " -> " + error);
            assertTrue(error instanceof BizException, "BizException expected, was " + error);
            assertEquals(BizError.NOT_AUTHORIZED, ((BizException) error).getError());
            assertEquals(NOT_AUTHORIZED_KEY, ((BizException) error).getMessageKey());
            assertEquals(List.of(), List.of(((BizException) error).getArgs()));
        }).verify();
        verify(organizationRepository).findBySlug(UNKNOWN_ORGANIZATION_GID);
        verify(organizationRepository).findByGid(UNKNOWN_ORGANIZATION_GID);
    }

    /** H3, NEW-132: a blank key is answered as given and no repository is asked. */
    @ParameterizedTest(name = "key=[{0}]")
    @ValueSource(strings = {"", " ", "\t \n"})
    public void theRefusingOrganizationConverterPassesABlankKeyNEW132(String key) {
        // lenient: the converter never asks for a blank key; without its guard, the stub makes the slug lookup answer an
        // organization, so that the case fails on the assertions below instead of on an unstubbed mock
        lenient().when(organizationRepository.findBySlug(key)).thenReturn(Flux.just(organization(OTHER_ID)));
        StepVerifier.create(service.convertOrganizationIdToObjectIdOrRefuse(key)).expectNext(key).verifyComplete();
        System.out.println(TAG + "refusing organization converter, blank key [" + key + "] answered as given");
        verifyNoInteractions(organizationRepository);
    }

    /**
     * Catches (NEW-78): an application slug match without an id (found after the object id or gid found nothing) is no match:
     * a key with a hyphen is then the NEW-30 error, a key without one is answered as given.
     */
    @Test
    public void anApplicationSlugMatchWithoutAnIdIsNoMatchNEW78() {
        // lenient: the id lookup of a key without a hyphen is not asked before NEW-78
        lenient().when(applicationRepository.findById(OBJECT_ID)).thenReturn(Mono.empty());
        when(applicationRepository.findByGid(GID)).thenReturn(Flux.empty());
        when(applicationRepository.findBySlug(GID)).thenReturn(Flux.just(new Application()));
        StepVerifier.create(service.convertApplicationIdToObjectId(GID)).expectErrorSatisfies(error -> {
            assertTrue(error instanceof BizException, "BizException expected, was " + error);
            assertEquals(CANT_FIND_APPLICATION_KEY, ((BizException) error).getMessageKey());
            assertEquals(List.of(GID), List.of(((BizException) error).getArgs()));
        }).verify();

        when(applicationRepository.findBySlug(OBJECT_ID)).thenReturn(Flux.just(new Application()));
        StepVerifier.create(service.convertApplicationIdToObjectId(OBJECT_ID)).expectNext(OBJECT_ID).verifyComplete();
        verify(applicationRepository, never()).findByGid(OBJECT_ID);
        System.out.println(TAG + "slug match without an id: gid " + GID + " -> NEW-30 error, object id " + OBJECT_ID + " -> itself");
    }

    // ---- folder: the one converter that returns an Optional

    /** A known gid, an object id and no id (the root folder) are answered as an Optional. */
    @Test
    public void folderConverterReturnsAnOptionalForAKnownGidAnObjectIdAndNoId() {
        StepVerifier.create(service.convertFolderIdToObjectId(OBJECT_ID)).expectNext(Optional.of(OBJECT_ID)).verifyComplete();
        StepVerifier.create(service.convertFolderIdToObjectId(null)).expectNext(Optional.empty()).verifyComplete();
        when(folderRepository.findByGid(GID)).thenReturn(Flux.just(withId(new Folder(), REAL_ID)));
        StepVerifier.create(service.convertFolderIdToObjectId(GID)).expectNext(Optional.of(REAL_ID)).verifyComplete();
    }

    /**
     * BF-152, BF-158, BF-159 (fixed; the L1-13 pin answered Optional.empty(), the root folder, for both): a gid that no folder
     * has, and a gid whose folder has no id, are the error FOLDER_NOT_EXIST naming the gid.
     */
    @Test
    public void folderConverterRefusesAGidThatNamesNoFolderBF152() {
        when(folderRepository.findByGid(UNKNOWN_FOLDER_GID)).thenReturn(Flux.empty());
        when(folderRepository.findByGid(FOLDER_GID_WITHOUT_ID)).thenReturn(Flux.just(new Folder()));
        for (String gid : List.of(UNKNOWN_FOLDER_GID, FOLDER_GID_WITHOUT_ID)) {
            StepVerifier.create(service.convertFolderIdToObjectId(gid)).expectErrorSatisfies(error -> {
                System.out.println(TAG + "folder gid " + gid + " -> " + error);
                assertTrue(error instanceof BizException, "BizException expected, was " + error);
                assertEquals(BizError.FOLDER_NOT_EXIST, ((BizException) error).getError());
                assertEquals(FOLDER_NOT_EXIST_KEY, ((BizException) error).getMessageKey());
                assertEquals(List.of(gid), List.of(((BizException) error).getArgs()));
            }).verify();
        }
    }

    @Test
    public void anObjectIdWithoutAHyphenIsNeverTreatedAsAGid() {
        for (String id : List.of(OBJECT_ID, "abc", "with space", "under_score")) {
            StepVerifier.create(service.convertBundleIdToObjectId(id)).expectNext(id).verifyComplete();
        }
        verifyNoInteractions(bundleRepository);
    }
}
