package org.lowcoder.sdk.plugin.common.ssl;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

@SuperBuilder
@Jacksonized
public class DisableVerifySslConfig extends SslConfig {

    @JsonCreator
    public DisableVerifySslConfig(SslCertVerificationType sslCertVerificationType) {
        super(sslCertVerificationType);
    }
}
