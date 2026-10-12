package org.lowcoder.api.application.marketplace;

import java.time.Instant;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** One durable job and last successful image per locally owned application. */
@Data
@Document("marketplacePreview")
public class MarketplacePreview {
    @Id
    private String id;
    private String desiredHash;
    private String renderedHash;
    private byte[] image;
    private String status;
    private int attempts;
    private Instant nextAttemptAt;
    private Instant leaseUntil;
    private String leaseToken;
}
