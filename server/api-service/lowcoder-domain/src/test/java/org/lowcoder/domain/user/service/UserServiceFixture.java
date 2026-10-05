package org.lowcoder.domain.user.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.encryption.EncryptionServiceImpl;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;

import reactor.core.publisher.Mono;

/**
 * Builds a {@link UserServiceImpl} from Mockito collaborators and the real {@link EncryptionServiceImpl}, so password
 * tests compare real hashes. Shared by the three {@code UserServiceImpl*Test} classes of unit U10 (task L3-2).
 */
final class UserServiceFixture {

    static final String USER_ID = "user-1";
    static final String USER_EMAIL = "user@example.com";
    static final String ORG_ID = "org-1";
    static final int AVATAR_MAX_SIZE_KB = 300;

    final AssetService assetService = mock(AssetService.class);
    final MongoUpsertHelper mongoUpsertHelper = mock(MongoUpsertHelper.class);
    final UserRepository repository = mock(UserRepository.class);
    final GroupMemberService groupMemberService = mock(GroupMemberService.class);
    final OrgMemberService orgMemberService = mock(OrgMemberService.class);
    final OrganizationService organizationService = mock(OrganizationService.class);
    final GroupService groupService = mock(GroupService.class);
    final AuthenticationService authenticationService = mock(AuthenticationService.class);
    final EmailCommunicationService emailCommunicationService = mock(EmailCommunicationService.class);
    final CommonConfig commonConfig = new CommonConfig();
    final EncryptionServiceImpl encryptionService;
    final UserServiceImpl service;

    @SuppressWarnings("unchecked")
    UserServiceFixture() {
        CommonConfig.JsExecutor jsExecutor = mock(CommonConfig.JsExecutor.class);
        when(jsExecutor.getSalt()).thenReturn("");
        when(jsExecutor.getPassword()).thenReturn("");
        commonConfig.setJsExecutor(jsExecutor);
        encryptionService = new EncryptionServiceImpl(commonConfig);

        ConfigCenter configCenter = mock(ConfigCenter.class);
        ConfigInstance assetConfig = mock(ConfigInstance.class);
        Conf<Integer> avatarMaxSize = mock(Conf.class);
        when(configCenter.asset()).thenReturn(assetConfig);
        when(assetConfig.ofInteger("avatarMaxSizeInKb", AVATAR_MAX_SIZE_KB)).thenReturn(avatarMaxSize);
        when(avatarMaxSize.get()).thenReturn(AVATAR_MAX_SIZE_KB);

        when(repository.save(any(User.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        service = new UserServiceImpl(assetService, configCenter, encryptionService, mongoUpsertHelper, repository,
                groupMemberService, orgMemberService, organizationService, groupService, commonConfig,
                authenticationService, emailCommunicationService);
        service.init();
    }

    /** A user whose stored password is the real hash of {@code plainPassword}. */
    User userWithPassword(String plainPassword) {
        return User.builder()
                .id(USER_ID)
                .email(USER_EMAIL)
                .password(plainPassword == null ? null : encryptionService.encryptPassword(plainPassword))
                .build();
    }
}
