package org.lowcoder.api.authentication.request;

public class AuthException extends RuntimeException {

    public AuthException(Object o) {
        super(o.toString());
    }
}
