package org.lowcoder.sdk.plugin.common.ssl;

import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.jetbrains.annotations.Nullable;
import org.lowcoder.sdk.config.JsonViews;

import java.util.function.Function;

import static org.apache.commons.lang3.ObjectUtils.firstNonNull;

@Getter
@SuperBuilder
@Jacksonized
public class VerifySelfSignedCertSslConfig extends SslConfig {

    @JsonView(JsonViews.Internal.class)
    private String selfSignedCert;

    @Override
    public void doEncrypt(Function<String, String> encryptFunc) {
        this.selfSignedCert = encryptFunc.apply(this.selfSignedCert);
    }

    @Override
    public void doDecrypt(Function<String, String> decryptFunc) {
        this.selfSignedCert = decryptFunc.apply(this.selfSignedCert);
    }

    @Override
    public SslConfig mergeWithUpdatedConfig(@Nullable SslConfig updatedConfig) {
        if (!(updatedConfig instanceof VerifySelfSignedCertSslConfig verifySelfSignedCertSSLConfig)) {
            return updatedConfig;
        }
        return VerifySelfSignedCertSslConfig.builder()
                .sslCertVerificationType(verifySelfSignedCertSSLConfig.getSslCertVerificationType())
                .selfSignedCert(firstNonNull(verifySelfSignedCertSSLConfig.selfSignedCert, this.selfSignedCert))
                .build();
    }
}
