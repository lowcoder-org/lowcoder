package org.lowcoder.domain.mongodb;

import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.event.BeforeSaveEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterConvertEvent;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class MongodbEventListener<E> extends AbstractMongoEventListener<E> {

    @Autowired
    private EncryptionService encryptionService;

    @Override
    public void onBeforeConvert(BeforeConvertEvent<E> event) {
        E source = event.getSource();

        if (source instanceof BeforeMongodbWrite beforeMongodbWrite) {
            beforeMongodbWrite.beforeMongodbWrite(new MongodbInterceptorContext(encryptionService));
        }
    }

    @Override
    public void onAfterConvert(AfterConvertEvent<E> event) {
        E source = event.getSource();

        if (source instanceof AfterMongodbRead afterMongodbRead) {
            afterMongodbRead.afterMongodbRead(new MongodbInterceptorContext(encryptionService));
        }
    }

    /**
     * Only for {@link MongoUpsertHelper}
     */
    @EventListener
    public <T> void onBeforeSaveEvent(BeforeSaveEvent<T> beforeSaveEvent) {
        T source = beforeSaveEvent.source();

        if (source instanceof BeforeMongodbWrite beforeMongodbWrite) {
            beforeMongodbWrite.beforeMongodbWrite(new MongodbInterceptorContext(encryptionService));
        }
    }
}
