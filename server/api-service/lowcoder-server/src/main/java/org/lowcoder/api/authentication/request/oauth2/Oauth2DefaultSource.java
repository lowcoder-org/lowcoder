package org.lowcoder.api.authentication.request.oauth2;

import org.lowcoder.sdk.auth.constants.Oauth2Constants;

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
            return "https://github.com/login/oauth/access_token";
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

    },

    ORY {
        @Override
        public String accessToken() {
            return Oauth2Constants.BASE_URL_PLACEHOLDER + "/oauth2/token";
        }

        @Override
        public String userInfo() {
            return Oauth2Constants.BASE_URL_PLACEHOLDER + "/userinfo";
        }

        @Override
        public String refresh() {
            return Oauth2Constants.BASE_URL_PLACEHOLDER + "/oauth2/token";
        }

    },
    
    KEYCLOAK {

        @Override
        public String accessToken() {
            return Oauth2Constants.BASE_URL_PLACEHOLDER + "/realms/" + Oauth2Constants.REALM_PLACEHOLDER + "/protocol/openid-connect/token";
        }

        @Override
        public String userInfo() {
            return Oauth2Constants.BASE_URL_PLACEHOLDER + "/realms/" + Oauth2Constants.REALM_PLACEHOLDER + "/protocol/openid-connect/userinfo";
        }

        @Override
        public String refresh() {
        	return Oauth2Constants.BASE_URL_PLACEHOLDER + "/realms/" + Oauth2Constants.REALM_PLACEHOLDER + "/protocol/openid-connect/token";
        }
    	
    }
}
