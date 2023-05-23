package org.lowcoder.domain.mongodb;

public interface BeforeMongodbWrite {

    void beforeMongodbWrite(MongodbInterceptorContext context);
}
