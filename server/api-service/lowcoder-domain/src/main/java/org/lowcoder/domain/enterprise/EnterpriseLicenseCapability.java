package org.lowcoder.domain.enterprise;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Private backend credential. Never returned by an API or included in logs. */
@Document("enterpriseLicenseCapability")
public class EnterpriseLicenseCapability {
    @Id private String id;
    @JsonIgnore private String encryptedToken;

    public String getId() { return id; }
    @JsonIgnore public String getEncryptedToken() { return encryptedToken; }
}
