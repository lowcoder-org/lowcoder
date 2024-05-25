package org.lowcoder.infra.serverlog;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;


@Document
@Getter
@Builder
@Jacksonized
public class ServerLog {
    private String userId;
    private String orgId;
    private String urlPath;
    private String httpMethod;
    private String requestBody;
    private Map<String, String> queryParameters;
    private long createTime;
}
