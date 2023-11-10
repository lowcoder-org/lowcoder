package org.lowcoder.api.misc;

import java.util.Collection;
import java.util.List;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.misc.JsLibraryController.JsLibraryMeta;
import org.lowcoder.infra.constant.NewUrl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(NewUrl.JS_LIBRARY)
public interface JsLibraryEndpoints 
{
	public static final String TAG_JSLIBRARY_MANAGEMENT = "Javascript Library APIs";
	
	@Operation(
			tags = TAG_JSLIBRARY_MANAGEMENT,
		    operationId = "getJsLibraryRecommendations",
		    summary = "Get Javascript Library recommendations",
		    description = "Retrieve the standard list of JavaScript libraries within Lowcoder, as recommendation."
	)
    @GetMapping("/recommendations")
    public Mono<ResponseView<List<JsLibraryMeta>>> getRecommendationMetas();

	@Operation(
			tags = TAG_JSLIBRARY_MANAGEMENT,
		    operationId = "getJsLibraryMetadata",
		    summary = "Get Javascript Library metadata",
		    description = "Retrieve metadata information for JavaScript libraries within Lowcoder based on an Array as \"name\" parameter to name the desired libraries, providing details about available libraries."
	)
    @GetMapping("/metas")
    public Mono<ResponseView<List<JsLibraryMeta>>> getMeta(@RequestParam("name") Collection<String> names);

}
