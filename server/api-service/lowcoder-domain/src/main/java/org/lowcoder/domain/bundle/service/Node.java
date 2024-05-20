package org.lowcoder.domain.bundle.service;

public interface Node<T, F> {

    String parentId();

    void setParent(BundleNode<T, F> bundleNode);
}