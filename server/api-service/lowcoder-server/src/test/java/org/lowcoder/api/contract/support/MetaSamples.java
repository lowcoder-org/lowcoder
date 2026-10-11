package org.lowcoder.api.contract.support;

import org.lowcoder.api.meta.MetaEndpoints.GetMetaDataRequest;
import org.lowcoder.api.meta.view.ApplicationMetaView;
import org.lowcoder.api.meta.view.BundleMetaView;
import org.lowcoder.api.meta.view.DatasourceMetaView;
import org.lowcoder.api.meta.view.FolderMetaView;
import org.lowcoder.api.meta.view.GroupMetaView;
import org.lowcoder.api.meta.view.LibraryQueryMetaView;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.api.meta.view.OrgMetaView;
import org.lowcoder.api.meta.view.UserMetaView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.user.model.User;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Samples of the meta types of WP7 (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T7.1), with the conventions of
 * {@link PayloadSamples}. Each view comes with the entity {@code <View>.of} builds it from, made from the same prefix,
 * so that {@code MetaController}, given the entities, assembles exactly the {@link #metaView()} sample:
 * {@code <prefix>.id}, {@code <prefix>.name} and so on.
 */
public final class MetaSamples {

    /** Indices of the two elements every list of the samples has (§3.3 rule 2). */
    public static final List<Integer> ELEMENTS = List.of(0, 1);
    public static final String APPS = "MetaView.apps";
    public static final String USERS = "MetaView.users";
    public static final String ORGS = "MetaView.orgs";
    public static final String FOLDERS = "MetaView.folders";
    public static final String DATASOURCES = "MetaView.datasources";
    public static final String BUNDLES = "MetaView.bundles";
    public static final String GROUPS = "MetaView.groups";
    public static final String QUERIES = "MetaView.queries";
    /** The application DSL's {@code settings} keys that {@code Application#getTitle} and its siblings read. */
    public static final List<String> APPLICATION_SETTINGS = List.of("title", "description", "category", "icon");

    private MetaSamples() {
    }

    /** {@code MetaEndpoints#getMetaData}; each list names the ids of the {@link #metaView()} elements of its kind. */
    public static GetMetaDataRequest getMetaDataRequest() {
        return new GetMetaDataRequest(ids(APPS), ids(ORGS), ids(USERS), ids(GROUPS), ids(BUNDLES), ids(DATASOURCES), ids(FOLDERS), ids(QUERIES));
    }

    public static MetaView metaView() {
        return MetaView.builder()
                .apps(two(APPS, MetaSamples::applicationMetaView))
                .users(two(USERS, MetaSamples::userMetaView))
                .orgs(two(ORGS, MetaSamples::orgMetaView))
                .folders(two(FOLDERS, MetaSamples::folderMetaView))
                .datasources(two(DATASOURCES, MetaSamples::datasourceMetaView))
                .bundles(two(BUNDLES, MetaSamples::bundleMetaView))
                .groups(two(GROUPS, MetaSamples::groupMetaView))
                .queries(two(QUERIES, MetaSamples::libraryQueryMetaView))
                .build();
    }

    /** {@code <list>[0]} and {@code <list>[1]}, the element prefixes of one list. */
    public static List<String> prefixes(String list) {
        return ELEMENTS.stream().map(index -> list + "[" + index + "]").toList();
    }

    /** An {@code ArrayList}, the class Jackson binds a JSON array of a {@code List} property to. */
    private static List<String> ids(String list) {
        return new ArrayList<>(prefixes(list).stream().map(prefix -> prefix + ".id").toList());
    }

    private static <T> List<T> two(String list, Function<String, T> factory) {
        return new ArrayList<>(prefixes(list).stream().map(factory).toList());
    }

    public static ApplicationMetaView applicationMetaView() {
        return applicationMetaView("ApplicationMetaView");
    }

    static ApplicationMetaView applicationMetaView(String prefix) {
        return ApplicationMetaView.builder().id(prefix + ".id").name(prefix + ".name").title(prefix + ".title")
                .description(prefix + ".description").category(prefix + ".category").icon(prefix + ".icon").build();
    }

    /** The application {@link #applicationMetaView(String)} is built from: title, description, category and icon come from its DSL's settings. */
    public static Application application(String prefix) {
        Map<String, Object> settings = new LinkedHashMap<>();
        APPLICATION_SETTINGS.forEach(key -> settings.put(key, prefix + "." + key));
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put("settings", settings);
        return Application.builder().id(prefix + ".id").name(prefix + ".name").editingApplicationDSL(dsl).build();
    }

    public static UserMetaView userMetaView() {
        return userMetaView("UserMetaView");
    }

    static UserMetaView userMetaView(String prefix) {
        return UserMetaView.builder().id(prefix + ".id").name(prefix + ".name").email(prefix + ".email").build();
    }

    public static User user(String prefix) {
        return User.builder().id(prefix + ".id").name(prefix + ".name").email(prefix + ".email").build();
    }

    public static OrgMetaView orgMetaView() {
        return orgMetaView("OrgMetaView");
    }

    static OrgMetaView orgMetaView(String prefix) {
        return OrgMetaView.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static Organization organization(String prefix) {
        return Organization.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static FolderMetaView folderMetaView() {
        return folderMetaView("FolderMetaView");
    }

    static FolderMetaView folderMetaView(String prefix) {
        return FolderMetaView.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static Folder folder(String prefix) {
        Folder folder = new Folder();
        folder.setId(prefix + ".id");
        folder.setName(prefix + ".name");
        return folder;
    }

    public static DatasourceMetaView datasourceMetaView() {
        return datasourceMetaView("DatasourceMetaView");
    }

    static DatasourceMetaView datasourceMetaView(String prefix) {
        return DatasourceMetaView.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static Datasource datasource(String prefix) {
        return Datasource.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static BundleMetaView bundleMetaView() {
        return bundleMetaView("BundleMetaView");
    }

    static BundleMetaView bundleMetaView(String prefix) {
        return BundleMetaView.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static Bundle bundle(String prefix) {
        return Bundle.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static GroupMetaView groupMetaView() {
        return groupMetaView("GroupMetaView");
    }

    static GroupMetaView groupMetaView(String prefix) {
        return GroupMetaView.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    /** A plain group: neither the all-users nor the dev group, whose names {@code Group#getName(Locale)} localizes. */
    public static Group group(String prefix) {
        return Group.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static LibraryQueryMetaView libraryQueryMetaView() {
        return libraryQueryMetaView("LibraryQueryMetaView");
    }

    static LibraryQueryMetaView libraryQueryMetaView(String prefix) {
        return LibraryQueryMetaView.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    public static LibraryQuery libraryQuery(String prefix) {
        return LibraryQuery.builder().id(prefix + ".id").name(prefix + ".name").build();
    }

    /** {@code UserServiceImpl#getByIds}' answer: users by id, in insertion order. */
    public static Map<String, User> usersById(String list) {
        Map<String, User> users = new LinkedHashMap<>();
        prefixes(list).forEach(prefix -> users.put(prefix + ".id", user(prefix)));
        return users;
    }
}
