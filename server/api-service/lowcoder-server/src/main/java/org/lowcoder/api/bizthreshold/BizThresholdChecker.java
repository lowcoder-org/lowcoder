package org.lowcoder.api.bizthreshold;

import java.util.Collections;
import java.util.Map;

import jakarta.annotation.PostConstruct;

import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@Service
public class BizThresholdChecker extends AbstractBizThresholdChecker {

	@Value("${default.orgsPerUser:100}")
	private int defaultMaxOrgPerUser;

	@Value("${default.maxOrgMemberCount:1000}")
	private int defaultMaxOrgMemberCount;

	@Value("${default.maxOrgGroupCount:100}")
	private int defaultMaxOrgGroupCount;

	@Value("${default.maxOrgAppCount:1000}")
	private int defaultMaxOrgAppCount;

	@Value("${default.maxDeveloperCount:100}")
	private int defaultMaxDeveloperCount;

    @Autowired
    private ConfigCenter configCenter;

    private Conf<Integer> maxOrgPerUser;
    private Conf<Integer> maxOrgMemberCount;
    private Conf<Integer> maxOrgGroupCount;
    private Conf<Integer> maxOrgAppCount;
    private Conf<Map<String, Integer>> userOrgCountWhiteList;
    private Conf<Map<String, Integer>> orgMemberCountWhiteList;
    private Conf<Map<String, Integer>> orgAppCountWhiteList;
    private Conf<Integer> maxDeveloperCount;

    @PostConstruct
    private void init() {
        ConfigInstance threshold = configCenter.threshold();
        maxOrgPerUser = threshold.ofInteger("maxOrgPerUser", defaultMaxOrgPerUser);
        userOrgCountWhiteList = threshold.ofMap("userOrgCountWhiteList", String.class, Integer.class, Collections.emptyMap());
        maxOrgMemberCount = threshold.ofInteger("maxOrgMemberCount", defaultMaxOrgMemberCount);
        orgMemberCountWhiteList = threshold.ofMap("orgMemberCountWhiteList", String.class, Integer.class, Collections.emptyMap());
        maxOrgGroupCount = threshold.ofInteger("maxOrgGroupCount", defaultMaxOrgGroupCount);
        maxOrgAppCount = threshold.ofInteger("maxOrgAppCount", defaultMaxOrgAppCount);
        orgAppCountWhiteList = threshold.ofMap("orgAppCountWhiteList", String.class, Integer.class, Collections.emptyMap());
        maxDeveloperCount = threshold.ofInteger("maxDeveloperCount", defaultMaxDeveloperCount);
    }

    @Override
    protected int getMaxOrgPerUser() {
        return maxOrgPerUser.get();
    }

    @Override
    protected int getMaxOrgMemberCount() {
        return maxOrgMemberCount.get();
    }

    @Override
    protected int getMaxOrgGroupCount() {
        return maxOrgGroupCount.get();
    }

    @Override
    protected int getMaxOrgAppCount() {
        return maxOrgAppCount.get();
    }

    @Override
    protected Map<String, Integer> getUserOrgCountWhiteList() {
        return userOrgCountWhiteList.get();
    }

    @Override
    protected Map<String, Integer> getOrgMemberCountWhiteList() {
        return orgMemberCountWhiteList.get();
    }

    @Override
    protected Map<String, Integer> getOrgAppCountWhiteList() {
        return orgAppCountWhiteList.get();
    }

    @Override
    protected Mono<Integer> getMaxDeveloperCount() {
        return Mono.just(maxDeveloperCount.get());
    }
}
