package org.lowcoder.api.authentication.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Encoders;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import java.util.Date;

@Component
@Slf4j(topic = "JWTUtils")
public class JWTUtils {

    @Autowired
    private AuthProperties authProperties;

    private JwtParser jwtParser;

    private String base64EncodedSecret;

    private final String TOKEN_HEADER = "Authorization";
    private final String TOKEN_PREFIX = "Bearer ";

    @PostConstruct
    public void setup(){
        base64EncodedSecret = Encoders.BASE64.encode(authProperties.getApiKey().getSecret().getBytes());
        this.jwtParser = Jwts.parserBuilder()
                .setSigningKey(base64EncodedSecret)
                .build();
    }

    /**
     * Signs a new API-key token for the user. The token carries a random {@code jti} (NEW-134), so two keys created within the same
     * second get different tokens with overwhelming probability; without it the claims of two such calls were equal, and deleting
     * one of the keys left its token valid through the other. No uniqueness check is made. Validation does not read the {@code jti}:
     * tokens issued before it was added keep authenticating, and keys that already share a token keep sharing it. Limits: the tokens
     * still never expire; a token stops authenticating when no stored key of the user carries it any more (so keys that share a token
     * must all be removed) or when the user is deleted ({@code SessionUserServiceImpl.resolveSessionUserForJWT}).
     */
    public String createToken(User user) {
        Claims claims = Jwts.claims()
                .setSubject(user.getId())
                .setIssuedAt(new Date())
                .setId(IDUtils.generate());
        claims.put("userId", user.getId() );
        claims.put("createdBy", user.getName());
        return Jwts.builder()
                .setClaims(claims)
                .signWith(SignatureAlgorithm.HS256, base64EncodedSecret)
                .compact();
    }

    public Claims parseJwtClaims(String token) {
        try {
            return jwtParser.parseClaimsJws(token).getBody();
        } catch (Exception e) {
            log.warn("Failed to validate token. Exception: ", e);
            return null;
        }
    }

    public String resolveToken(ServerWebExchange exchange) {

        String bearerToken = exchange.getRequest().getHeaders().getFirst(TOKEN_HEADER);
        if (bearerToken != null && bearerToken.startsWith(TOKEN_PREFIX)) {
            return bearerToken.substring(TOKEN_PREFIX.length());
        }
        return null;
    }


}