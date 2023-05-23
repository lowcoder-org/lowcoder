package org.lowcoder.domain.mongodb;

public interface AfterMongodbRead {

    void afterMongodbRead(MongodbInterceptorContext context);
}
