package org.lowcoder.api.framework.plugin;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.plugin.api.LowcoderServices;
import org.lowcoder.plugin.api.event.LowcoderEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@Component
public class SharedPluginServices implements LowcoderServices
{
	private final UserService userService;
	private final ObjectMapper objectMapper;
	
	private List<Consumer<LowcoderEvent>> eventListeners = new LinkedList<>();

	@Override
	public String getUserDetailInfo(String userId) 
	{
		Mono<User> userMono = userService.findById(userId);
		if (userMono != null)
		{
			try
			{
				User user = userMono.toFuture().get();
				Mono<UserDetail> userDetailMono = userService.buildUserDetail(user, false);
				if (userDetailMono != null)
				{
					CompletableFuture<UserDetail> future = userDetailMono.toFuture();
					UserDetail userDetail = future.get();
					return objectMapper.writeValueAsString(userDetail);
				}
			}
			catch(Throwable cause)
			{
				log.error("Error retrieving user details!", cause);
				return "{ \"error\": \"" + cause.getMessage() + "\" }";
			}
		}
		
		return "{ }";
	}

	@Override
	public void registerEventListener(Consumer<LowcoderEvent> listener) 
	{
		this.eventListeners.add(listener);
	}

	@EventListener(classes = LowcoderEvent.class)
	private void publishEvents(LowcoderEvent event)
	{
		for (Consumer<LowcoderEvent> listener : eventListeners)
		{
			listener.accept(event);
		}
	}
}
