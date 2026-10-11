package org.lowcoder.runner.migrations.job;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationService;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit K3 (task L2-12, lane L5): {@code AddPtmFieldsJobImpl}, the job behind changeset 021 ({@code add-ptm-fields-to-applications}):
 * every application is read, the three flags {@code publicToAll}, {@code publicToMarketplace} and {@code agencyProfile} that are
 * missing or false are set to {@code false}, and every application is written back with its id. Mockito only.
 *
 * <p>Limits: the flags are read from the objects' fields by reflection (the getters map a null to false, which would hide the
 * difference this job makes).
 */
@ExtendWith(MockitoExtension.class)
public class MigrationJobAddPtmFieldsTest {

    static final String TAG = "[MigrationJobAddPtmFieldsTest] ";

    @Mock
    private ApplicationService applicationService;
    @InjectMocks
    private AddPtmFieldsJobImpl job;

    private static Application application(String id, Boolean publicToAll, Boolean publicToMarketplace, Boolean agencyProfile) {
        Application application = new Application();
        ReflectionTestUtils.setField(application, "id", id);
        application.setPublicToAll(publicToAll);
        application.setPublicToMarketplace(publicToMarketplace);
        application.setAgencyProfile(agencyProfile);
        return application;
    }

    private static Object flag(Application application, String name) {
        return ReflectionTestUtils.getField(application, name);
    }

    @Test
    public void injectionReachedTheService() {
        assertSame(applicationService, ReflectionTestUtils.getField(job, "applicationService"));
    }

    @Test
    public void missingFlagsBecomeFalseAndTrueFlagsStayTrueAndEveryApplicationIsWrittenBackOnce() {
        Application missing = application("a1", null, null, null);
        Application allTrue = application("a2", true, true, true);
        Application mixed = application("a3", true, null, false);
        when(applicationService.findAll()).thenReturn(Flux.just(missing, allTrue, mixed));
        when(applicationService.updateById(anyString(), any(Application.class))).thenReturn(Mono.just(true));

        job.migrateApplicationsToInitPtmFields();

        for (String name : List.of("publicToAll", "publicToMarketplace", "agencyProfile")) {
            System.out.println(TAG + name + ": " + flag(missing, name) + ", " + flag(allTrue, name) + ", " + flag(mixed, name));
            assertEquals(Boolean.FALSE, flag(missing, name), "a missing " + name + " is initialised to false (not left null)");
            assertEquals(Boolean.TRUE, flag(allTrue, name), "a true " + name + " stays true");
        }
        assertEquals(Boolean.TRUE, flag(mixed, "publicToAll"));
        assertEquals(Boolean.FALSE, flag(mixed, "publicToMarketplace"));
        assertEquals(Boolean.FALSE, flag(mixed, "agencyProfile"));
        ArgumentCaptor<String> ids = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Application> written = ArgumentCaptor.forClass(Application.class);
        verify(applicationService, times(3)).updateById(ids.capture(), written.capture());
        assertEquals(List.of("a1", "a2", "a3"), ids.getAllValues());
        assertSame(missing, written.getAllValues().get(0));
        assertSame(allTrue, written.getAllValues().get(1));
        assertSame(mixed, written.getAllValues().get(2));
    }

    @Test
    public void noApplicationMeansNoUpdate() {
        when(applicationService.findAll()).thenReturn(Flux.empty());
        job.migrateApplicationsToInitPtmFields();
        verify(applicationService, never()).updateById(anyString(), any(Application.class));
    }
}
