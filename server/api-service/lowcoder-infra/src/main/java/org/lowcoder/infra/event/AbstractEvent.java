package org.lowcoder.infra.event;

import java.util.HashMap;
import java.util.Map;

import org.lowcoder.plugin.api.event.LowcoderEvent;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public abstract class AbstractEvent implements LowcoderEvent
{
    protected final String orgId;
    protected final String userId;
    protected Map<String, String> details;
    
    public Map<String, String> details()
    {
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
    		return self();
    	}
    }
}
