package org.lowcoder.domain.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.repository.ApplicationHistoryArchivedSnapshotRepository;
import org.lowcoder.domain.application.repository.ApplicationHistorySnapshotRepository;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Mono;

/**
 * D-31: {@code createHistorySnapshot} stores the given id as the object id it is, and marks the stored row with
 * {@code applicationIdResolved = true} so the DSL routes can later tell it apart from a snapshot stored before this
 * fix. The caller (the controller's {@code editableApplication}) is the one that resolved the key and checked EDIT on
 * it; this service only writes what it is given.
 */
class ApplicationHistorySnapshotServiceImplTest {

    @Test
    void createHistorySnapshotStoresTheGivenObjectIdAndMarksIt() {
        ApplicationHistorySnapshotRepository repository = mock(ApplicationHistorySnapshotRepository.class);
        ApplicationHistoryArchivedSnapshotRepository repositoryArchived = mock(ApplicationHistoryArchivedSnapshotRepository.class);
        ApplicationHistorySnapshotServiceImpl service = new ApplicationHistorySnapshotServiceImpl(repository, repositoryArchived);
        when(repository.save(any(ApplicationHistorySnapshot.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        Map<String, Object> dsl = Map.of("dsl", "d");
        Map<String, Object> context = Map.of("context", "c");

        Boolean result = service.createHistorySnapshot("app-object-id", dsl, context, "user-id").block(Duration.ofSeconds(5));

        assertThat(result).isTrue();
        ArgumentCaptor<ApplicationHistorySnapshot> captor = ArgumentCaptor.forClass(ApplicationHistorySnapshot.class);
        verify(repository).save(captor.capture());
        ApplicationHistorySnapshot snapshot = captor.getValue();
        System.out.println("[ApplicationHistorySnapshotServiceImplTest] stored: " + snapshot);
        assertThat(snapshot.getApplicationId()).isEqualTo("app-object-id");
        assertThat(snapshot.getApplicationIdResolved()).isEqualTo(Boolean.TRUE);
        assertThat(snapshot.getDsl()).isEqualTo(dsl);
        assertThat(snapshot.getContext()).isEqualTo(context);
        verifyNoInteractions(repositoryArchived);
    }
}
