package org.lowcoder.sdk.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.restapi.MultipartFormData;

/** {@link RestBodyFormFileData}: the three ways to build a multipart entry and what each says about its type. */
public class RestBodyFormFileDataTest {

    @Test
    public void theTextConstructorsCarryNoFileDataAndTheFileConstructorMarksTheEntryAsAFile() {
        RestBodyFormFileData plain = new RestBodyFormFileData("k", "v");
        RestBodyFormFileData typed = new RestBodyFormFileData("k", "v", "FILE");
        MultipartFormData part = new MultipartFormData();
        List<MultipartFormData> parts = List.of(part);
        RestBodyFormFileData file = new RestBodyFormFileData("k", parts);

        assertNull(plain.getFileData());
        assertNull(plain.getType());
        assertFalse(plain.isMultipartFileType());
        assertNull(typed.getFileData());
        assertTrue(typed.isMultipartFileType());
        assertEquals("v", typed.getValue());
        assertSame(parts, file.getFileData());
        assertEquals("k", file.getKey());
        assertNull(file.getValue());
        assertEquals("FILE", file.getType());
        assertTrue(file.isMultipartFileType());
    }

    @Test
    public void theFileTypeIsRecognisedWhateverItsCase() {
        assertTrue(new Property("k", "v", "file").isMultipartFileType());
        assertTrue(new Property("k", "v", "File").isMultipartFileType());
        assertFalse(new Property("k", "v", "TEXT").isMultipartFileType());
    }
}
