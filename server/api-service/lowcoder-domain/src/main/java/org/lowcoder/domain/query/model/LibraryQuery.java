package org.lowcoder.domain.query.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;
import java.util.function.Supplier;

import static com.google.common.base.Suppliers.memoize;

@Document
@Getter
@Setter
@SuperBuilder
@Jacksonized
@NoArgsConstructor
public class LibraryQuery extends HasIdAndAuditing {

    private String gid;
    private String organizationId;
    private String name;
    private Map<String, Object> libraryQueryDSL;

    @Transient
    private final Supplier<BaseQuery> baseQuerySupplier = memoize(() ->
            JsonUtils.fromJson(JsonUtils.toJson(getLibraryQueryDSL().get("query")), BaseQuery.class));

    @Transient
    public BaseQuery getQuery() {
        return baseQuerySupplier.get();
    }

}
