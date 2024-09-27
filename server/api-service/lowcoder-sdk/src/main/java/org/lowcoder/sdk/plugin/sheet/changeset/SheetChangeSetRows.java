package org.lowcoder.sdk.plugin.sheet.changeset;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.google.common.collect.Streams;
import jakarta.annotation.Nonnull;
import org.lowcoder.sdk.exception.PluginException;

import java.util.Iterator;
import java.util.List;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;

public record SheetChangeSetRows(List<SheetChangeSetRow> rows) implements Iterable<SheetChangeSetRow> {

    @SuppressWarnings("UnstableApiUsage")
    @Nonnull
    public static SheetChangeSetRows fromJsonNode(JsonNode node) {
        if (!(node instanceof ArrayNode arrayNode)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_ARRAY_FORMAT");
        }

        List<SheetChangeSetRow> changeSetRows = Streams.stream(arrayNode.iterator())
                .map(SheetChangeSetRow::fromJsonNode)
                .toList();
        return new SheetChangeSetRows(changeSetRows);
    }

    @Nonnull
    @Override
    public Iterator<SheetChangeSetRow> iterator() {
        return rows.iterator();
    }

    public boolean isEmpty() {
        return rows.isEmpty();
    }
}