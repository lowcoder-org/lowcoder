package org.lowcoder.domain.interaction;

import java.time.Instant;

import org.apache.commons.lang3.math.NumberUtils;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;

import com.google.common.base.Preconditions;

public record UserApplicationInteraction(String userId, String applicationId, Instant lastViewTime) {

    public BiRelation toBiRelation() {
        return BiRelation.builder()
                .bizType(BiRelationBizType.USER_APP_INTERACTION)
                .sourceId(userId)
                .targetId(applicationId)
                .extParam1(lastViewTime.toEpochMilli() + "")
                .build();
    }

    public static UserApplicationInteraction of(BiRelation biRelation) {
        Preconditions.checkArgument(biRelation.getBizType() == BiRelationBizType.USER_APP_INTERACTION);
        return new UserApplicationInteraction(biRelation.getSourceId(),
                biRelation.getTargetId(),
                Instant.ofEpochMilli(NumberUtils.toLong(biRelation.getExtParam1())));
    }
}
