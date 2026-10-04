import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import lombok.extern.jackson.Jacksonized;

class OtherLibraryJackson {
    Object serializer() {
        return new Jackson2JsonRedisSerializer<>(String.class);
    }
}
