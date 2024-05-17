package org.lowcoder.domain.serversetting.model;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.http.MediaType;

@Document(collection = "serverSettings")
@Jacksonized
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ServerSetting {

    @Id
    private String key;
    private String value;
}
