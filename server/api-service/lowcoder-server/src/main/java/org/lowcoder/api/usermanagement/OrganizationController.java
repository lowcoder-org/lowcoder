package org.lowcoder.api.usermanagement;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.validation.Valid;
import org.apache.commons.lang.StringUtils;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
public class OrganizationController implements OrganizationEndpoints
{

    @Autowired
    private OrgApiService orgApiService;
    @Autowired
    private DatasourceMetaInfoService datasourceMetaInfoService;
    @Autowired
    private BusinessEventPublisher businessEventPublisher;
    @Autowired
    private GidService gidService;
    @Autowired
    private OrgMemberService orgMemberService;
    @Autowired
    private OrganizationService organizationService;

    @Override
    public Mono<ResponseView<List<OrgView>>> getOrganizationByUser(@PathVariable String userId) {
        return orgMemberService.getAllActiveOrgs(userId)
                .flatMap(orgMember -> organizationService.getById(orgMember.getOrgId()))
                .map(OrgView::new)
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<OrgView>> create(@Valid @RequestBody Organization organization) {
        if(StringUtils.isEmpty(organization.getGid())) organization.setGid(UuidCreator.getTimeOrderedEpoch().toString());
        return orgApiService.create(organization)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> update(@PathVariable String orgId,
            @Valid @RequestBody UpdateOrgRequest updateOrgRequest) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.update(id, updateOrgRequest)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> uploadLogo(@PathVariable String orgId,
            @RequestPart("file") Mono<Part> fileMono) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.uploadLogo(id, fileMono)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> deleteLogo(@PathVariable String orgId) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.deleteLogo(id)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<OrgMemberListView>> getOrgMembers(@PathVariable String orgId,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "count", required = false, defaultValue = "1000") int count) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.getOrganizationMembers(id, page, count)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> updateRoleForMember(@RequestBody UpdateRoleRequest updateRoleRequest,
            @PathVariable String orgId) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.updateRoleForMember(id, updateRoleRequest)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<?>> setCurrentOrganization(@PathVariable String orgId, ServerWebExchange serverWebExchange) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return businessEventPublisher.publishUserLogoutEvent()
                .then(orgApiService.switchCurrentOrganizationTo(id))
                .delayUntil(result -> businessEventPublisher.publishUserLoginEvent(null))
                .flatMap(result -> orgApiService.checkOrganizationDomain()
                        .flatMap(OrganizationDomainCheckResult::buildOrganizationDomainCheckView)
                        .defaultIfEmpty(ResponseView.success(result)));
    }

    @Override
    public Mono<ResponseView<Boolean>> removeOrg(@PathVariable String orgId) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.removeOrg(id)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> leaveOrganization(@PathVariable String orgId) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.leaveOrganization(id)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> removeUserFromOrg(@PathVariable String orgId,
            @RequestParam String userId) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.removeUserFromOrg(id, userId)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<List<DatasourceMetaInfo>>> getSupportedDatasourceTypes(@PathVariable String orgId) {
        return datasourceMetaInfoService.getAllSupportedDatasourceMetaInfos()
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<OrganizationCommonSettings>> getOrgCommonSettings(@PathVariable String orgId) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.getOrgCommonSettings(id)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> updateOrgCommonSettings(@PathVariable String orgId, @RequestBody UpdateOrgCommonSettingsRequest request) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.updateOrgCommonSettings(id, request.key(), request.value())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Long>> getOrgApiUsageCount(String orgId, Boolean lastMonthOnly) {
        String id = gidService.convertOrganizationIdToObjectId(orgId);
        return orgApiService.getApiUsageCount(id, lastMonthOnly)
                .map(ResponseView::success);
    }

}