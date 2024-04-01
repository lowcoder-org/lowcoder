package org.lowcoder.infra.serverlog;

import java.util.Map;

import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Builder;
import lombok.Getter;


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
