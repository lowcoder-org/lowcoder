package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.framework.IndexController;
import org.lowcoder.api.framework.view.ResponseView;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;

import java.util.Map;

/**
 * Codec-level test of {@link IndexController#index} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T7.1), the only endpoint
 * declared on a controller without a class-level mapping ({@code GET /}). It answers
 * {@code ResponseView.error(ResponseView.SUCCESS, message)}: the error envelope without data, whose computed
 * {@code success} is {@code true} because its code is the success code.
 *
 * <p>Stubbing group (registry column {@code group}): {@code pass-through}; the controller has no collaborator.
 */
class IndexControllerContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(IndexController.class);
    /** {@code IndexController#index}'s message, spelled as in production. */
    static final String MESSAGE = "Lowcoder API is up and runnig";

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(IndexControllerContractTest.class);
    }

    @Test
    void index() {
        try (ContractTestClient client = ContractTestClient.builder().controllerWithMockedDependencies(IndexController.class).build()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "index", Map.of(), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.error(ResponseView.SUCCESS, MESSAGE));
        }
    }
}
