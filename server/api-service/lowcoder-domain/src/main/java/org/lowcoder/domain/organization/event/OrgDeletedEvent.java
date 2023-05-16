package org.lowcoder.domain.organization.event;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrgDeletedEvent {

    private String orgId;

}
