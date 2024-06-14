package org.lowcoder.sdk.constants;

import io.micrometer.common.util.StringUtils;

public class FieldName {

    public static final String ORGANIZATION_ID = "organizationId";
    public static final String NAME = "name";
    public static final String ORGANIZATION = "organization";
    public static final String ID = "id";
    public static final String GID = "gid";
    public static final String USER = "user";
    public static final String ASSET = "asset";

    public static String guessFieldNameFromId(String id) {
        if(StringUtils.isEmpty(id)) return ID;
        if(id.contains("-")) return GID;
        return ID;
    }

    public static Boolean isGID(String id) {
       return guessFieldNameFromId(id).equals(GID);
    }

}
