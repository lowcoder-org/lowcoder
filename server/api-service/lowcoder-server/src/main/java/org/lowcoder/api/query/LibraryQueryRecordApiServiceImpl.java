package org.lowcoder.api.query;

import static org.lowcoder.api.util.ViewBuilder.multiBuild;
import static org.lowcoder.sdk.exception.BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.domain.user.service.UserService;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class LibraryQueryRecordApiServiceImpl implements LibraryQueryRecordApiService {

    private final LibraryQueryService libraryQueryService;
    private final LibraryQueryRecordService libraryQueryRecordService;
    private final LibraryQueryApiServiceImpl libraryQueryApiService;
    private final SessionUserService sessionUserService;
    private final OrgDevChecker orgDevChecker;
    private final UserService userService;

    @Override
    public Mono<Map<String, Object>> getRecordDSLFromLibraryQueryCombineId(LibraryQueryCombineId libraryQueryCombineId) {
        return libraryQueryApiService.checkLibraryQueryViewPermission(libraryQueryCombineId.libraryQueryId())
                .then(checkLibraryQueryRecordViewPermission(libraryQueryCombineId))
                .then(Mono.defer(() -> {
                    if (libraryQueryCombineId.isUsingLiveRecord()) {
                        return libraryQueryService.getLiveDSLByLibraryQueryId(libraryQueryCombineId.libraryQueryId());
                    }
                    return libraryQueryRecordService.getById(libraryQueryCombineId.libraryQueryRecordId())
                            .map(LibraryQueryRecord::getLibraryQueryDSL);
                }));
    }

    @Override
    public Mono<Void> delete(String id) {
        return checkLibraryQueryRecordManagementPermission(id)
                .then(libraryQueryRecordService.deleteById(id));
    }

    @Override
    public Mono<List<LibraryQueryRecordMetaView>> getByLibraryQueryId(String libraryQueryId) {
        return libraryQueryApiService.checkLibraryQueryManagementPermission(libraryQueryId)
                .then(libraryQueryRecordService.getByLibraryQueryId(libraryQueryId))
                .flatMap(libraryQueryRecords -> multiBuild(libraryQueryRecords,
                        LibraryQueryRecord::getCreatedBy,
                        userService::getByIds,
                        LibraryQueryRecordMetaView::from
                ));
    }


    Mono<Void> checkLibraryQueryRecordManagementPermission(String libraryQueryRecordId) {
        return orgDevChecker.checkCurrentOrgDev()
                .then(sessionUserService.getVisitorOrgMemberCache())
                .zipWith(libraryQueryRecordService.getById(libraryQueryRecordId)
                        .flatMap(libraryQueryRecord -> libraryQueryService.getById(libraryQueryRecord.getLibraryQueryId())))
                .flatMap(tuple2 -> {
                    OrgMember orgMember = tuple2.getT1();
                    LibraryQuery libraryQuery = tuple2.getT2();
                    if (!orgMember.getOrgId().equals(libraryQuery.getOrganizationId())) {
                        return ofError(LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH");
                    }
                    return Mono.empty();
                });
    }

    Mono<Void> checkLibraryQueryRecordViewPermission(LibraryQueryCombineId libraryQueryCombineId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .zipWith(Mono.defer(() -> {
                    if (libraryQueryCombineId.isUsingLiveRecord()) {
                        return libraryQueryService.getById(libraryQueryCombineId.libraryQueryId());
                    }
                    return libraryQueryRecordService.getById(libraryQueryCombineId.libraryQueryRecordId())
                            .flatMap(libraryQueryRecord -> libraryQueryService.getById(libraryQueryRecord.getLibraryQueryId()));

                }))
                .flatMap(tuple2 -> {
                    OrgMember orgMember = tuple2.getT1();
                    LibraryQuery libraryQuery = tuple2.getT2();
                    if (!orgMember.getOrgId().equals(libraryQuery.getOrganizationId())) {
                        return ofError(LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH");
                    }
                    return Mono.empty();
                });
    }


}
