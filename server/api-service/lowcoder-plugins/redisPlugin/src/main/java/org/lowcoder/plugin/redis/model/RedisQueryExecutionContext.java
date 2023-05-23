package org.lowcoder.plugin.redis.model;

import org.lowcoder.sdk.query.QueryExecutionContext;

import lombok.Builder;
import lombok.Getter;
import redis.clients.jedis.Protocol;

@Getter
@Builder
public class RedisQueryExecutionContext extends QueryExecutionContext {

    private Protocol.Command protocolCommand;
    private String[] args;
}
