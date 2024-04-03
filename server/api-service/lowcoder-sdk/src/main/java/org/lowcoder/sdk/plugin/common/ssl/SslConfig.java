package org.lowcoder.sdk.plugin.common.ssl;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeInfo.Id;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.sdk.models.Encrypt;

@Getter
@JsonTypeInfo(use = Id.NAME, property = "sslCertVerificationType", visible = true, defaultImpl = VerifyCACertSslConfig.class)
@JsonSubTypes({
        @Type(value = DisableVerifySslConfig.class, name = "DISABLED"),
        @Type(value = VerifySelfSignedCertSslConfig.class, name = "VERIFY_SELF_SIGNED_CERT")
})
@SuperBuilder
public abstract class SslConfig implements Encrypt {

    protected final SslCertVerificationType sslCertVerificationType;

    protected SslConfig(SslCertVerificationType sslCertVerificationType) {
        this.sslCertVerificationType = sslCertVerificationType;
    }

    public SslConfig mergeWithUpdatedConfig(@Nullable SslConfig updatedConfig) {
        return updatedConfig;
    }

}
