package org.lowcoder.domain.folder.service;

import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The folder tree of an organization: each folder and element is mounted under the folder its parent id names, or under
 * the root when the parent id is blank or names no folder of the tree.
 * <p>
 * A folder on a parent cycle (its own parent, or a -> b -> a) is mounted under the root too, and its parent link is not
 * followed (BF-077): otherwise it hangs under itself, is not reachable from the root, and {@code depth},
 * {@code getAllFolderChildren} and {@code postOrderIterate} recurse until a {@code StackOverflowError}. Every folder of a
 * cycle goes to the root, so a cycle of two shows both folders at the top level; folders and elements under a cycle member
 * stay under it. The stored parent ids are not changed.
 */
@Slf4j
public class Tree<T, F> extends FolderNode<T, F> {
    private static final int DEFAULT_DEPTH = 1;
    private final int maxDepth;
    private final Map<String, FolderNode<T, F>> folderId2FolderNodeMap;
    private final Set<String> folderIdsOnAParentCycle;

    public final Function<F, String> folderNodeIdExtractor;
    public final Function<F, String> folderNodeParentIdExtractor;
    public final Function<T, String> elementNodeParentIdExtractor;

    public Tree(List<F> folders,
            Function<F, String> folderNodeIdExtractor,
            Function<F, String> folderNodeParentIdExtractor,
            List<T> elements,
            Function<T, String> elementNodeParentIdExtractor,
            @Nullable Comparator<Node<T, F>> comparator) {
        this(folders, folderNodeIdExtractor, folderNodeParentIdExtractor, elements, elementNodeParentIdExtractor, DEFAULT_DEPTH, comparator);
    }

    public Tree(List<F> folders,
            Function<F, String> folderNodeIdExtractor,
            Function<F, String> folderNodeParentIdExtractor,
            List<T> elements,
            Function<T, String> elementNodeParentIdExtractor,
            int maxDepth,
            @Nullable Comparator<Node<T, F>> comparator) {
        super(null, folderNodeIdExtractor, folderNodeParentIdExtractor, comparator);
        this.folderNodeIdExtractor = folderNodeIdExtractor;
        this.folderNodeParentIdExtractor = folderNodeParentIdExtractor;
        this.elementNodeParentIdExtractor = elementNodeParentIdExtractor;
        this.maxDepth = maxDepth;

        this.folderId2FolderNodeMap = folders.stream()
                .map(folder -> new FolderNode<>(folder, folderNodeIdExtractor, folderNodeParentIdExtractor, comparator))
                .collect(Collectors.toMap(FolderNode::id, Function.identity()));
        this.folderIdsOnAParentCycle = findFolderIdsOnAParentCycle();
        mount(this.folderId2FolderNodeMap.values());
        mount(elements.stream().map(element -> new ElementNode<T, F>(element, elementNodeParentIdExtractor)).toList());
        // BF-137: every folder's children, and the root's, in the comparator's order
        this.folderId2FolderNodeMap.values().forEach(FolderNode::sortChildren);
        sortChildren();
    }

    private void mount(Collection<? extends Node<T, F>> nodes) {
        nodes.forEach(node -> {
            if (StringUtils.isBlank(node.parentId())) {
                mountUnderTheRoot(node);
                return;
            }
            if (node instanceof FolderNode<T, F> folder && folderIdsOnAParentCycle.contains(folder.id())) {
                log.warn("folder on a parent cycle, mounted under the root: {}", folder.id());
                mountUnderTheRoot(node);
                return;
            }
            FolderNode<T, F> parent = folderId2FolderNodeMap.get(node.parentId());
            if (parent == null) {
                log.warn("error node: {}", node);
                // parent is not found, still put it in the tree
                mountUnderTheRoot(node);
                return;
            }
            parent.getChildren().add(node);
            node.setParent(parent);
        });
    }

    private void mountUnderTheRoot(Node<T, F> node) {
        children.add(node);
        node.setParent(this);
    }

    /**
     * The ids of the folders whose parent chain comes back to them. Each folder is walked once: a walk follows the parent
     * ids until a blank or unknown parent, or a folder already walked; when that folder is on the current walk, the folders
     * from it to the end of the walk form a cycle.
     */
    private Set<String> findFolderIdsOnAParentCycle() {
        Set<String> onACycle = new HashSet<>();
        Set<String> walked = new HashSet<>();
        for (String start : folderId2FolderNodeMap.keySet()) {
            List<String> walk = new ArrayList<>();
            String current = start;
            while (current != null && walked.add(current)) {
                walk.add(current);
                current = knownParentFolderId(current);
            }
            int cycleStart = current == null ? -1 : walk.indexOf(current);
            if (cycleStart >= 0) {
                onACycle.addAll(walk.subList(cycleStart, walk.size()));
            }
        }
        return onACycle;
    }

    /** The parent id of a folder of the tree when it names a folder of the tree, else null. */
    @Nullable
    private String knownParentFolderId(String folderId) {
        String parentId = folderId2FolderNodeMap.get(folderId).parentId();
        return parentId != null && folderId2FolderNodeMap.containsKey(parentId) ? parentId : null;
    }

    public FolderNode<T, F> get(@Nullable String folderId) {
        if (StringUtils.isBlank(folderId)) {
            return this;
        }
        return folderId2FolderNodeMap.get(folderId);
    }

    @Override
    public String id() {
        throw new UnsupportedOperationException();
    }

    @Override
    public String parentId() {
        throw new UnsupportedOperationException();
    }

    @Override
    public String toString() {
        return "Tree{" +
                "maxDepth=" + maxDepth +
                ", children=" + children +
                '}';
    }
}
