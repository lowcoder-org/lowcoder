package org.lowcoder.api.contract.support;

import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;

import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Samples of the types of the {@code misc} endpoints of WP7 (docs/API_PAYLOAD_TEST_PLAN.md §3.3): JavaScript library
 * metadata (task T7.2), the API flow request (task T7.3) and the plugin list of the functional route
 * {@code GET /api/plugins/} (task T7.4), with the conventions of {@link PayloadSamples}.
 */
public final class MiscSamples {

    /** The HTTP method of {@link #flowRequest()}, in lower case: {@code ApiFlowController} upper-cases it. */
    public static final String FLOW_METHOD = "post";
    /** {@code FlowRequest.timeout} and {@code retries} are {@code Integer}s: above {@code Short.MAX_VALUE}. */
    public static final int FLOW_TIMEOUT = 40_091;
    public static final int FLOW_RETRIES = 40_092;
    public static final int FLOW_DATA_COUNT = 40_093;
    /** {@code LowcoderPluginManager}'s private record of a loaded plugin, written by {@code GET /api/plugins/}. */
    public static final String PLUGIN_INFO_CLASS = "org.lowcoder.api.framework.plugin.LowcoderPluginManager$PluginInfo";

    private MiscSamples() {
    }

    /** {@code JsLibraryEndpoints}' element: what {@code JsLibraryController#fetch} maps from the npm registry. */
    public static JsLibraryMeta jsLibraryMeta() {
        return JsLibraryMeta.builder()
                .name("JsLibraryMeta.name")
                .latestVersion("JsLibraryMeta.latestVersion")
                .homepage("JsLibraryMeta.homepage")
                .description("JsLibraryMeta.description")
                .downloadUrl("JsLibraryMeta.downloadUrl")
                .build();
    }

    /**
     * {@code ApiFlowEndpoints#flow}: a flow call with two headers and realistic {@code data}, the content of a
     * {@code Map<String, Object>} as the production mapper binds it ({@code LinkedHashMap}, {@code ArrayList},
     * {@code Integer}, {@code Long}, {@code Double}); the §4.6 representative input is sent as {@code data} by
     * {@code ApiFlowEndpointsContractTest#flowRepresentativeData}.
     */
    public static FlowRequest flowRequest() {
        Map<String, Object> nested = new LinkedHashMap<>();
        nested.put("first", "FlowRequest.data.nested.first");
        nested.put("second", "FlowRequest.data.nested.second");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("text", "FlowRequest.data.text");
        data.put("count", FLOW_DATA_COUNT);
        data.put("total", PayloadSamples.DSL_LONG);
        data.put("ratio", PayloadSamples.DSL_DECIMAL);
        data.put("items", new ArrayList<>(List.of("FlowRequest.data.items[0]", "FlowRequest.data.items[1]")));
        data.put("nested", nested);
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("X-Flow-First", "FlowRequest.headers.X-Flow-First");
        headers.put("X-Flow-Second", "FlowRequest.headers.X-Flow-Second");
        return new FlowRequest("FlowRequest.path", FLOW_METHOD, data, headers, FLOW_TIMEOUT, FLOW_RETRIES);
    }

    /**
     * A {@code LowcoderPluginManager.PluginInfo} (private record, made by reflection) with values starting with
     * {@code prefix}; its {@code info} is declared {@code Object}, so it holds the §4.6 representative input.
     */
    public static Object pluginInfo(String prefix) {
        try {
            Constructor<?> constructor = Class.forName(PLUGIN_INFO_CLASS).getDeclaredConstructor(String.class, String.class, Object.class);
            constructor.setAccessible(true);
            return constructor.newInstance(prefix + ".id", prefix + ".description", PayloadSamples.representativeObject());
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(PLUGIN_INFO_CLASS + " has no (String, String, Object) constructor", e);
        }
    }
}
