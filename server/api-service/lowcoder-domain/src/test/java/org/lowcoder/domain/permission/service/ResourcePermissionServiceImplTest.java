package org.lowcoder.domain.permission.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourceType;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * The four {@code removeUser*Permission} methods of {@link ResourcePermissionServiceImpl} (D-59: the data source one
 * used to call {@code repository.removePermissionBy} with {@code ResourceType.APPLICATION}, a copy-paste of the
 * application method; D-60: folders and bundles had no removal method at all). Each is a one-liner to
 * {@code repository.removePermissionBy}; the resource id and the user id are different strings so a swapped argument
 * fails.
 */
class ResourcePermissionServiceImplTest {

    private static final String LOG_PREFIX = "[ResourcePermissionServiceImplTest] ";
    private static final String RESOURCE_ID = "resource-1";
    private static final String USER_ID = "user-1";

    private final ResourcePermissionRepository repository = mock(ResourcePermissionRepository.class);
    private final ResourcePermissionServiceImpl service = new ResourcePermissionServiceImpl(repository,
            mock(ResourcePermissionHandlerService.class), mock(ResourcePermissionHandlerService.class), mock(ResourcePermissionHandlerService.class));

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    @Test
    void removeUserApplicationPermission_removesByApplicationTypeExactly() {
        when(repository.removePermissionBy(ResourceType.APPLICATION, RESOURCE_ID, ResourceHolder.USER, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.removeUserApplicationPermission(RESOURCE_ID, USER_ID)).expectNext(true).verifyComplete();

        verify(repository).removePermissionBy(ResourceType.APPLICATION, RESOURCE_ID, ResourceHolder.USER, USER_ID);
        verifyNoMoreInteractions(repository);
        say("removeUserApplicationPermission(%s, %s) -> removePermissionBy(APPLICATION, %s, USER, %s)", RESOURCE_ID, USER_ID, RESOURCE_ID, USER_ID);
    }

    @Test
    void removeUserDatasourcePermission_removesByDatasourceTypeExactly_notApplicationD59() {
        when(repository.removePermissionBy(ResourceType.DATASOURCE, RESOURCE_ID, ResourceHolder.USER, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.removeUserDatasourcePermission(RESOURCE_ID, USER_ID)).expectNext(true).verifyComplete();

        verify(repository).removePermissionBy(ResourceType.DATASOURCE, RESOURCE_ID, ResourceHolder.USER, USER_ID);
        verifyNoMoreInteractions(repository);
        say("removeUserDatasourcePermission(%s, %s) -> removePermissionBy(DATASOURCE, %s, USER, %s), D-59",
                RESOURCE_ID, USER_ID, RESOURCE_ID, USER_ID);
    }

    @Test
    void removeUserFolderPermission_removesByFolderTypeExactlyD60() {
        when(repository.removePermissionBy(ResourceType.FOLDER, RESOURCE_ID, ResourceHolder.USER, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.removeUserFolderPermission(RESOURCE_ID, USER_ID)).expectNext(true).verifyComplete();

        verify(repository).removePermissionBy(ResourceType.FOLDER, RESOURCE_ID, ResourceHolder.USER, USER_ID);
        verifyNoMoreInteractions(repository);
        say("removeUserFolderPermission(%s, %s) -> removePermissionBy(FOLDER, %s, USER, %s), D-60", RESOURCE_ID, USER_ID, RESOURCE_ID, USER_ID);
    }

    @Test
    void removeUserBundlePermission_removesByBundleTypeExactlyD60() {
        when(repository.removePermissionBy(ResourceType.BUNDLE, RESOURCE_ID, ResourceHolder.USER, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.removeUserBundlePermission(RESOURCE_ID, USER_ID)).expectNext(true).verifyComplete();

        verify(repository).removePermissionBy(ResourceType.BUNDLE, RESOURCE_ID, ResourceHolder.USER, USER_ID);
        verifyNoMoreInteractions(repository);
        say("removeUserBundlePermission(%s, %s) -> removePermissionBy(BUNDLE, %s, USER, %s), D-60", RESOURCE_ID, USER_ID, RESOURCE_ID, USER_ID);
    }
}
