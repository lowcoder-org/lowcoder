package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import reactor.core.publisher.Mono;

@SuperBuilder
@Getter
public class ApplicationMetaView {
    private String id;
    private String name;
    private String title;
    private String description;
    private String category;
    private String icon;

    public static Mono<ApplicationMetaView> of(Application app, ApplicationRecordService applicationRecordService) {
        return Mono.zip(app.getTitle(applicationRecordService),
                        app.getDescription(applicationRecordService),
                        app.getCategory(applicationRecordService),
                        app.getIcon(applicationRecordService)).map(tuple ->
            ApplicationMetaView.builder()
                    .id(app.getId())
                    .name(app.getName())
                    .title(tuple.getT1())
                    .description(tuple.getT2())
                    .category(tuple.getT3())
                    .icon(tuple.getT4())
                    .build());
    }
}
