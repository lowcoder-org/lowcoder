package org.lowcoder.sdk.models;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.ForeignKey;
import org.lowcoder.sdk.models.DatasourceStructure.Key;
import org.lowcoder.sdk.models.DatasourceStructure.PrimaryKey;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.DatasourceStructure.Template;
import org.lowcoder.sdk.util.JsonUtils;

/** Ordering of the keys and columns of a datasource structure, and the shape of the structure payload. */
class DatasourceStructureOrderingTest {

    private static final List<String> COLUMNS = List.of("id");
    /** large enough for TimSort to merge runs and check the comparator contract (it does so from 32 elements) */
    private static final int TIMSORT_MERGE_SIZE = 40;

    private static PrimaryKey pk(String name) {
        return new PrimaryKey(name, COLUMNS);
    }

    private static ForeignKey fk(String name) {
        return new ForeignKey(name, COLUMNS, COLUMNS);
    }

    private static Column column(String name) {
        return new Column(name, "int", null, false);
    }

    private static List<String> names(List<Key> keys) {
        List<String> names = new ArrayList<>();
        for (Key key : keys) {
            names.add(key.getType().substring(0, 2) + ":" + (key instanceof PrimaryKey p ? p.getName() : ((ForeignKey) key).getName()));
        }
        return names;
    }

    @Test
    void keysSortPrimaryKeysBeforeForeignKeys() {
        List<Key> keys = new ArrayList<>(List.of(fk("f1"), pk("p1"), fk("f2"), pk("p2")));

        Collections.sort(keys);

        assertThat(names(keys)).containsExactly("pr:p1", "pr:p2", "fo:f1", "fo:f2");
        assertThat(pk("p").compareTo(fk("f"))).isNegative();
        assertThat(fk("f").compareTo(pk("p"))).isPositive();
        System.out.println("[DatasourceStructureOrderingTest] sorted keys " + names(keys));
    }

    @Test
    void primaryKeysSortByNameAndANullNamedOneSortsAfterNamedOnes() {
        List<Key> keys = new ArrayList<>(List.of(pk("b"), pk(null), pk("a")));

        Collections.sort(keys);

        assertThat(names(keys)).containsExactly("pr:a", "pr:b", "pr:null");
        assertThat(pk("a").compareTo(pk("b"))).isNegative();
        assertThat(pk("b").compareTo(pk("a"))).isPositive();
        assertThat(pk("a").compareTo(pk(null))).as("a named key is before a null-named one").isNegative();
        assertThat(pk(null).compareTo(pk("a"))).isPositive();
        System.out.println("[DatasourceStructureOrderingTest] sorted primary keys " + names(keys));
    }

    @Test
    void foreignKeysCompareEqualAndKeepTheirOrder() {
        List<Key> keys = new ArrayList<>(List.of(fk("z"), fk("a"), fk("m")));

        assertThat(fk("z").compareTo(fk("a"))).isZero();
        Collections.sort(keys);

        assertThat(names(keys)).as("a stable sort keeps the insertion order of equal keys").containsExactly("fo:z", "fo:a", "fo:m");
    }

    /**
     * BF-095 (the plan section 9 row on the {@code Key.compareTo} comparator contract, was pinned): two primary keys with
     * null names compare equal, so the comparator is antisymmetric, and the fixed alternating list of 40 primary keys
     * (null name on even positions) that made {@code Collections.sort} (TimSort, JDK 17) throw "Comparison method violates
     * its general contract" sorts: the named keys by name, then the null-named ones.
     */
    @Test
    void twoNullNamedPrimaryKeysCompareEqualAndAListWithManyOfThemSortsBF095() {
        PrimaryKey first = pk(null);
        PrimaryKey second = pk(null);

        assertThat(first.compareTo(second)).isZero();
        assertThat(second.compareTo(first)).as("antisymmetric: both directions are 0").isZero();

        List<Key> keys = new ArrayList<>();
        List<String> expected = new ArrayList<>();
        for (int i = 0; i < TIMSORT_MERGE_SIZE; i++) {
            keys.add(pk(i % 2 == 0 ? null : "k" + i));
            if (i % 2 != 0) {
                expected.add("pr:k" + i);
            }
        }
        Collections.sort(expected);
        for (int i = 0; i < TIMSORT_MERGE_SIZE / 2; i++) {
            expected.add("pr:null");
        }

        Collections.sort(keys);

        System.out.println("[DatasourceStructureOrderingTest] sorted " + TIMSORT_MERGE_SIZE + " keys with alternating null names: " + names(keys));
        assertThat(names(keys)).containsExactlyElementsOf(expected);
    }

    @Test
    void columnsSortByNameAndANullNamedOtherSortsFirst() {
        List<Column> columns = new ArrayList<>(List.of(column("b"), column("c"), column("a")));

        Collections.sort(columns);

        assertThat(columns).extracting(Column::getName).containsExactly("a", "b", "c");
        assertThat(column("a").compareTo(column(null))).as("against a null-named other the column is greater").isEqualTo(1);
    }

    /**
     * Pins today's behaviour (not a defect: column names come from database metadata and are never null):
     * {@code Column.compareTo} dereferences its own name, so a null-named column throws a NullPointerException.
     */
    @Test
    void columnWithoutNameThrowsNullPointerExceptionWhenCompared() {
        assertThatThrownBy(() -> column(null).compareTo(column("a"))).isInstanceOf(NullPointerException.class);
    }

    @Test
    void tableAppendsColumnsAndKeysAndTheStructurePayloadOmitsTemplates() {
        Table table = new Table(TableType.TABLE, "public", "users", new ArrayList<>(), new ArrayList<>(),
                List.of(new Template("select", "select * from users")));
        table.addColumn(column("id"));
        table.addColumn(column("name"));
        table.addKey(pk("users_pk"));
        table.addKey(fk("users_fk"));

        assertThat(table.getColumns()).extracting(Column::getName).containsExactly("id", "name");
        assertThat(table.getKeys()).hasSize(2);

        String json = JsonUtils.toJson(new DatasourceStructure(List.of(table)));
        System.out.println("[DatasourceStructureOrderingTest] structure json " + json);
        assertThat(json).contains("\"type\":\"TABLE\"").contains("\"type\":\"primary key\"").contains("\"type\":\"foreign key\"");
        assertThat(json).as("templates are @JsonIgnore: they must not leak into the structure payload")
                .doesNotContain("templates").doesNotContain("select * from users");
    }

    @Test
    void templateConstructorsKeepTheConfigurationOfTheirType() {
        List<Property> properties = List.of(new Property("k", "v"));
        Map<String, Object> map = Map.of("a", 1);

        Template withProperties = new Template("t1", "body1", properties);
        Template withMap = new Template("t2", "body2", map);
        Template withoutConfiguration = new Template("t3", "body3");

        assertThat(withProperties.getConfiguration()).isSameAs(properties);
        assertThat(withMap.getConfiguration()).isSameAs(map);
        assertThat(withoutConfiguration.getConfiguration()).isNull();
        assertThat(withoutConfiguration.getTitle()).isEqualTo("t3");
        assertThat(withoutConfiguration.getBody()).isEqualTo("body3");
        assertThat(new DatasourceStructure().getTables()).isNull();
        assertThat(TableType.valueOf("COLLECTION")).isEqualTo(TableType.COLLECTION);
    }
}
