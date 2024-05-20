package org.lowcoder.domain.bundle.model;


import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
@NoArgsConstructor
public class Bundle extends HasIdAndAuditing {

    private String userId;
    @Nullable
    private String name;
    private String title;
    private String description;
    private String category;
    private String type;
    private String image;
}
