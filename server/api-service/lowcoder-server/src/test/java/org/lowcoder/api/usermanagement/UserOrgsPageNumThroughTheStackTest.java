package org.lowcoder.api.usermanagement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * {@code GET /api/users/myorg} with a {@code pageNum} below 1, through the real {@link UserController} over the production
 * codecs and exception handling of {@link ContractTestClient}.
 *
 * <p>The page number went unchecked into {@code PageRequest.of(pageNum - 1, ...)}, which throws for a negative page
 * index: a raw HTTP 500 with code {@code INTERNAL_SERVER_ERROR} (5000). The route now refuses a page below 1 the way
 * every other paged route does ({@code Pagination.check()}): {@code INVALID_PARAMETER} (HTTP 500, code 5002) with the
 * message "Invalid page number.". The service behind it is a mock.
 *
 * <p>Limits: the page size is not checked (a size of 0 or less is still a raw 500 from {@code PageRequest.of}); only this
 * route is covered here, {@code GroupApiServiceImplTest} covers the group route.
 */
class UserOrgsPageNumThroughTheStackTest {

    private static final String TAG = "[UserOrgsPageNumThroughTheStackTest] ";
    private static final String MY_ORGS_URL = NewUrl.USER_URL + "/myorg";
    private static final String PAGE_NUM = "pageNum";
    private static final String PAGE_SIZE = "pageSize";
    private static final String VISITOR_ID = "visitor-1";
    private static final String ORG_ID = "org-1";
    private static final int ZERO_PAGE = 0;
    private static final int NEGATIVE_PAGE = -3;
    private static final int FIRST_PAGE = 1;
    private static final int PAGE_SIZE_VALUE = 10;
    private static final long ORG_TOTAL = 0;
    /** {@code ILLEGAL_PAGE_NUMBER} in {@code locale_en.properties}. */
    private static final String INVALID_PAGE_NUMBER_MESSAGE = "Invalid page number.";
    private static final int SUCCESS_CODE = 1;
    private static final ObjectMapper JSON = JsonMapper.builderWithJackson2Defaults().build();

    private ContractTestClient client;

    @BeforeEach
    void wire() {
        User visitor = new User();
        visitor.setId(VISITOR_ID);
        OrgMember orgMember = new OrgMember(ORG_ID, VISITOR_ID, MemberRole.MEMBER, "NORMAL", 0L);
        ContractTestClient.Builder builder = ContractTestClient.builder().visitor(VISITOR_ID, orgMember);
        SessionUserService sessionUserService = builder.mock(SessionUserService.class);
        Mockito.when(sessionUserService.getVisitor()).thenReturn(Mono.just(visitor));
        Mockito.when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember));
        OrganizationService organizationService = builder.mock(OrganizationService.class);
        Mockito.when(organizationService.findUserOrgs(Mockito.eq(VISITOR_ID), Mockito.anyString(), Mockito.any())).thenReturn(Flux.empty());
        Mockito.when(organizationService.countUserOrgs(Mockito.eq(VISITOR_ID), Mockito.anyString())).thenReturn(Mono.just(ORG_TOTAL));
        client = builder.controllerWithMockedDependencies(UserController.class).build();
    }

    @AfterEach
    void close() {
        client.close();
    }

    private JsonNode get(int pageNum, HttpStatus expectedStatus) {
        EntityExchangeResult<byte[]> result = client.web().get()
                .uri(uri -> uri.path(MY_ORGS_URL).queryParam(PAGE_NUM, pageNum).queryParam(PAGE_SIZE, PAGE_SIZE_VALUE).build())
                .exchange().expectStatus().isEqualTo(expectedStatus)
                .expectBody().returnResult();
        try {
            JsonNode body = JSON.readTree(result.getResponseBody());
            System.out.println(TAG + "GET " + MY_ORGS_URL + " " + PAGE_NUM + "=" + pageNum + " -> " + result.getStatus() + " " + body);
            return body;
        } catch (JacksonException e) {
            throw new IllegalStateException("response is not JSON", e);
        }
    }

    private static void assertInvalidPageNumber(JsonNode body) {
        assertEquals(BizError.INVALID_PARAMETER.getBizErrorCode(), body.get("code").asInt());
        assertEquals(INVALID_PAGE_NUMBER_MESSAGE, body.get("message").asString());
        assertTrue(body.get("data") == null || body.get("data").isNull());
    }

    @Test
    void pageNumZeroIsAnInvalidPageNumber() {
        assertInvalidPageNumber(get(ZERO_PAGE, HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @Test
    void aNegativePageNumIsTheSameInvalidPageNumber() {
        assertInvalidPageNumber(get(NEGATIVE_PAGE, HttpStatus.INTERNAL_SERVER_ERROR));
    }

    /** Control: the first page is answered. */
    @Test
    void theFirstPageIsAnswered() {
        JsonNode body = get(FIRST_PAGE, HttpStatus.OK);

        assertEquals(SUCCESS_CODE, body.get("code").asInt());
    }
}
