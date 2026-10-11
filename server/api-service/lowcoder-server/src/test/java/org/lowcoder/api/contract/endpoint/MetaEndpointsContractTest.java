package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.MetaSamples;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.meta.MetaController;
import org.lowcoder.api.meta.MetaEndpoints;
import org.lowcoder.api.meta.MetaEndpoints.GetMetaDataRequest;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.bundle.service.BundleServiceImpl;
import org.lowcoder.domain.datasource.service.impl.DatasourceServiceImpl;
import org.lowcoder.domain.folder.service.FolderServiceImpl;
import org.lowcoder.domain.group.service.GroupServiceImpl;
import org.lowcoder.domain.organization.service.OrganizationServiceImpl;
import org.lowcoder.domain.query.service.LibraryQueryServiceImpl;
import org.lowcoder.domain.user.service.UserServiceImpl;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.function.Function;

import static org.mockito.ArgumentMatchers.anyString;

/**
 * Codec-level test of {@link MetaEndpoints#getMetaData} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), through the
 * production {@link MetaController} with its eight services mocked. The D1 body's eight id lists reach the services;
 * each answers the two entities that {@link MetaSamples} builds from the same prefixes as the views of the
 * {@link MetaView} sample, so the view the controller assembles must be its S1 golden. Applications have no published
 * record, so their title, description, category and icon come from the editing DSL's settings.
 *
 * <p>Stubbing group (registry column {@code group}): {@code assembling}; the controller builds every view.
 */
class MetaEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(MetaEndpoints.class);

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(MetaEndpointsContractTest.class);
    }

    @Test
    void getMetaData() {
        GetMetaDataRequest request = (GetMetaDataRequest) PayloadSamples.of(GetMetaDataRequest.class).value();
        ContractTestClient.Builder builder = ContractTestClient.builder();
        Mockito.when(builder.mock(ApplicationServiceImpl.class).findByIdIn(request.appIds())).thenReturn(entities(MetaSamples.APPS, MetaSamples::application));
        Mockito.when(builder.mock(ApplicationRecordService.class).getLatestRecordByApplicationId(anyString())).thenReturn(Mono.empty());
        Mockito.when(builder.mock(UserServiceImpl.class).getByIds(request.userIds())).thenReturn(Mono.just(MetaSamples.usersById(MetaSamples.USERS)));
        Mockito.when(builder.mock(OrganizationServiceImpl.class).getByIds(request.orgIds())).thenReturn(entities(MetaSamples.ORGS, MetaSamples::organization));
        Mockito.when(builder.mock(FolderServiceImpl.class).findByIds(request.folderIds())).thenReturn(entities(MetaSamples.FOLDERS, MetaSamples::folder));
        Mockito.when(builder.mock(DatasourceServiceImpl.class).getByIds(request.datasourceIds()))
                .thenReturn(entities(MetaSamples.DATASOURCES, MetaSamples::datasource));
        Mockito.when(builder.mock(BundleServiceImpl.class).findByIdIn(request.bundleIds())).thenReturn(entities(MetaSamples.BUNDLES, MetaSamples::bundle));
        Mockito.when(builder.mock(GroupServiceImpl.class).getByIds(request.groupIds())).thenReturn(entities(MetaSamples.GROUPS, MetaSamples::group));
        Mockito.when(builder.mock(LibraryQueryServiceImpl.class).getByIds(request.libraryQueryIds()))
                .thenReturn(entities(MetaSamples.QUERIES, MetaSamples::libraryQuery));
        try (ContractTestClient client = builder.controllerWithMockedDependencies(MetaController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getMetaData", Map.of(), EndpointContract.d1(GetMetaDataRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(MetaView.class)));
        }
    }

    private static <T> Flux<T> entities(String list, Function<String, T> factory) {
        return Flux.fromIterable(MetaSamples.prefixes(list)).map(factory);
    }
}
