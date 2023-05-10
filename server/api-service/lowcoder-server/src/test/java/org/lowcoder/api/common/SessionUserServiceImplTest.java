package org.lowcoder.api.common;

import org.lowcoder.api.home.SessionUserServiceImpl;
import org.lowcoder.domain.organization.model.OrgMember;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@Primary
@Service
public class SessionUserServiceImplTest extends SessionUserServiceImpl {

    @Override
    public Mono<OrgMember> getVisitorOrgMemberCache() {
        return super.getVisitorOrgMember();
    }
}
