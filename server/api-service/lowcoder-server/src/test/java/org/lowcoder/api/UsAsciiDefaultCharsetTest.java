package org.lowcoder.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.util.JwtDecoderUtil;
import org.lowcoder.api.contract.boundary.JwtClaimsContractTest;

/**
 * GH-01 (T182): text read as UTF-8 whatever the JVM's default charset. Runs only in the surefire execution
 * {@value #US_ASCII_DEFAULT_CHARSET_TAG} of {@code lowcoder-server/pom.xml}, whose JVM starts with
 * {@code -Dfile.encoding=ANSI_X3.4-1968}; the {@code default-test} execution excludes the tag. Each case first asserts
 * that the default charset is US-ASCII, so a run without the property fails instead of passing vacuously.
 *
 * <p>Limits: only the default charset is changed, not {@code sun.jnu.encoding}, {@code native.encoding} or the locale;
 * the controller case loads {@code JsLibraryController} a second time in a child-first class loader, whose initializer
 * still requests the real npm registry for its first reload, the result unread, as on every load of the class.
 */
@Tag(UsAsciiDefaultCharsetTest.US_ASCII_DEFAULT_CHARSET_TAG)
class UsAsciiDefaultCharsetTest {

    static final String US_ASCII_DEFAULT_CHARSET_TAG = "us-ascii-default-charset";
    private static final String TAG = "[UsAsciiDefaultCharsetTest]";
    private static final String NON_ASCII_NAME = "Jürgen Müller";
    private static final String NON_ASCII_EMAIL = "jürgen.müller@example.com";
    private static final String NON_ASCII_PAYLOAD = "{\"name\":\"" + NON_ASCII_NAME + "\",\"email\":\"" + NON_ASCII_EMAIL + "\"}";
    private static final String CONTROLLER_CLASS_PREFIX = "org.lowcoder.api.misc.JsLibraryController";
    private static final String RECOMMENDED_RESOURCE = "recommendedJsLibraries.json";
    private static final String FIXTURE_RESOURCE = "us-ascii-default-charset/recommendedJsLibraries.json";
    private static final String DOWNLOAD_URLS_FIELD = "RECOMMENDED_DOWNLOAD_URLS";
    private static final String FIXTURE_LIBRARY = "bibliothèque-gh01";
    private static final String FIXTURE_DOWNLOAD_URL = "https://unpkg.com/bücher/dist/bücher.min.js";

    private static void assertUsAsciiDefaultCharset() {
        System.out.println(TAG + " defaultCharset " + Charset.defaultCharset() + ", file.encoding " + System.getProperty("file.encoding")
                + ", native.encoding " + System.getProperty("native.encoding") + ", sun.jnu.encoding " + System.getProperty("sun.jnu.encoding"));
        assertThat(Charset.defaultCharset()).as("precondition: the execution's default charset").isEqualTo(StandardCharsets.US_ASCII);
    }

    @Test
    void jwtClaimsAreDecodedAsUtf8WhateverTheDefaultCharsetGH01() throws Exception {
        assertUsAsciiDefaultCharset();
        Map<String, Object> claims = JwtDecoderUtil.decodeJwtPayload(JwtClaimsContractTest.jwt(NON_ASCII_PAYLOAD));
        System.out.println(TAG + " claims " + JwtClaimsContractTest.escaped(String.valueOf(claims)));
        assertThat(claims.get("name")).as("name claim").isEqualTo(NON_ASCII_NAME);
        assertThat(claims.get("email")).as("email claim").isEqualTo(NON_ASCII_EMAIL);
    }

    /** Defines {@code JsLibraryController*} from the parent's bytes and answers the recommended-libraries resource with the fixture. */
    private static final class ChildFirstLoader extends ClassLoader {
        private final ClassLoader source;

        ChildFirstLoader(ClassLoader source) {
            super(source);
            this.source = source;
        }

        @Override
        protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
            if (!name.startsWith(CONTROLLER_CLASS_PREFIX)) {
                return super.loadClass(name, resolve);
            }
            synchronized (getClassLoadingLock(name)) {
                Class<?> loaded = findLoadedClass(name);
                if (loaded == null) {
                    try (InputStream in = source.getResourceAsStream(name.replace('.', '/') + ".class")) {
                        if (in == null) {
                            throw new ClassNotFoundException(name);
                        }
                        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                        in.transferTo(bytes);
                        loaded = defineClass(name, bytes.toByteArray(), 0, bytes.size());
                    } catch (IOException e) {
                        throw new ClassNotFoundException(name, e);
                    }
                }
                return loaded;
            }
        }

        @Override
        public InputStream getResourceAsStream(String name) {
            return RECOMMENDED_RESOURCE.equals(name) ? source.getResourceAsStream(FIXTURE_RESOURCE) : super.getResourceAsStream(name);
        }
    }

    @Test
    void recommendedJsLibrariesAreReadAsUtf8WhateverTheDefaultCharsetGH01() throws Exception {
        assertUsAsciiDefaultCharset();
        ChildFirstLoader loader = new ChildFirstLoader(UsAsciiDefaultCharsetTest.class.getClassLoader());
        Class<?> controller = Class.forName(CONTROLLER_CLASS_PREFIX, true, loader);
        assertThat(controller.getClassLoader()).as("the controller class is the child loader's").isSameAs(loader);
        Field field = controller.getDeclaredField(DOWNLOAD_URLS_FIELD);
        field.setAccessible(true);
        Object urls = field.get(null);
        System.out.println(TAG + " " + DOWNLOAD_URLS_FIELD + " " + JwtClaimsContractTest.escaped(String.valueOf(urls)));
        assertThat(urls).as(DOWNLOAD_URLS_FIELD).isEqualTo(Map.of(FIXTURE_LIBRARY, FIXTURE_DOWNLOAD_URL));
    }
}
