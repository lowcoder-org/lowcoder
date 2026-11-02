package org.lowcoder.domain.organization.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.asset.service.AssetRepository;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.birelation.BiRelationService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationContext;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * NEW-43 without a database: {@code OrganizationServiceImpl.getById}, {@code getByIdWithDeleted} and
 * {@code getOrgCommonSettings} refuse a blank key (null, empty, only whitespace) with UNABLE_TO_FIND_VALID_ORG and the key
 * INVALID_ORG_ID before any query: the organization repository, a mock, is not touched. One invocation per lookup and key, so
 * that a lookup's refusal is checked whatever the other two do. The service's other collaborators are mocks that these
 * lookups do not use. What the real queries answer for such a key is
 * {@code OrganizationServiceImplMongoTest}'s.
 */
class OrganizationServiceImplBlankKeyTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String LOG_PREFIX = "[OrganizationServiceImplBlankKeyTest] ";
    /** The blank keys: none, empty, one space, and other whitespace (a tab, a space, a newline). */
    static final String NULL_KEY = null;
    static final String EMPTY_KEY = "";
    static final String WHITESPACE_KEY = " ";
    static final String MIXED_WHITESPACE_KEY = "\t \n";
    /** The message key of the refusal. */
    static final String INVALID_ORG_ID_KEY = "INVALID_ORG_ID";
    /** The three lookups, by name. */
    static final String GET_BY_ID = "getById";
    static final String GET_BY_ID_WITH_DELETED = "getByIdWithDeleted";
    static final String GET_ORG_COMMON_SETTINGS = "getOrgCommonSettings";

    private final OrganizationRepository repository = mock(OrganizationRepository.class);
    private final OrganizationServiceImpl service = new OrganizationServiceImpl(mock(UserRepository.class), mock(AssetRepository.class),
            mock(AssetService.class), mock(OrgMemberService.class), mock(MongoUpsertHelper.class), repository, mock(GroupService.class),
            mock(ApplicationContext.class), mock(CommonConfig.class), mock(ConfigCenter.class), mock(BiRelationService.class));

    private final Map<String, Function<String, Mono<?>>> lookups = Map.of(GET_BY_ID, service::getById,
            GET_BY_ID_WITH_DELETED, service::getByIdWithDeleted, GET_ORG_COMMON_SETTINGS, service::getOrgCommonSettings);

    /** Every lookup with every blank key, the lookups in the order of the class's javadoc. */
    static Stream<Arguments> lookupsAndBlankKeys() {
        return Stream.of(GET_BY_ID, GET_BY_ID_WITH_DELETED, GET_ORG_COMMON_SETTINGS)
                .flatMap(lookup -> Stream.of(NULL_KEY, EMPTY_KEY, WHITESPACE_KEY, MIXED_WHITESPACE_KEY).map(key -> Arguments.of(lookup, key)));
    }

    /** NEW-43: the lookup refuses the blank key with UNABLE_TO_FIND_VALID_ORG / INVALID_ORG_ID and queries nothing. */
    @ParameterizedTest(name = "{0} key=[{1}]")
    @MethodSource("lookupsAndBlankKeys")
    void aBlankKeyIsRefusedBeforeAnyQueryNEW43(String lookup, String key) {
        assertRefused(lookup, key, lookups.get(lookup));
        System.out.println(LOG_PREFIX + lookup + " key [" + key + "]: repository interactions checked");
        verifyNoInteractions(repository);
    }

    private static void assertRefused(String lookup, String key, Function<String, Mono<?>> call) {
        System.out.println(LOG_PREFIX + lookup + "(" + (key == null ? "null" : "[" + key + "]") + ")");
        Throwable error = catchThrowable(() -> call.apply(key).block(TIMEOUT));
        System.out.println(LOG_PREFIX + lookup + " -> " + error);
        assertThat(error).as(lookup).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).as(lookup).isEqualTo(BizError.UNABLE_TO_FIND_VALID_ORG);
        assertThat(biz.getMessageKey()).as(lookup).isEqualTo(INVALID_ORG_ID_KEY);
    }

    /** A valid object id, the key of the one organization the NEW-81 cases look up. */
    private static final String OBJECT_ID = "65f1c2a3b4d5e6f708192a3b";
    private static final String ORG_NAME = "org-by-id";

    /**
     * NEW-81: a list of blank keys only names no organization: {@code getByIds} answers empty and queries nothing. It failed
     * with a NullPointerException on the null first key (its {@code findFirst}) before any query.
     */
    @Test
    void getByIdsWithOnlyBlankKeysAsksNoQueryNEW81() {
        List<String> keys = Arrays.asList(NULL_KEY, EMPTY_KEY, WHITESPACE_KEY, MIXED_WHITESPACE_KEY);
        Object[] answer = new Object[1];
        Throwable failure = catchThrowable(() -> answer[0] = service.getByIds(keys).collectList().block(TIMEOUT));

        System.out.println(LOG_PREFIX + "getByIds(only blank keys) -> failure " + failure + ", answer " + answer[0]);
        assertThat(failure).as("failure of getByIds").isNull();
        assertThat(answer[0]).as("answer").isEqualTo(List.of());
        verifyNoInteractions(repository);
    }

    /**
     * NEW-81: the blank keys are dropped before the queries: with {@code [OBJECT_ID, null, " "]} (an object id first, so the
     * slug query runs first) the slug query and the id query see {@code [OBJECT_ID]} only (a null key in the slug query
     * matches every organization without a slug). The null-first call is B1's and M2's.
     */
    @Test
    void getByIdsDropsBlankKeysBeforeItsQueriesNEW81() {
        Organization org = Organization.builder().name(ORG_NAME).build();
        when(repository.findBySlugInAndState(any(), eq(ACTIVE))).thenReturn(Flux.empty());
        when(repository.findByIdInAndState(any(), eq(ACTIVE))).thenReturn(Flux.just(org));
        List<String> keys = Arrays.asList(OBJECT_ID, NULL_KEY, WHITESPACE_KEY);

        List<Organization> answered = service.getByIds(keys).collectList().block(TIMEOUT);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> slugKeys = ArgumentCaptor.forClass(Collection.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> idKeys = ArgumentCaptor.forClass(Collection.class);
        verify(repository).findBySlugInAndState(slugKeys.capture(), eq(ACTIVE));
        verify(repository).findByIdInAndState(idKeys.capture(), eq(ACTIVE));
        System.out.println(LOG_PREFIX + "getByIds " + keys + " -> slug query keys " + slugKeys.getValue() + ", id query keys "
                + idKeys.getValue() + ", answered " + answered);
        assertThat(new ArrayList<>(slugKeys.getValue())).as("keys of the slug query").containsExactly(OBJECT_ID);
        assertThat(new ArrayList<>(idKeys.getValue())).as("keys of the id query").containsExactly(OBJECT_ID);
        assertThat(answered).as("answer").containsExactly(org);
    }

    /** A gid-shaped key (it contains a hyphen), so that the kind of the first kept key is gid. */
    private static final String GID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    /**
     * NEW-81: the kind of the first <em>kept</em> key chooses the queries: with {@code [" ", GID, null]} the gid query runs
     * first (before: the blank first key made it the slug query), and the gid query, whose answer is non-empty, and the
     * slug query, built eagerly as its fallback, see {@code [GID]} only. Catches blank keys passed on to the gid query alone.
     */
    @Test
    void getByIdsChoosesTheGidQueryByTheFirstKeptKeyNEW81() {
        Organization org = Organization.builder().name(ORG_NAME).build();
        when(repository.findByGidInAndState(any(), eq(ACTIVE))).thenReturn(Flux.just(org));
        when(repository.findBySlugInAndState(any(), eq(ACTIVE))).thenReturn(Flux.empty());
        List<String> keys = Arrays.asList(WHITESPACE_KEY, GID, NULL_KEY);

        Object[] answer = new Object[1];
        Throwable failure = catchThrowable(() -> answer[0] = service.getByIds(keys).collectList().block(TIMEOUT));

        System.out.println(LOG_PREFIX + "getByIds " + keys + " -> failure " + failure + ", answer " + answer[0]);
        assertThat(failure).as("failure of getByIds").isNull();
        assertThat(answer[0]).as("answer").isEqualTo(List.of(org));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> gidKeys = ArgumentCaptor.forClass(Collection.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> slugKeys = ArgumentCaptor.forClass(Collection.class);
        verify(repository).findByGidInAndState(gidKeys.capture(), eq(ACTIVE));
        verify(repository).findBySlugInAndState(slugKeys.capture(), eq(ACTIVE));
        System.out.println(LOG_PREFIX + "gid query keys " + gidKeys.getValue() + ", slug query keys " + slugKeys.getValue());
        assertThat(new ArrayList<>(gidKeys.getValue())).as("keys of the gid query").containsExactly(GID);
        assertThat(new ArrayList<>(slugKeys.getValue())).as("keys of the slug query").containsExactly(GID);
    }
}
