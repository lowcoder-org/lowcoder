package org.lowcoder.plugin.redis.utils;

import static org.lowcoder.plugin.redis.constants.RedisFieldName.COMMAND;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import java.util.Map;

import org.lowcoder.plugin.redis.commands.RedisCommand;
import org.lowcoder.plugin.redis.commands.RedisCommand.Del;
import org.lowcoder.plugin.redis.commands.RedisCommand.Get;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hdel;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hget;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hgetall;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hkeys;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hlen;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hmget;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hset;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hsetnx;
import org.lowcoder.plugin.redis.commands.RedisCommand.Hvals;
import org.lowcoder.plugin.redis.commands.RedisCommand.Keys;
import org.lowcoder.plugin.redis.commands.RedisCommand.Lindex;
import org.lowcoder.plugin.redis.commands.RedisCommand.Llen;
import org.lowcoder.plugin.redis.commands.RedisCommand.Lpush;
import org.lowcoder.plugin.redis.commands.RedisCommand.Lrange;
import org.lowcoder.plugin.redis.commands.RedisCommand.Lrem;
import org.lowcoder.plugin.redis.commands.RedisCommand.Mget;
import org.lowcoder.plugin.redis.commands.RedisCommand.Rpoplpush;
import org.lowcoder.plugin.redis.commands.RedisCommand.Sadd;
import org.lowcoder.plugin.redis.commands.RedisCommand.Scard;
import org.lowcoder.plugin.redis.commands.RedisCommand.Set;
import org.lowcoder.plugin.redis.commands.RedisCommand.Sismember;
import org.lowcoder.plugin.redis.commands.RedisCommand.Smembers;
import org.lowcoder.plugin.redis.commands.RedisCommand.Srandmember;
import org.lowcoder.plugin.redis.commands.RedisCommand.Srem;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zadd;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zcard;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zcount;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zrange;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zrangebyscore;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zrank;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zrem;
import org.lowcoder.plugin.redis.commands.RedisCommand.Zscore;
import org.lowcoder.sdk.exception.PluginException;

public class RedisQueryUtils {


    public static boolean isRawCommand(Map<String, Object> formData) {
        String command = (String) formData.getOrDefault(COMMAND, "");
        return "RAW".equalsIgnoreCase(command);
    }

    public static RedisCommand convertRedisFormInputToRedisCommand(Map<String, Object> formData) {
        String commandType = (String) formData.getOrDefault(COMMAND, "");
        return switch (commandType.toUpperCase()) {
            case "SET" -> new Set(formData);
            case "GET" -> new Get(formData);
            case "DEL" -> new Del(formData);
            case "KEYS" -> new Keys(formData);
            case "MGET" -> new Mget(formData);
            case "HGET" -> new Hget(formData);
            case "HMGET" -> new Hmget(formData);
            case "HGETALL" -> new Hgetall(formData);
            case "HSET" -> new Hset(formData);
            case "HSETNX" -> new Hsetnx(formData);
            case "HLEN" -> new Hlen(formData);
            case "HDEL" -> new Hdel(formData);
            case "HKEYS" -> new Hkeys(formData);
            case "HVALS" -> new Hvals(formData);
            case "LINDEX" -> new Lindex(formData);
            case "LLEN" -> new Llen(formData);
            case "LPUSH" -> new Lpush(formData);
            case "LREM" -> new Lrem(formData);
            case "RPOPLPUSH" -> new Rpoplpush(formData);
            case "LRANGE" -> new Lrange(formData);
            case "SADD" -> new Sadd(formData);
            case "SCARD" -> new Scard(formData);
            case "SMEMBERS" -> new Smembers(formData);
            case "SISMEMBER" -> new Sismember(formData);
            case "SRANDMEMBER" -> new Srandmember(formData);
            case "SREM" -> new Srem(formData);
            case "ZADD" -> new Zadd(formData);
            case "ZCARD" -> new Zcard(formData);
            case "ZCOUNT" -> new Zcount(formData);
            case "ZRANGE" -> new Zrange(formData);
            case "ZRANGEBYSCORE" -> new Zrangebyscore(formData);
            case "ZRANK" -> new Zrank(formData);
            case "ZREM" -> new Zrem(formData);
            case "ZSCORE" -> new Zscore(formData);
            default -> throw new PluginException(QUERY_ARGUMENT_ERROR, "INVALID_REDIS_REQUEST", commandType);
        };
    }

}
