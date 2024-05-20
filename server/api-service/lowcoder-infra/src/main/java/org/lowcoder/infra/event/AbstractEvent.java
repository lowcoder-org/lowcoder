package org.lowcoder.infra.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.plugin.api.event.LowcoderEvent;

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
    
    public Map<String, Object> details()
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

	public void populateDetails() {
		if (details == null) {
			details = new HashMap<>();
		}
		for(Field f : getClass().getDeclaredFields()){
			Object value = null;
			try {
				f.setAccessible(Boolean.TRUE);
				value = f.get(this);
				details.put(f.getName(), value);
			} catch (Exception e) {
            }

		}
	}
}
