package org.lowcoder.sdk.contract;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The JSON boundary sites a test method exercises (docs/API_PAYLOAD_TEST_PLAN.md §4.10, §6.2): the stable row keys,
 * {@code <path>#<member>#<callee>#<ordinal>}, of {@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-sites.tsv} (its fifth column).
 *
 * <p>{@code JsonBoundaryGateTest} reads this annotation from test <em>sources</em>, so the keys must be string
 * literals and the annotated method must be a {@code @Test} method under one of its group's test source roots
 * ({@code lowcoder-server/src/test/resources/json-contract/boundary-sites/json-boundary-groups.tsv}). Limit: it records that a test claims a site, not that the test
 * reaches it; every test calls the site's real entry point (plan §4.7, §4.9), which the reviewer checks.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface BoundarySites {

    String[] value();
}
