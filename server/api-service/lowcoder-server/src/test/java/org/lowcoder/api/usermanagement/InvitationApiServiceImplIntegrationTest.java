package org.lowcoder.api.usermanagement;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.invitation.repository.InvitationRepository;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class InvitationApiServiceImplIntegrationTest {

    @Autowired
    private InvitationApiService invitationApiService;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Organization testOrganization;
    private Invitation testInvitation;

    @BeforeEach
    public void setUp() {
        // Create and save test user
        testUser = new User();
        testUser.setId("testuserid");
        testUser.setName("Test User");
        userRepository.save(testUser).block();

        // Create and save test organization
        testOrganization = new Organization();
        testOrganization.setId("testorgid");
        testOrganization.setName("Test Organization");
        testOrganization.setState(OrganizationState.ACTIVE);
        organizationRepository.save(testOrganization).block();

        // Create and save test invitation
        testInvitation = Invitation.builder()
                .createUserId(testUser.getId())
                .invitedOrganizationId(testOrganization.getId())
                .build();
        testInvitation.setId("testinvitationid");
        invitationRepository.save(testInvitation).block();

        // Create and save test invitation - no org
        Invitation testInvitation1 = Invitation.builder()
                .createUserId(testUser.getId())
                .invitedOrganizationId("notfoundorg")
                .build();
        testInvitation1.setId("testinvitationid2noorg");
        invitationRepository.save(testInvitation1).block();
    }

    @Test
    public void testGetInvitationView_Success() {
        StepVerifier.create(invitationApiService.getInvitationView(testInvitation.getId()))
                .assertNext(invitationVO -> {
                    assertEquals(testInvitation.getId(), invitationVO.getInviteCode());
                    assertEquals(testOrganization.getId(), invitationVO.getInvitedOrganizationId());
                })
                .verifyComplete();
    }

    @Test
    public void testGetInvitationView_Failed_InviteCodeNotFound() {
        StepVerifier.create(invitationApiService.getInvitationView("notfoundcode"))
                .expectError()
                .verify();
    }

    @Test
    @WithMockUser
    public void testCreate_Success() {
        StepVerifier.create(invitationApiService.create(testOrganization.getId()))
                .assertNext(invitationVO -> {
                    assertEquals(testOrganization.getId(), invitationVO.getInvitedOrganizationId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testCreate_Failed() {
        StepVerifier.create(invitationApiService.create("notfoundid"))
                .expectError()
                .verify();
    }

    @Test
    @WithMockUser
    public void testInviteUser_Success() {
        StepVerifier.create(invitationApiService.inviteUser(testInvitation.getId()))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();

        StepVerifier.create(invitationApiService.inviteUser(testInvitation.getId()))
                .expectError()
                .verify();
    }

    @Test
    @WithMockUser
    public void testInviteUser_Failed_CodeNotFound() {
        StepVerifier.create(invitationApiService.inviteUser("testinvitationid2noorg"))
                .expectError()
                .verify();
    }
}