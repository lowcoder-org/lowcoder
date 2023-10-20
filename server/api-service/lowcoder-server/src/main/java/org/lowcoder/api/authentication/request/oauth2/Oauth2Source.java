package org.lowcoder.api.authentication.request.oauth2;

public interface Oauth2Source {

    String accessToken();

    String userInfo();

    String refresh();

    default String getName() {
        if (this instanceof Enum) {
            return String.valueOf(this);
        }
        return this.getClass().getSimpleName();
    }
}
