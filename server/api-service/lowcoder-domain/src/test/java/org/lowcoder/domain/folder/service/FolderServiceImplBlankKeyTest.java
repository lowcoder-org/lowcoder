package org.lowcoder.domain.folder.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * NEW-106: {@code FolderServiceImpl.findByIds} drops blank keys (null, empty, whitespace) before any query: a null first key
 * used to fail the call with a NullPointerException (and with it the whole meta answer), and the kind of the lookup (gid or
 * object id) is taken from the first kept key. The repository is a mock that answers empty for every query it is not told
 * about, so a mutation that reaches it fails on an assertion, never on a NullPointerException of an unstubbed mock.
 * Limits: a null collection fails as before; a list mixing kinds misses the folders of the other kind, as before.
 */
class FolderServiceImplBlankKeyTest {

    private static final String LOG_PREFIX = "[FolderServiceImplBlankKeyTest] ";
    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String NULL_KEY = null;
    private static final String EMPTY_KEY = "";
    private static final String WHITESPACE_KEY = " ";
    private static final String MIXED_WHITESPACE_KEY = "\t \n";
    private static final String FOLDER_ID = "0123456789abcdef01234567";
    private static final String FOLDER_GID = "folder-gid-0001";

    private final FolderRepository repository = mock(FolderRepository.class, invocation -> {
        if (Flux.class.equals(invocation.getMethod().getReturnType())) {
            return Flux.empty();
        }
        if (Mono.class.equals(invocation.getMethod().getReturnType())) {
            return Mono.empty();
        }
        return null;
    });
    private final FolderServiceImpl service = new FolderServiceImpl(repository, mock(MongoUpsertHelper.class));

    private static Folder folder(String id) {
        Folder folder = new Folder();
        folder.setId(id);
        return folder;
    }

    /** The failure of the call and of its subscription (null if none) and the ids answered. */
    private record Outcome(Throwable failure, List<String> ids) {
    }

    private Outcome run(Collection<String> keys) {
        List<String>[] answer = new List[1];
        Throwable failure = catchThrowable(() -> answer[0] = service.findByIds(keys).map(Folder::getId).collectList().block(TIMEOUT));
        System.out.println(LOG_PREFIX + "findByIds(" + keys + ") -> failure " + failure + ", ids " + answer[0]);
        return new Outcome(failure, answer[0]);
    }

    @Test
    void findByIdsWithOnlyBlankKeysAsksNoQueryNEW106() {
        Outcome outcome = run(Arrays.asList(NULL_KEY, EMPTY_KEY, WHITESPACE_KEY, MIXED_WHITESPACE_KEY));

        assertThat(outcome.failure()).as("failure of findByIds").isNull();
        assertThat(outcome.ids()).as("ids answered").isEmpty();
        verifyNoInteractions(repository);
    }

    @Test
    @SuppressWarnings("unchecked")
    void findByIdsDropsBlankKeysBeforeItsQueryNEW106() {
        when(repository.findAllById(any(Iterable.class))).thenReturn(Flux.just(folder(FOLDER_ID)));

        Outcome outcome = run(Arrays.asList(NULL_KEY, FOLDER_ID, WHITESPACE_KEY));

        assertThat(outcome.failure()).as("failure of findByIds").isNull();
        assertThat(outcome.ids()).as("ids answered").containsExactly(FOLDER_ID);
        ArgumentCaptor<Iterable<String>> keys = ArgumentCaptor.forClass(Iterable.class);
        verify(repository).findAllById(keys.capture());
        System.out.println(LOG_PREFIX + "findAllById received " + keys.getValue());
        assertThat(keys.getValue()).as("keys sent to findAllById").containsExactly(FOLDER_ID);
    }

    @Test
    void findByIdsTakesTheKindOfTheFirstKeptKeyNEW106() {
        when(repository.findByGidIn(any())).thenReturn(Flux.just(folder(FOLDER_ID)));

        Outcome outcome = run(Arrays.asList(NULL_KEY, FOLDER_GID));

        assertThat(outcome.failure()).as("failure of findByIds").isNull();
        assertThat(outcome.ids()).as("ids answered").containsExactly(FOLDER_ID);
        ArgumentCaptor<Collection<String>> keys = ArgumentCaptor.forClass(Collection.class);
        verify(repository).findByGidIn(keys.capture());
        System.out.println(LOG_PREFIX + "findByGidIn received " + keys.getValue());
        assertThat(keys.getValue()).as("keys sent to findByGidIn").containsExactly(FOLDER_GID);
        verify(repository, never()).findAllById(any(Iterable.class));
    }
}
