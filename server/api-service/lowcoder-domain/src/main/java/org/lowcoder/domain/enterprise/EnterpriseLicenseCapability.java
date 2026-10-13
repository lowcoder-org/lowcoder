package org.lowcoder.domain.enterprise;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Private backend credential. Never returned by an API or included in logs. */
@Document("enterpriseLicenseCapability")
public class EnterpriseLicenseCapability {
    @Id private String id;
    @JsonIgnore private String encryptedToken;
    // Confirms an order/checkout exists, never payment or Enterprise entitlement.
    // null identifies records created before purchase-scoped polling was introduced.
    @JsonIgnore private Boolean purchaseConfirmed;
    @JsonIgnore private boolean checkoutAttempted;

    public String getId() { return id; }
    @JsonIgnore public String getEncryptedToken() { return encryptedToken; }
    @JsonIgnore public Boolean getPurchaseConfirmed() { return purchaseConfirmed; }
    @JsonIgnore public boolean isCheckoutAttempted() { return checkoutAttempted; }
}
