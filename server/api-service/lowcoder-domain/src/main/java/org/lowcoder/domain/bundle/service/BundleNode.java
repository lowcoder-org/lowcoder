package org.lowcoder.domain.bundle.service;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.Setter;

import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;

@Getter
@Setter
public class BundleNode<T, F> implements Node<T, F> {

    private final F self;
    private BundleNode<T, F> parent;
    protected final Collection<Node<T, F>> children;
    @Nonnull
    private final Function<F, String> idExtractor;
    @Nonnull
    private final Function<F, String> parentIdExtractor;

    BundleNode(F self, @Nonnull Function<F, String> idExtractor, @Nonnull Function<F, String> parentIdExtractor,
               @Nullable Comparator<Node<T, F>> comparator) {
        this.self = self;
        this.idExtractor = idExtractor;
        this.parentIdExtractor = parentIdExtractor;
        this.children = comparator == null ? new ArrayList<>() : new PriorityQueue<>(comparator);
    }

    public String id() {
        return idExtractor.apply(self);
    }

    @Override
    public String parentId() {
        return parentIdExtractor.apply(self);
    }

    public final List<F> getBundleChildren() {
        return children.stream()
                .filter(node -> node instanceof BundleNode<T, F>)
                .map(node -> ((BundleNode<T, F>) node).getSelf())
                .toList();
    }

    public final List<T> getElementChildren() {
        return children.stream()
                .filter(node -> node instanceof ElementNode<T, F>)
                .map(node -> ((ElementNode<T, F>) node).getSelf())
                .toList();
    }

    public final List<F> getAllBundleChildren() {
        return this.children.stream()
                .map(node -> {
                    if (node instanceof BundleNode<T, F> bundleNode) {
                        F self = bundleNode.getSelf();
                        List<F> bundleChildren = bundleNode.getAllBundleChildren();
                        List<F> all = new ArrayList<>(bundleChildren);
                        if (self != null) {
                            all.add(self);
                        }
                        return all;
                    }
                    return new ArrayList<F>();
                })
                .flatMap(List::stream)
                .toList();
    }


    /**
     * @param consumer will be called for children node first, then by parent node
     */
    public void postOrderIterate(Consumer<Node<T, F>> consumer) {
        children.forEach(node -> {
            if (node instanceof BundleNode<T, F> bundleNode) {
                bundleNode.postOrderIterate(consumer);
                return;
            }
            consumer.accept(node);
        });
        consumer.accept(this);
    }

    public final int depth() {
        if (parent == null) {
            return 1;
        }
        return parent.depth() + 1;
    }

    @Override
    public String toString() {
        return "BundleNode{" +
                "self=" + self +
                ", children=" + children +
                '}';
    }
}