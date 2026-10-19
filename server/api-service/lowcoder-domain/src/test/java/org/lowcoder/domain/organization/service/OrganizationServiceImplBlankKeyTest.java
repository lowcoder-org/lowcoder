package org.lowcoder.domain.organization.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Duration;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.asset.service.AssetRepository;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.birelation.BiRelationService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.context.ApplicationContext;

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
}
