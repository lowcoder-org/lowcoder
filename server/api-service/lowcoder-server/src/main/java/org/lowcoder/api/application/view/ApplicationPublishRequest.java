package org.lowcoder.api.application.view;

public record ApplicationPublishRequest(String commitMessage, String tag) {

    /**
     * A stored version tag the next publish counts on: three numbers of at most nine digits (so each fits an int and the
     * patch part can be increased). Any other tag, as publishers may store whatever text they send, starts again at 1.0.0.
     */
    public static final String VERSION_TAG_PATTERN = "\\d{1,9}\\.\\d{1,9}\\.\\d{1,9}";
}
