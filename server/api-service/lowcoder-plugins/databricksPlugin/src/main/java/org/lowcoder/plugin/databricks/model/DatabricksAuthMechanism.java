package org.lowcoder.plugin.databricks.model;

public enum DatabricksAuthMechanism {
    PAT_TOKEN(3),
    OAUTH(11),
    DEFAULT(3); // Set this to your preferred default value

    private final int value;

    DatabricksAuthMechanism(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

}