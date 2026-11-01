package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpCookie;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/** NEW-18 (T156b-1): {@link CookieForwarding#select}. Prints cookie names, never values. */
class CookieForwardingTest {

    private static final String TAG = "[CookieForwardingTest]";
    private static final String SESSION_COOKIE = "LOWCODER_CE_SELFHOST_TOKEN";
    private static final String SELECTED = "tenant";
    private static final String OTHER = "tracking";
    private static final String BLANK = " ";

    private static MultiValueMap<String, HttpCookie> request() {
        MultiValueMap<String, HttpCookie> cookies = new LinkedMultiValueMap<>();
        cookies.add(OTHER, new HttpCookie(OTHER, "other-value"));
        cookies.add(SESSION_COOKIE, new HttpCookie(SESSION_COOKIE, "session-value"));
        cookies.add(SELECTED, new HttpCookie(SELECTED, "first"));
        cookies.add(SELECTED, new HttpCookie(SELECTED, "second"));
        return cookies;
    }

    private static MultiValueMap<String, HttpCookie> show(String label, MultiValueMap<String, HttpCookie> selected) {
        System.out.println(TAG + " " + label + " -> names " + selected.keySet());
        return selected;
    }

    @Test
    void forwardAllKeepsEveryCookieButTheSessionCookieInOrderC1() {
        MultiValueMap<String, HttpCookie> selected = show("forward all", CookieForwarding.select(request(), true, Set.of(), SESSION_COOKIE));
        assertThat(selected.keySet()).containsExactly(OTHER, SELECTED);
        assertThat(selected.get(SELECTED)).extracting(HttpCookie::getValue).containsExactly("first", "second");
    }

    @Test
    void aListedSessionCookieIsStillExcludedC2() {
        MultiValueMap<String, HttpCookie> selected = show("list with the session cookie",
                CookieForwarding.select(request(), false, new LinkedHashSet<>(List.of(SELECTED, SESSION_COOKIE)), SESSION_COOKIE));
        assertThat(selected.keySet()).containsExactly(SELECTED);
    }

    @Test
    void withoutASettingNothingIsForwardedC3() {
        assertThat(show("no list", CookieForwarding.select(request(), false, null, SESSION_COOKIE))).isEmpty();
        assertThat(show("empty list", CookieForwarding.select(request(), false, Set.of(), SESSION_COOKIE))).isEmpty();
    }

    @Test
    void namesMatchExactlyAndCaseSensitivelyC4() {
        assertThat(show("Tenant", CookieForwarding.select(request(), false, Set.of("Tenant"), SESSION_COOKIE))).isEmpty();
    }

    @Test
    void nullCookiesAndABlankOrNullSessionNameForwardNothingC5() {
        assertThat(CookieForwarding.select(null, true, Set.of(), SESSION_COOKIE)).as("null cookies").isEmpty();
        assertThat(show("blank session name", CookieForwarding.select(request(), true, Set.of(), BLANK))).isEmpty();
        assertThat(show("null session name", CookieForwarding.select(request(), true, Set.of(), null))).isEmpty();
        assertThat(show("list, null session name", CookieForwarding.select(request(), false, Set.of(SELECTED), null))).isEmpty();
    }

    @Test
    void nullNamesListsAndElementsAreSkippedC6() {
        MultiValueMap<String, HttpCookie> cookies = request();
        cookies.put(null, List.of(new HttpCookie("x", "y")));
        cookies.put("nullList", null);
        cookies.put("nullElement", Arrays.asList(null, new HttpCookie("nullElement", "kept")));
        MultiValueMap<String, HttpCookie> selected = show("nulls", CookieForwarding.select(cookies, true, null, SESSION_COOKIE));
        assertThat(selected.keySet()).containsExactly(OTHER, SELECTED, "nullElement");
        assertThat(selected.get("nullElement")).extracting(HttpCookie::getValue).containsExactly("kept");
    }
}
