package org.lowcoder.sdk.contract;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.util.concurrent.TimeUnit;

/**
 * A self-signed server certificate generated in the test with the JDK's {@code keytool} (the technique of
 * {@code WebClientBuildHelperTest}): a PKCS12 key store in the given directory, the certificate as PEM (what a datasource's
 * "verify self-signed certificate" setting holds) and an {@link SSLContext} that serves it, for
 * {@link RecordingHttpServer#startSecure}. The certificate names {@code CN=localhost} with the subject alternative names
 * {@code 127.0.0.1} and {@code localhost}. Nothing is copied anywhere: the key store stays in the test's own directory.
 */
public final class SelfSignedCertificate {

    private static final String STORE_PASSWORD = "changeit";
    private static final String ALIAS = "test";
    private static final String STORE_TYPE = "PKCS12";
    private static final int KEY_SIZE = 2048;
    private static final int VALIDITY_DAYS = 1;
    private static final String SUBJECT = "CN=localhost";
    private static final String SUBJECT_ALTERNATIVE_NAMES = "san=ip:127.0.0.1,dns:localhost";
    private static final long KEYTOOL_TIMEOUT_SECONDS = 60;
    private static final String TLS = "TLS";

    private final Path keyStore;
    private final String pem;

    private SelfSignedCertificate(Path keyStore, String pem) {
        this.keyStore = keyStore;
        this.pem = pem;
    }

    /** Generates a certificate whose key store is {@code directory/<name>.p12}. */
    public static SelfSignedCertificate generate(Path directory, String name) {
        Path store = directory.resolve(name + ".p12");
        String keytool = Path.of(System.getProperty("java.home"), "bin", "keytool").toString();
        run(keytool, "-genkeypair", "-alias", ALIAS, "-keyalg", "RSA", "-keysize", String.valueOf(KEY_SIZE), "-dname", SUBJECT,
                "-ext", SUBJECT_ALTERNATIVE_NAMES, "-validity", String.valueOf(VALIDITY_DAYS), "-storetype", STORE_TYPE,
                "-keystore", store.toString(), "-storepass", STORE_PASSWORD, "-keypass", STORE_PASSWORD);
        String pem = run(keytool, "-exportcert", "-alias", ALIAS, "-rfc", "-keystore", store.toString(), "-storepass", STORE_PASSWORD);
        return new SelfSignedCertificate(store, pem);
    }

    /** The certificate in PEM form ({@code -----BEGIN CERTIFICATE-----}...). */
    public String pem() {
        return pem;
    }

    /** An SSL context whose server identity is this certificate. */
    public SSLContext serverContext() {
        try {
            KeyStore keys = KeyStore.getInstance(STORE_TYPE);
            try (InputStream in = Files.newInputStream(keyStore)) {
                keys.load(in, STORE_PASSWORD.toCharArray());
            }
            KeyManagerFactory keyManagers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            keyManagers.init(keys, STORE_PASSWORD.toCharArray());
            SSLContext context = SSLContext.getInstance(TLS);
            context.init(keyManagers.getKeyManagers(), null, null);
            return context;
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read the key store " + keyStore, e);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("cannot build the SSL context of " + keyStore, e);
        }
    }

    private static String run(String... command) {
        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            String output;
            try (InputStream in = process.getInputStream()) {
                output = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
            if (!process.waitFor(KEYTOOL_TIMEOUT_SECONDS, TimeUnit.SECONDS) || process.exitValue() != 0) {
                throw new IllegalStateException(String.join(" ", command) + " failed:\n" + output);
            }
            return output;
        } catch (IOException e) {
            throw new UncheckedIOException("cannot run " + command[0], e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted while running " + command[0], e);
        }
    }
}
