package org.lowcoder.domain.datasource.model;

import java.util.Map;

import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

/**
 * token based plugin needs to save user token for future reuse
 */
@Document(collection = "tokenBasedConnection")
@Getter
@Setter
@Jacksonized
@SuperBuilder
@NoArgsConstructor
public class TokenBasedConnectionDO extends HasIdAndAuditing {

    private String datasourceId;
    private Map<String, Object> tokenDetail;

}
