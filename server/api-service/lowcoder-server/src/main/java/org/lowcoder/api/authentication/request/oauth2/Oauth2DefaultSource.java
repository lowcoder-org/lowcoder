package org.lowcoder.api.authentication.request.oauth2;

public enum Oauth2DefaultSource implements Oauth2Source {

    GITHUB {
        @Override
        public String accessToken() {
            return "https://github.com/login/oauth/access_token";
        }

        @Override
        public String userInfo() {
            return "https://api.github.com/user";
        }

        @Override
        public String refresh() {
            return "https://www.googleapis.com/oauth2/v4/token";
        }

    },
    GOOGLE {
        @Override
        public String accessToken() {
            return "https://www.googleapis.com/oauth2/v4/token";
        }

        @Override
        public String userInfo() {
            return "https://www.googleapis.com/oauth2/v3/userinfo";
        }

        @Override
        public String refresh() {
            return "https://www.googleapis.com/oauth2/v4/token";
        }

    }
}
