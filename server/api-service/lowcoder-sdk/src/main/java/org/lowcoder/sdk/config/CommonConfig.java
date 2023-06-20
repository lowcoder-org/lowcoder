package org.lowcoder.sdk.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.ListUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "common")
public class CommonConfig {

    private Domain domain = new Domain();
    private Workspace workspace = new Workspace();
    private Encrypt encrypt = new Encrypt();
    private boolean cloud;
    private Security security = new Security();
    private String version;
    private boolean blockHoundEnable;
    private String cookieName;
    private int maxQueryRequestSizeInMb = 10;
    private int maxQueryResponseSizeInMb = 10;
    private Query query = new Query();
    private Cookie cookie = new Cookie();
    private JsExecutor jsExecutor = new JsExecutor();
    private Set<String> disallowedHosts = new HashSet<>();

    public boolean isSelfHost() {
        return !isCloud();
    }

    public boolean isEnterpriseMode() {
        return workspace.getMode() == WorkspaceMode.ENTERPRISE;
    }

    @Data
    public static class Domain {
        private String defaultValue;
    }

    @Data
    public static class Encrypt {
        private String password = "abcd";
        private String salt = "abcd";
    }

    @Setter
    public static class Security {
        private List<String> corsAllowedDomains;
        // support of docker env file.
        private String corsAllowedDomainString;

        private List<ApiEndpoint> forbiddenEndpoints;
        
        public List<String> getAllCorsAllowedDomains() {
            List<String> all = new ArrayList<>();
            if (CollectionUtils.isNotEmpty(corsAllowedDomains)) {
                all.addAll(corsAllowedDomains);
            }
            if (StringUtils.isNotBlank(corsAllowedDomainString)) {
                List<String> domains = Arrays.stream(corsAllowedDomainString.split(",")).toList();
                all.addAll(domains);
            }
            return all;
        }
        
        public List<ApiEndpoint> getForbiddenEndpoints()
        {
        	return ListUtils.emptyIfNull(forbiddenEndpoints);
        }
    }

    @Data
    public static class ApiEndpoint {
    	private HttpMethod method;
    	private String uri;
    }
    
    @Data
    public static class Workspace {

        private WorkspaceMode mode = WorkspaceMode.SAAS;
        private String enterpriseOrgId;
    }

    @Data
    public static class Cookie {

        private long maxAgeInSeconds = Duration.ofDays(30).toSeconds();
    }

    @Data
    public static class JsExecutor {
        private String host;
    }


    @Getter
    @Setter
    public static class Query {
        private long readStructureTimeout = 15000;
    }
}
