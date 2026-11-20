package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import tools.jackson.databind.json.JsonMapper;

/**
 * {@link LegacyBeanNaming}: accessor names with a leading run of upper-case letters get the Jackson 2 property name.
 */
class LegacyBeanNamingTest {

    @ParameterizedTest(name = "[{index}] ''{0}'' -> ''{1}''")
    @CsvSource({
            "SQLTypeName, sqltypeName",
            "URL, url",
            "URLPath, urlpath",
            "Name, name",
            "A, a",
            "name, name",
            "sqlType, sqlType"})
    void lowerCaseLeadingRunGivesTheJackson2Name(String implicitName, String expected) {
        String actual = LegacyBeanNaming.lowerCaseLeadingRun(implicitName);

        System.out.println("[LegacyBeanNamingTest] " + implicitName + " -> " + actual);
        assertThat(actual).isEqualTo(expected);
    }

    @Test
    void lowerCaseLeadingRunKeepsAnEmptyName() {
        assertThat(LegacyBeanNaming.lowerCaseLeadingRun("")).isEmpty();
    }

    @Test
    void aMapperWithTheStrategyWritesAndReadsTheJackson2Names() throws Exception {
        JsonMapper mapper = JsonMapper.builder().propertyNamingStrategy(new LegacyBeanNaming()).build();

        String json = mapper.writeValueAsString(new Bean("t", "u"));
        System.out.println("[LegacyBeanNamingTest] written: " + json);
        assertThat(json).contains("\"sqltypeName\":\"t\"").contains("\"url\":\"u\"");

        Bean read = mapper.readValue("{\"sqltypeName\":\"a\",\"url\":\"b\"}", Bean.class);
        assertThat(read.getSQLTypeName()).isEqualTo("a");
        assertThat(read.getURL()).isEqualTo("b");
    }

    /** The accessors whose Jackson 3 default names ({@code SQLTypeName}, {@code URL}) differ from Jackson 2's. */
    public static class Bean {
        private String sqlTypeName;
        private String url;

        public Bean() {
        }

        Bean(String sqlTypeName, String url) {
            this.sqlTypeName = sqlTypeName;
            this.url = url;
        }

        public String getSQLTypeName() {
            return sqlTypeName;
        }

        public void setSQLTypeName(String value) {
            this.sqlTypeName = value;
        }

        public String getURL() {
            return url;
        }

        public void setURL(String value) {
            this.url = value;
        }
    }
}
