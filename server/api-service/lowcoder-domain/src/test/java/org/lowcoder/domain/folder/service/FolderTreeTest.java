package org.lowcoder.domain.folder.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * Decisions of the live folder tree {@code Tree / FolderNode / ElementNode} (unit U2 rescoped, task L3-8) that
 * lowcoder-server's TreeTest does not cover: root and orphan mounting of elements, parent links and depth, the delete
 * cascade list, the post-order contract, duplicate ids, the root's unsupported accessors and the child ordering.
 * The bundle copy of these classes has no production caller and is deliberately not tested.
 */
class FolderTreeTest {

    record Fo(String id, String parent, String name, long view) {
        Fo(String id, String parent) {
            this(id, parent, id, 0);
        }
    }

    record El(String name, long view, String parent) {
        El(String name, String parent) {
            this(name, 0, parent);
        }
    }

    private static Tree<El, Fo> tree(List<Fo> folders, List<El> elements, Comparator<Node<El, Fo>> comparator) {
        return new Tree<>(folders, Fo::id, Fo::parent, elements, El::parent, comparator);
    }

    private static String label(Node<El, Fo> node) {
        if (node instanceof Tree<El, Fo>) {
            return "ROOT";
        }
        if (node instanceof ElementNode<El, Fo> element) {
            return element.getSelf().name();
        }
        return ((FolderNode<El, Fo>) node).getSelf().id();
    }

    /** Same shape as FolderApiServiceImpl.DEFAULT_COMPARATOR (last view time reversed, then name) on the test records. */
    private static final Comparator<Node<El, Fo>> VIEW_TIME_DESC_THEN_NAME =
            Comparator.comparingLong((Node<El, Fo> node) -> node instanceof ElementNode<El, Fo> element
                            ? element.getSelf().view() : ((FolderNode<El, Fo>) node).getSelf().view())
                    .reversed()
                    .thenComparing(node -> node instanceof ElementNode<El, Fo> element
                            ? element.getSelf().name() : ((FolderNode<El, Fo>) node).getSelf().name());

    /** Catches: null, empty or blank parent ids not meaning "root", and the kinds being mixed up by the accessors. */
    @Test
    void blankParentIdsMountUnderTheRootAndAccessorsSeparateTheKinds() {
        Tree<El, Fo> tree = tree(List.of(new Fo("f-null", null), new Fo("f-empty", ""), new Fo("f-blank", "  ")),
                List.of(new El("e-null", null), new El("e-empty", ""), new El("e-blank", " ")), null);

        System.out.println("[FolderTreeTest] root folders=" + tree.getFolderChildren() + " elements=" + tree.getElementChildren());
        assertThat(tree.getFolderChildren()).extracting(Fo::id).containsExactlyInAnyOrder("f-null", "f-empty", "f-blank");
        assertThat(tree.getElementChildren()).extracting(El::name).containsExactly("e-null", "e-empty", "e-blank");
    }

    /** Catches: wrong parent links, depth off by one, and an element mounted at the wrong level. */
    @Test
    void nestedNodesGetTheirParentLinkAndDepth() {
        Fo f1 = new Fo("f1", null);
        Fo f2 = new Fo("f2", "f1");
        Tree<El, Fo> tree = tree(List.of(f1, f2), List.of(new El("e2", "f2")), null);

        FolderNode<El, Fo> n1 = tree.get("f1");
        FolderNode<El, Fo> n2 = tree.get("f2");
        System.out.println("[FolderTreeTest] depths root=" + tree.depth() + " f1=" + n1.depth() + " f2=" + n2.depth());
        assertThat(tree.depth()).isEqualTo(1);
        assertThat(n1.depth()).isEqualTo(2);
        assertThat(n2.depth()).isEqualTo(3);
        assertThat(n1.getParent()).isSameAs(tree);
        assertThat(n2.getParent()).isSameAs(n1);
        assertThat(n1.getFolderChildren()).containsExactly(f2);
        assertThat(n2.getElementChildren()).extracting(El::name).containsExactly("e2");
        assertThat(n2.getChildren().iterator().next()).isInstanceOf(ElementNode.class);
        assertThat(((ElementNode<El, Fo>) n2.getChildren().iterator().next()).getParent()).isSameAs(n2);
    }

