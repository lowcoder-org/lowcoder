package org.lowcoder.api.authentication.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import java.util.Date;

import javax.crypto.SecretKey;

@Component
@Slf4j(topic = "JWTUtils")
public class JWTUtils {

    @Autowired
    private AuthProperties authProperties;

    private JwtParser jwtParser;

    private SecretKey signingKey;

    /** The Base64 text of the secret; tests read it to sign tokens of their own. */
    private String base64EncodedSecret;

    private final String TOKEN_HEADER = "Authorization";
    private final String TOKEN_PREFIX = "Bearer ";

    @PostConstruct
    public void setup(){
        // The key is the configured secret's bytes, as before (jjwt 0.11 took the Base64 text of the secret and decoded it again),
        // so tokens signed before the jjwt update keep validating. A secret under 256 bits is refused for HS256, as before.
        base64EncodedSecret = Encoders.BASE64.encode(authProperties.getApiKey().getSecret().getBytes());
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64EncodedSecret));
        this.jwtParser = Jwts.parser()
                .verifyWith(signingKey)
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
                .subject(user.getId())
                .issuedAt(new Date())
                .id(IDUtils.generate())
                .add("userId", user.getId())
                .add("createdBy", user.getName())
                .build();
        return Jwts.builder()
                .claims(claims)
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public Claims parseJwtClaims(String token) {
        try {
            return jwtParser.parseSignedClaims(token).getPayload();
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