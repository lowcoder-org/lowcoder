package org.lowcoder.plugin.googlesheets.queryhandler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.googlesheets.GoogleSheetsPlugin.GoogleSheetsEngine;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsDatasourceConfig;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsQueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;

import com.google.api.services.sheets.v4.Sheets;

/**
 * The test-only root-URL seam of {@link GoogleSheetsGetPreParameters} (plan section 5 D-1): the default is Google's URL,
 * the override applies, a reset restores the default, and the seam cannot be reached from outside the package. The seam
 * is a JVM-wide static, so every test resets it in {@code @AfterEach}; this module runs its test classes sequentially
 * (no parallel setting in any pom or junit-platform.properties), so no other Sheets test sees the override. Nothing
 * connects: the Sheets client is only built.
 */
public class GoogleSheetsRootUrlSeamTest {

    private static final String GOOGLE_ROOT = "https://sheets.googleapis.com/";
    private static final String LOCAL_ROOT = "http://127.0.0.1:1/";

    private final GoogleSheetsEngine engine = new GoogleSheetsEngine();

    @AfterEach
    public void resetTheSeam() {
        GoogleSheetsGetPreParameters.setRootUrlForTests(null);
    }

    private Sheets sheets() {
        GoogleSheetsQueryExecutionContext context = engine.buildQueryExecutionContext(
                engine.resolveConfig(Map.of("serviceAccount", serviceAccount())),
                Map.of("commandType", "readData", "command", Map.of("spreadsheetId", "a", "sheetName", "b")), Map.of(),
                new QueryVisitorContext("v", "o", 0, null, null, Set.of()));
        return GoogleSheetsGetPreParameters.GetSheetsService(context);
    }

    private static String serviceAccount() {
        try {
            Method json = Class.forName("org.lowcoder.plugin.googlesheets.ServiceAccountTestKeys").getDeclaredMethod("json");
            json.setAccessible(true);
            return (String) json.invoke(null);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    public void withoutTheSeamSetTheClientTargetsGoogle() {
        Sheets sheets = sheets();

        assertEquals(GOOGLE_ROOT, sheets.getRootUrl());
        assertEquals(GOOGLE_ROOT, sheets.getBaseUrl());
    }

    @Test
    public void anOverrideRetargetsTheClientAndAResetRestoresGoogle() {
        GoogleSheetsGetPreParameters.setRootUrlForTests(LOCAL_ROOT);
        Sheets overridden = sheets();
        GoogleSheetsGetPreParameters.setRootUrlForTests("http://127.0.0.1:2");
        Sheets withoutSlash = sheets();
        GoogleSheetsGetPreParameters.setRootUrlForTests(null);
        Sheets restored = sheets();

        System.out.println("[GoogleSheetsRootUrlSeamTest] override " + overridden.getRootUrl() + " / " + overridden.getBaseUrl()
                + ", without slash " + withoutSlash.getRootUrl() + ", restored " + restored.getRootUrl());
        assertEquals(LOCAL_ROOT, overridden.getRootUrl());
        assertEquals(LOCAL_ROOT, overridden.getBaseUrl());
        assertFalse(withoutSlash.getRootUrl().isEmpty());
        assertEquals("http://127.0.0.1:2/", withoutSlash.getRootUrl(), "the Builder normalises a missing trailing slash");
        assertEquals(GOOGLE_ROOT, restored.getRootUrl());
        assertEquals(GOOGLE_ROOT, restored.getBaseUrl());
    }

    @Test
    public void theSeamIsNotPublicAndNoConfigurationClassHasAMemberForIt() throws Exception {
        Method setter = GoogleSheetsGetPreParameters.class.getDeclaredMethod("setRootUrlForTests", String.class);

        assertFalse(Modifier.isPublic(setter.getModifiers()));
        assertFalse(Modifier.isProtected(setter.getModifiers()));
        assertFalse(Modifier.isPublic(GoogleSheetsGetPreParameters.class.getDeclaredField("rootUrlOverride").getModifiers()));
        for (Class<?> type : new Class<?>[] {GoogleSheetsDatasourceConfig.class, GoogleSheetsQueryExecutionContext.class}) {
            assertFalse(Arrays.stream(type.getDeclaredFields()).anyMatch(field -> field.getName().toLowerCase().contains("rooturl")), type.getSimpleName());
            assertFalse(Arrays.stream(type.getMethods()).anyMatch(method -> method.getName().toLowerCase().contains("rooturl")), type.getSimpleName());
        }
        assertThrows(NoSuchMethodException.class, () -> GoogleSheetsGetPreParameters.class.getMethod("setRootUrlForTests", String.class));
    }
}
