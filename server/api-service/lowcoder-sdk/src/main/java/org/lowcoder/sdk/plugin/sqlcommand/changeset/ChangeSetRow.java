package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Streams;
import jakarta.annotation.Nonnull;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;

@SuppressWarnings("UnstableApiUsage")
public class ChangeSetRow implements Iterable<ChangeSetItem> {
    private final Map<String, ChangeSetItem> columnToItem;

    public ChangeSetRow(List<ChangeSetItem> items) {
        columnToItem = items.stream()
                .collect(Collectors.toMap(ChangeSetItem::column, it -> it, (a, b) -> b, LinkedHashMap::new));
    }

    public ChangeSetRow(JsonNode node) {
        this(parseChangeSetItems(node));
    }

    @Nonnull
    private static List<ChangeSetItem> parseChangeSetItems(JsonNode node) {
        if (!(node instanceof ObjectNode objectNode)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_MAP_TYPE");
        }

        return Streams.stream(objectNode.fields())
                .map(next -> {
                    String column = next.getKey();
                    JsonNode value = next.getValue();
                    return new ChangeSetItem(column, GuiSqlValue.fromJsonNode(value));
                })
                .toList();
    }

    public boolean isEmpty() {
        return columnToItem.isEmpty();
    }

    public Stream<ChangeSetItem> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

    public int size() {
        return columnToItem.size();
    }

    @Nonnull
    @Override
    public Iterator<ChangeSetItem> iterator() {
        return columnToItem.values().iterator();
    }


    public Set<String> getColumns() {
        return columnToItem.keySet();
    }

    public ChangeSetItem getItem(String column) {
        return columnToItem.get(column);
    }
}