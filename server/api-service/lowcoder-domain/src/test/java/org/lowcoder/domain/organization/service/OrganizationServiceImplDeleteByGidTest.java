package org.lowcoder.domain.organization.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.asset.service.AssetRepository;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.event.OrgDeletedEvent;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.birelation.BiRelationService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.query.Query;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * NEW-41 without a database: {@code OrganizationServiceImpl.delete} resolves a gid to the object id of the first org the
 * repository's gid read returns, then updates that object id and publishes it, and a failing read fails the delete before
 * the update. The read and the update are not atomic; these cases show that the update takes the read's object id, they do
 * not simulate a change between the two. The repository, the upsert helper and the event publisher are mocks;
 * the service's other collaborators are mocks that {@code delete} does not use.
 */
class OrganizationServiceImplDeleteByGidTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String LOG_PREFIX = "[OrganizationServiceImplDeleteByGidTest] ";
    /** The gid the delete names and the object id of the org the read answers for it. */
    static final String GID = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
    static final String OBJECT_ID = "6ad4e55647ea93228f5557cc";
    /** The failure the gid read answers in the failing-read case. */
    static final IllegalStateException READ_FAILURE = new IllegalStateException("gid read failed");
    /** The names of the update query's keys. */
    static final String ID_KEY = "id";
    static final String GID_KEY = "gid";

    private final OrganizationRepository repository = mock(OrganizationRepository.class);
    private final MongoUpsertHelper mongoUpsertHelper = mock(MongoUpsertHelper.class);
    private final ApplicationContext applicationContext = mock(ApplicationContext.class);
    private final OrganizationServiceImpl service = new OrganizationServiceImpl(mock(UserRepository.class), mock(AssetRepository.class),
            mock(AssetService.class), mock(OrgMemberService.class), mongoUpsertHelper, repository, mock(GroupService.class),
            applicationContext, mock(CommonConfig.class), mock(ConfigCenter.class), mock(BiRelationService.class));

    private static Organization org(String objectId) {
        Organization org = Organization.builder().gid(GID).state(OrganizationState.ACTIVE).build();
        org.setId(objectId);
        return org;
    }

    @Test
    void aDeleteByGidUpdatesAndPublishesTheObjectIdTheReadReturnedNEW41() {
        when(repository.findByGid(GID)).thenReturn(Flux.just(org(OBJECT_ID)));
        assertDeleteUpdatesAndPublishes(OBJECT_ID);
    }

    /**
     * NEW-41: a gid read that fails fails the delete with its error, before any update and without an event. The update is
     * stubbed as in the other case, so that a delete that skips the read answers true instead of failing on a null.
     */
    @Test
    void aFailingGidReadFailsTheDeleteBeforeAnyUpdateNEW41() {
        when(repository.findByGid(GID)).thenReturn(Flux.error(READ_FAILURE));
        stubTheUpdateAsAChange();
        System.out.println(LOG_PREFIX + "deleting the gid " + GID + " with a read that fails with " + READ_FAILURE);

        Throwable thrown = catchThrowable(() -> service.delete(GID).block(TIMEOUT));

        System.out.println(LOG_PREFIX + "the delete failed with " + thrown);
        assertThat(thrown).isSameAs(READ_FAILURE);
        verify(mongoUpsertHelper, never()).update(any(Organization.class), any(Query.class));
        verify(applicationContext, never()).publishEvent(any(Object.class));
    }

    private void stubTheUpdateAsAChange() {
        when(mongoUpsertHelper.update(any(Organization.class), any(Query.class))).thenReturn(Mono.just(Boolean.TRUE));
    }

    private void assertDeleteUpdatesAndPublishes(String expectedObjectId) {
        stubTheUpdateAsAChange();
        System.out.println(LOG_PREFIX + "deleting the gid " + GID + ", expecting the object id " + expectedObjectId);

        Boolean answer = service.delete(GID).block(TIMEOUT);

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongoUpsertHelper).update(any(Organization.class), query.capture());
        Document criteria = query.getValue().getQueryObject();
        System.out.println(LOG_PREFIX + "answer " + answer + ", update query " + criteria);
        assertThat(answer).isTrue();
        assertThat(criteria.get(ID_KEY)).isEqualTo(expectedObjectId);
        assertThat(criteria).doesNotContainKey(GID_KEY);
        ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
        verify(applicationContext).publishEvent(event.capture());
        String eventOrgId = event.getValue() instanceof OrgDeletedEvent deleted ? deleted.getOrgId() : null;
        System.out.println(LOG_PREFIX + "event org id " + eventOrgId);
        assertThat(event.getValue()).isInstanceOf(OrgDeletedEvent.class);
        assertThat(eventOrgId).isEqualTo(expectedObjectId);
    }
}
