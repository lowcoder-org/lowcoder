package org.lowcoder.sdk.config;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "material")
public class MaterialProperties {

    private Mongodb mongodbGridFs = new Mongodb();

    @Data
    public static class Mongodb {
        private String bucketName;
    }
}
