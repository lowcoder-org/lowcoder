package org.lowcoder.domain.mongodb;

import org.lowcoder.domain.encryption.EncryptionService;

public record MongodbInterceptorContext(EncryptionService encryptionService) {
}
