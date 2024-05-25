package org.lowcoder.sdk.plugin.common.ssl;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Base64;

public class SslHelper {

    private static final String BEGIN_CERT = "-----BEGIN CERTIFICATE-----";
    private static final String END_CERT = "-----END CERTIFICATE-----";


    /**
     * @param certificate in base64
     */
    public static X509Certificate parseCertificate(String certificate) throws CertificateException {
        if (StringUtils.isBlank(certificate)) {
            throw new BizException(BizError.CERTIFICATE_IS_EMPTY, "CERTIFICATE_EMPTY");
        }
        byte[] decoded = Base64.getMimeDecoder().decode(certificate.replaceAll(BEGIN_CERT, "").replaceAll(END_CERT, ""));
        return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(decoded));
    }
}
