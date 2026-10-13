package org.lowcoder.domain.enterprise;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService.PurchaseState;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.util.ReflectionTestUtils;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EnterpriseLicenseCapabilityServiceTest {
    final ReactiveMongoTemplate mongo = mock(ReactiveMongoTemplate.class, withSettings().mockMaker("mock-maker-subclass"));
    final EncryptionService encryption = mock(EncryptionService.class, withSettings().mockMaker("mock-maker-subclass"));
    final EnterpriseLicenseCapabilityService service = new EnterpriseLicenseCapabilityService(mongo, encryption);
    final String owner = EnterpriseLicenseCapabilityService.ownerKey("host", "org", "admin");

    EnterpriseLicenseCapability record(Boolean purchased, boolean attempted) {
        var record = new EnterpriseLicenseCapability();
        ReflectionTestUtils.setField(record, "purchaseConfirmed", purchased);
        ReflectionTestUtils.setField(record, "checkoutAttempted", attempted);
        return record;
    }

    @Test void absentCommunityAccountDoesNotCreateAnOwnershipCredential() {
        when(mongo.findById(owner, EnterpriseLicenseCapability.class)).thenReturn(Mono.empty());
        assertEquals(PurchaseState.NONE, service.purchaseState("host", "org", "admin").block());
        verify(mongo).findById(owner, EnterpriseLicenseCapability.class);
        verifyNoMoreInteractions(mongo);
        verifyNoInteractions(encryption);
    }

    @Test void legacyCredentialsNeedDiscoveryButEmptyMigratedAccountsDoNot() {
        when(mongo.findById(owner, EnterpriseLicenseCapability.class)).thenReturn(Mono.just(record(null, false)));
        assertEquals(PurchaseState.UNKNOWN, service.purchaseState("host", "org", "admin").block());
        when(mongo.findById(owner, EnterpriseLicenseCapability.class)).thenReturn(Mono.just(record(false, false)));
        assertEquals(PurchaseState.NONE, service.purchaseState("host", "org", "admin").block());
    }

    @Test void interruptedCheckoutNeedsDiscoveryWithoutClaimingAPurchase() {
        when(mongo.findById(owner, EnterpriseLicenseCapability.class)).thenReturn(Mono.just(record(false, true)));
        assertEquals(PurchaseState.UNKNOWN, service.purchaseState("host", "org", "admin").block());
    }

    @Test void confirmedPurchaseSurvivesAnotherCheckoutAttempt() {
        when(mongo.findById(owner, EnterpriseLicenseCapability.class)).thenReturn(Mono.just(record(true, true)));
        assertEquals(PurchaseState.CONFIRMED, service.purchaseState("host", "org", "admin").block());
    }

    @Test void purchaseStateIsScopedToTheExactDeploymentWorkspaceAndAdmin() {
        when(mongo.findById(anyString(), eq(EnterpriseLicenseCapability.class))).thenReturn(Mono.empty());
        when(mongo.findById(owner, EnterpriseLicenseCapability.class)).thenReturn(Mono.just(record(true, false)));
        assertEquals(PurchaseState.CONFIRMED, service.purchaseState("host", "org", "admin").block());
        assertEquals(PurchaseState.NONE, service.purchaseState("other-host", "org", "admin").block());
        assertEquals(PurchaseState.NONE, service.purchaseState("host", "other-org", "admin").block());
        assertEquals(PurchaseState.NONE, service.purchaseState("host", "org", "other-admin").block());
    }

    @Test void negativeDiscoveryUpdateProtectsConcurrentCheckoutAndConfirmation() {
        when(mongo.updateFirst(any(Query.class), any(Update.class), eq(EnterpriseLicenseCapability.class)))
                .thenAnswer(call -> {
                    var query = ((Query) call.getArgument(0)).getQueryObject();
                    assertEquals(owner, query.getString("_id"));
                    assertEquals(true, ((org.bson.Document) query.get("purchaseConfirmed")).get("$ne"));
                    assertEquals(true, ((org.bson.Document) query.get("checkoutAttempted")).get("$ne"));
                    return Mono.just(UpdateResult.acknowledged(0, 0L, null));
                });
        service.recordPurchaseStatus("host", "org", "admin", false).block();
        verify(mongo).updateFirst(any(Query.class), any(Update.class), eq(EnterpriseLicenseCapability.class));
    }
}
