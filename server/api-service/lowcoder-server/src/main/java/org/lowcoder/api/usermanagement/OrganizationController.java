package org.lowcoder.api.usermanagement;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.validation.Valid;
import org.apache.commons.lang.StringUtils;
import org.lowcoder.api.authentication.dto.OrganizationDomainCheckResult;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Comparator;
import java.util.List;

import static org.lowcoder.api.util.Pagination.fluxToPageResponseView;

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
    @Autowired
    private UserService userService;
    @Autowired
    private CommonConfig commonConfig;

    @Override
    public Mono<PageResponseView<?>> getOrganizationByUser(@PathVariable String email,
                                                           @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                           @RequestParam(required = false, defaultValue = "0") Integer pageSize) {
        Flux<OrgView> flux;
        if (commonConfig.getWorkspace().getMode() == WorkspaceMode.SAAS) {
            flux = userService.findByEmailDeep(email).flux()
                    .flatMap(user -> orgMemberService.getAllActiveOrgs(user.getId()))
                    .flatMap(orgMember -> organizationService.getById(orgMember.getOrgId()))
                    .map(OrgView::new)
                    .cache();
        } else {
            flux = organizationService.getOrganizationInEnterpriseMode().flux().map(OrgView::new).cache();
        }
        var newflux = flux.sort((OrgView o1, OrgView o2) -> {
            if (o1.getOrgName() == null || o2.getOrgName() == null) {
                return 0;
            }
            return o1.getOrgName().compareTo(o2.getOrgName());
        });
        return fluxToPageResponseView(pageNum, pageSize, newflux);
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
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.update(id, updateOrgRequest)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> uploadLogo(@PathVariable String orgId,
            @RequestPart("file") Mono<Part> fileMono) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.uploadLogo(id, fileMono)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> deleteLogo(@PathVariable String orgId) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.deleteLogo(id)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<OrgMemberListView>> getOrgMembers(@PathVariable String orgId,
            @RequestParam(required = false, defaultValue = "1") int pageNum,
            @RequestParam(required = false, defaultValue = "1000") int pageSize) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.getOrganizationMembers(id, pageNum, pageSize)
                .map(ResponseView::success));
    }
    @Override
    public Mono<ResponseView<OrgMemberListView>> getOrgMembersForSearch(@PathVariable String orgId,
            @PathVariable String searchMemberName,
            @PathVariable String searchGroupId,
            @RequestParam(required = false, defaultValue = "1") int pageNum,
            @RequestParam(required = false, defaultValue = "1000") int pageSize) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.getOrganizationMembersForSearch(id, searchMemberName, searchGroupId, pageNum, pageSize)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> updateRoleForMember(@RequestBody UpdateRoleRequest updateRoleRequest,
            @PathVariable String orgId) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.updateRoleForMember(id, updateRoleRequest)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<?>> setCurrentOrganization(@PathVariable String orgId, ServerWebExchange serverWebExchange) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            businessEventPublisher.publishUserLogoutEvent()
                .then(orgApiService.switchCurrentOrganizationTo(id))
                .delayUntil(result -> businessEventPublisher.publishUserLoginEvent(null))
                .flatMap(result -> orgApiService.checkOrganizationDomain()
                        .flatMap(OrganizationDomainCheckResult::buildOrganizationDomainCheckView)
                        .defaultIfEmpty(ResponseView.success(result))));
    }

    @Override
    public Mono<ResponseView<Boolean>> removeOrg(@PathVariable String orgId) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.removeOrg(id)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> leaveOrganization(@PathVariable String orgId) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.leaveOrganization(id)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> removeUserFromOrg(@PathVariable String orgId,
            @RequestParam String userId) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.removeUserFromOrg(id, userId)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<List<DatasourceMetaInfo>>> getSupportedDatasourceTypes(@PathVariable String orgId) {
        return datasourceMetaInfoService.getAllSupportedDatasourceMetaInfos()
                .collectList()
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<OrganizationCommonSettings>> getOrgCommonSettings(@PathVariable String orgId) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.getOrgCommonSettings(id)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> updateOrgCommonSettings(@PathVariable String orgId, @RequestBody UpdateOrgCommonSettingsRequest request) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.updateOrgCommonSettings(id, request.key(), request.value())
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Long>> getOrgApiUsageCount(String orgId, Boolean lastMonthOnly) {
        return gidService.convertOrganizationIdToObjectId(orgId).flatMap(id ->
            orgApiService.getApiUsageCount(id, lastMonthOnly)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Organization>> updateSlug(@PathVariable String orgId, @RequestBody String slug) {
        return organizationService.updateSlug(orgId, slug)
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Organization>> getOrganization(@PathVariable String orgId, @RequestParam(required = false) Boolean withDeleted) {
        return gidService.convertOrganizationIdToObjectId(orgId)
                .flatMap(id -> Boolean.TRUE.equals(withDeleted) ? organizationService.getByIdWithDeleted(id) : organizationService.getById(id))
                .switchIfEmpty(Mono.error(new BizException(BizError.ORGANIZATION_NOT_FOUND, "ORGANIZATION_NOT_FOUND")))
                .map(ResponseView::success);
    }

}
