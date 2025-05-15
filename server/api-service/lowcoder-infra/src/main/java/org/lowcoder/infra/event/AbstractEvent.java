package org.lowcoder.infra.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.plugin.api.event.LowcoderEvent;
import org.lowcoder.sdk.constants.GlobalContext;
import reactor.util.context.ContextView;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

@Getter
@SuperBuilder
public abstract class AbstractEvent implements LowcoderEvent
{
    protected final String orgId;
    protected final String userId;
	protected final String sessionHash;
	protected final Boolean isAnonymous;
	private final String ipAddress;
    protected Map<String, Object> details;
	protected Map<String, String> eventHeaders;
	@Setter
	private static String environmentID;
    
    public Map<String, Object> details()
    {
		this.details.put("environmentId", environmentID);
    	return this.details;
    }

    public static abstract class AbstractEventBuilder<C extends AbstractEvent, B extends AbstractEvent.AbstractEventBuilder<C, B>> 
    {
    	public B detail(String name, String value)
    	{
    		if (details == null)
    		{
    			details = new HashMap<>();
    		}
    		this.details.put(name, value);
			this.details.put("environmentId", environmentID);
    		return self();
    	}
    }

	public void populateDetails(ContextView contextView) {
		//populate eventHeaders field
		eventHeaders = contextView.get(GlobalContext.HEADERS);

		if (details == null) {
			details = new HashMap<>();
		}
		for(Field f : getClass().getDeclaredFields()){
			Object value = null;
			try {
				f.setAccessible(Boolean.TRUE);
				value = f.get(this);
				JsonInclude jsonInclude = f.getAnnotation(JsonInclude.class);
				if (jsonInclude != null && jsonInclude.value() == JsonInclude.Include.NON_NULL) {
					// Include only if value is not null
					if (value != null) {
						details.put(f.getName(), value);
					}
				} else {
					// Include regardless of value
					details.put(f.getName(), value);
				}
			} catch (Exception e) {
            }

		}
		details.put("environmentId", environmentID);
		if(!details.containsKey("headers")) {
			details.put("headers", eventHeaders);
		}
	}
}