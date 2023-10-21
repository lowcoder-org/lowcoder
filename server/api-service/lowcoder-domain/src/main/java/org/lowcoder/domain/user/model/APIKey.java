package org.lowcoder.domain.user.model;

import lombok.Getter;
import lombok.Setter;

import javax.annotation.Nullable;
import java.util.function.Function;

@Getter
@Setter
public class APIKey {

    private String id;
    private String name;
    private String description;
    private String token;

    public APIKey(@Nullable String id, String name, String description, String token) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.token = token;
    }

    public void doEncrypt(Function<String, String> encryptFunc) {
        this.token = encryptFunc.apply(token);
    }

    public void doDecrypt(Function<String, String> decryptFunc) {
        this.token = decryptFunc.apply(token);
    }

}
