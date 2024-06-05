package org.lowcoder.domain.bundle.service;

import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
public class Tree<T, F> extends BundleNode<T, F> {
    private static final int DEFAULT_DEPTH = 1;
    private final int maxDepth;
    private final Map<String, BundleNode<T, F>> bundleId2BundleNodeMap;

    public final Function<F, String> bundleNodeIdExtractor;
    public final Function<F, String> bundleNodeParentIdExtractor;
    public final Function<T, String> elementNodeParentIdExtractor;

    public Tree(List<F> bundles,
            Function<F, String> bundleNodeIdExtractor,
            Function<F, String> bundleNodeParentIdExtractor,
            List<T> elements,
            Function<T, String> elementNodeParentIdExtractor,
            @Nullable Comparator<Node<T, F>> comparator) {
        this(bundles, bundleNodeIdExtractor, bundleNodeParentIdExtractor, elements, elementNodeParentIdExtractor, DEFAULT_DEPTH, comparator);
    }

    public Tree(List<F> bundles,
            Function<F, String> bundleNodeIdExtractor,
            Function<F, String> bundleNodeParentIdExtractor,
            List<T> elements,
            Function<T, String> elementNodeParentIdExtractor,
            int maxDepth,
            @Nullable Comparator<Node<T, F>> comparator) {
        super(null, bundleNodeIdExtractor, bundleNodeParentIdExtractor, comparator);
        this.bundleNodeIdExtractor = bundleNodeIdExtractor;
        this.bundleNodeParentIdExtractor = bundleNodeParentIdExtractor;
        this.elementNodeParentIdExtractor = elementNodeParentIdExtractor;
        this.maxDepth = maxDepth;

        this.bundleId2BundleNodeMap = bundles.stream()
                .map(bundle -> new BundleNode<>(bundle, bundleNodeIdExtractor, bundleNodeParentIdExtractor, comparator))
                .collect(Collectors.toMap(BundleNode::id, Function.identity()));
        mount(this.bundleId2BundleNodeMap.values());
        mount(elements.stream().map(element -> new ElementNode<T, F>(element, elementNodeParentIdExtractor)).toList());
    }

    private void mount(Collection<? extends Node<T, F>> nodes) {
        nodes.forEach(node -> {
            if (StringUtils.isBlank(node.parentId())) {
                children.add(node);
                node.setParent(this);
                return;
            }
            BundleNode<T, F> parent = bundleId2BundleNodeMap.get(node.parentId());
            if (parent == null) {
                log.warn("error node: {}", node);
                // parent is not found, still put it in the tree
                children.add(node);
                node.setParent(this);
                return;
            }
            parent.getChildren().add(node);
            node.setParent(parent);
        });
    }

    public BundleNode<T, F> get(@Nullable String bundleId) {
        if (StringUtils.isBlank(bundleId)) {
            return this;
        }
        return bundleId2BundleNodeMap.get(bundleId);
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