    /** Catches: an element whose folder is unknown (deleted, or filtered out) vanishing from the listing. */
    @Test
    void anElementWithAnUnknownFolderIsKeptAtTheRoot() {
        Tree<El, Fo> tree = tree(List.of(new Fo("f1", null)), List.of(new El("orphan", "gone"), new El("child", "f1")), null);

        assertThat(tree.getElementChildren()).extracting(El::name).containsExactly("orphan");
        assertThat(tree.get("f1").getElementChildren()).extracting(El::name).containsExactly("child");
        assertThat(((ElementNode<El, Fo>) tree.getChildren().stream().filter(n -> n instanceof ElementNode).findFirst().orElseThrow())
                .getParent()).isSameAs(tree);
        System.out.println("[FolderTreeTest] orphan element kept at the root, parent link is the root");
    }

    /** Catches: wrong fallback of get(): blank means the root, unknown means null (turned into FOLDER_NOT_EXIST by the caller). */
    @Test
    void getReturnsTheRootForBlankTheNodeForKnownAndNullForUnknown() {
        Tree<El, Fo> tree = tree(List.of(new Fo("f1", null)), List.of(), null);

        assertThat(tree.get(null)).isSameAs(tree);
        assertThat(tree.get("")).isSameAs(tree);
        assertThat(tree.get("  ")).isSameAs(tree);
        assertThat(tree.get("f1").getSelf().id()).isEqualTo("f1");
        assertThat(tree.get("missing")).isNull();
    }

    /** Catches: the delete cascade (FolderApiServiceImpl:152) missing descendants, listing the null root or elements. */
    @Test
    void allFolderChildrenAreTheNestedFoldersChildrenFirstWithoutElementsOrTheRoot() {
        Fo f1 = new Fo("f1", null);
        Fo f2 = new Fo("f2", "f1");
        Fo f3 = new Fo("f3", "f2");
        Tree<El, Fo> tree = tree(List.of(f1, f2, f3), List.of(new El("e1", "f1"), new El("e3", "f3")), null);

        List<Fo> all = tree.getAllFolderChildren();
        System.out.println("[FolderTreeTest] all folders under the root: " + all);
        assertThat(all).containsExactly(f3, f2, f1).doesNotContainNull();
        assertThat(tree.get("f1").getAllFolderChildren()).containsExactly(f3, f2);
        assertThat(tree.get("f3").getAllFolderChildren()).isEmpty();
    }

    /** Catches: the visibility pass of getElements seeing a parent before its children (children first, root last). */
    @Test
    void postOrderVisitsChildrenBeforeTheirFolderAndTheRootLast() {
        Tree<El, Fo> tree = tree(List.of(new Fo("f1", null), new Fo("f2", "f1")),
                List.of(new El("e0", null), new El("e1", "f1"), new El("e2", "f2")), null);

        List<String> visited = new ArrayList<>();
        tree.postOrderIterate(node -> visited.add(label(node)));
        System.out.println("[FolderTreeTest] post-order: " + visited);
        assertThat(visited).containsExactly("e2", "f2", "e1", "f1", "e0", "ROOT");
    }

