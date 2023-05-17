package org.lowcoder.plugin.es.model;

import java.io.Closeable;
import java.io.IOException;

import javax.validation.constraints.NotNull;

import org.lowcoder.plugin.es.ReactorRestClientAdaptor;

import com.google.common.base.Preconditions;

public record EsConnection(@NotNull ReactorRestClientAdaptor reactorRestClientAdaptor) implements Closeable {

    public EsConnection(@NotNull ReactorRestClientAdaptor reactorRestClientAdaptor) {
        Preconditions.checkArgument(reactorRestClientAdaptor != null);
        this.reactorRestClientAdaptor = reactorRestClientAdaptor;
    }

    @Override
    public void close() throws IOException {
        this.reactorRestClientAdaptor.close();
    }
}
