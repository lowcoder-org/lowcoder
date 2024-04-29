package org.lowcoder.api.service.impl;

import com.google.common.collect.ImmutableMap;
import lombok.extern.slf4j.Slf4j;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.service.ApplicationHistorySnapshotService;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.test.StepVerifier;

import static org.junit.Assert.*;

@SuppressWarnings({"ReactiveStreamsNullableInLambdaInTransform"})
@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class ApplicationHistorySnapshotServiceTest {

    @Autowired
    private ApplicationHistorySnapshotService service;

    @Test
    @Ignore("Disabled until it is fixed")
    public void testServiceMethods() {

        String applicationId = "123123";
        StepVerifier.create(service.createHistorySnapshot(applicationId, ImmutableMap.of("dsl", "dsl1"),
                        ImmutableMap.of("context", "context1"), "user1"))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(service.createHistorySnapshot(applicationId, ImmutableMap.of("dsl", "dsl2"),
                        ImmutableMap.of("context", "context2"), "user2"))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(service.countByApplicationId(applicationId))
                .expectNext(2L)
                .verifyComplete();


        StepVerifier.create(service.listAllHistorySnapshotBriefInfo(applicationId, PageRequest.of(0, 5)))
                .assertNext(list -> {
                    assertEquals(2, list.size());

                    ApplicationHistorySnapshot first = list.get(0);
                    ApplicationHistorySnapshot second = list.get(1);
                    assertTrue(first.getCreatedAt().isAfter(second.getCreatedAt()));

                    assertNull(first.getDsl());
                    assertEquals(ImmutableMap.of("context", "context2"), first.getContext());
                    assertEquals(applicationId, first.getApplicationId());

                    assertNull(second.getDsl());
                    assertEquals(ImmutableMap.of("context", "context1"), second.getContext());
                    assertEquals(applicationId, second.getApplicationId());


                })
                .verifyComplete();

        StepVerifier.create(service.listAllHistorySnapshotBriefInfo(applicationId, PageRequest.of(1, 1)))
                .assertNext(list -> {
                    assertEquals(1, list.size());
                    ApplicationHistorySnapshot one = list.get(0);
                    assertNull(one.getDsl());
                    assertEquals(ImmutableMap.of("context", "context1"), one.getContext());
                    assertEquals(applicationId, one.getApplicationId());
                })
                .verifyComplete();


        StepVerifier.create(service.listAllHistorySnapshotBriefInfo(applicationId, PageRequest.of(0, 5))
                        .map(it -> it.get(0))
                        .map(HasIdAndAuditing::getId)
                        .flatMap(id -> service.getHistorySnapshotDetail(id)))
                .assertNext(snapshot -> {
                    assertEquals(ImmutableMap.of("dsl", "dsl2"), snapshot.getDsl());
                    assertEquals(ImmutableMap.of("context", "context2"), snapshot.getContext());
                })
                .verifyComplete();

    }
}