    /** Catches: duplicate folder ids silently overwriting each other instead of failing the build of the tree. */
    @Test
    void duplicateFolderIdsAreRejected() {
        assertThatThrownBy(() -> tree(List.of(new Fo("dup", null), new Fo("dup", null)), List.of(), null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("dup");
    }

    /** Catches: the root pretending to have an id or a parent id. */
    @Test
    void theRootHasNoIdOrParentId() {
        Tree<El, Fo> tree = tree(List.of(), List.of(), null);
        assertThrows(UnsupportedOperationException.class, tree::id);
        assertThrows(UnsupportedOperationException.class, tree::parentId);
        assertThat(tree.toString()).startsWith("Tree{maxDepth=1");
    }

    /** Catches: the no-comparator tree reordering children. */
    @Test
    void withoutAComparatorChildrenKeepTheirInsertionOrder() {
        Tree<El, Fo> tree = tree(List.of(), List.of(new El("e3", 3, null), new El("e1", 1, null), new El("e2", 2, null)), null);
        assertThat(tree.getElementChildren()).extracting(El::name).containsExactly("e3", "e1", "e2");
    }

    /**
     * Pins plan section 9 row "folder listings in heap order, FolderNode:29". With a comparator the children are a
     * PriorityQueue and every accessor streams its heap array, so only the first child is guaranteed to be the
     * comparator minimum. FolderApiServiceImpl.DEFAULT_COMPARATOR (last view time reversed, then name; used for the
     * home listing at :349) is private in lowcoder-server and works on server view classes, so it is UNREACHABLE from the
     * domain module; VIEW_TIME_DESC_THEN_NAME above, the same ordering on the test records, is used instead.
     * Today 8 elements with view times 1..8 come back as e8, e7, e6, e4, e3, e2, e5, e1 instead of e8 ... e1. A fix
     * (drain the queue in comparator order) changes this test on purpose.
     */
    @Test
    void pinsHeapOrderOfChildrenWhenAComparatorIsGiven() {
        List<El> elements = new ArrayList<>();
        for (int i = 1; i <= 8; i++) {
            elements.add(new El("e" + i, i, null));
        }
        Tree<El, Fo> tree = tree(List.of(), elements, VIEW_TIME_DESC_THEN_NAME);

        List<String> viaAccessor = tree.getElementChildren().stream().map(El::name).toList();
        List<String> viaPostOrder = new ArrayList<>();
        tree.postOrderIterate(node -> viaPostOrder.add(label(node)));
        System.out.println("[FolderTreeTest] PINNED heap order: " + viaAccessor + " (comparator order is e8..e1)");

        assertThat(viaAccessor.get(0)).isEqualTo("e8");
        assertThat(viaAccessor).containsExactly("e8", "e7", "e6", "e4", "e3", "e2", "e5", "e1");
        assertThat(viaPostOrder).containsExactly("e8", "e7", "e6", "e4", "e3", "e2", "e5", "e1", "ROOT");
    }

    /**
     * Pins plan section 9 row "self or cyclic parent: vanishes from listings; depth / getAllFolderChildren /
     * postOrderIterate StackOverflowError" for the self-parent case: a folder whose parent id is its own id is mounted
     * under itself, is missing from the root's listing and recurses forever. A fix (a self-parent guard) changes this
     * test on purpose.
     */
    @Test
    void pinsASelfParentedFolderVanishingAndOverflowingTheStack() {
        Fo self = new Fo("x", "x");
        Tree<El, Fo> tree = tree(List.of(self, new Fo("ok", null)), List.of(), null);
        FolderNode<El, Fo> node = tree.get("x");

        System.out.println("[FolderTreeTest] PINNED self parent: root folders=" + tree.getFolderChildren());
        assertThat(tree.getFolderChildren()).extracting(Fo::id).containsExactly("ok");
        assertThat(tree.getAllFolderChildren()).extracting(Fo::id).containsExactly("ok");
        assertThat(node.getParent()).isSameAs(node);
        assertThat(node.getFolderChildren()).containsExactly(self);
        assertThrows(StackOverflowError.class, node::depth);
        assertThrows(StackOverflowError.class, node::getAllFolderChildren);
        assertThrows(StackOverflowError.class, () -> node.postOrderIterate(n -> { }));
    }

    /** Same pinned row for a two-folder cycle a -> b -> a: neither is reachable from the root, all walks overflow. */
    @Test
    void pinsATwoFolderCycleVanishingAndOverflowingTheStack() {
        Tree<El, Fo> tree = tree(List.of(new Fo("a", "b"), new Fo("b", "a"), new Fo("ok", null)), List.of(), null);

        System.out.println("[FolderTreeTest] PINNED cycle: root folders=" + tree.getFolderChildren());
        assertThat(tree.getFolderChildren()).extracting(Fo::id).containsExactly("ok");
        assertThat(tree.getAllFolderChildren()).extracting(Fo::id).containsExactly("ok");
        assertThat(tree.get("a").getParent()).isSameAs(tree.get("b"));
        assertThrows(StackOverflowError.class, () -> tree.get("a").depth());
        assertThrows(StackOverflowError.class, () -> tree.get("b").getAllFolderChildren());
        assertThrows(StackOverflowError.class, () -> tree.get("a").postOrderIterate(n -> { }));
    }
}
