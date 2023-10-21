package org.lowcoder.api.authentication.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.config.AuthProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.Random;

import java.util.Date;

@Component
public class JWTUtils {

    @Autowired
    private AuthProperties authProperties;

    private JwtParser jwtParser;

    private final String TOKEN_HEADER = "Authorization";
    private final String TOKEN_PREFIX = "Bearer ";

    @PostConstruct
    public void setup(){
        this.jwtParser = Jwts.parser().setSigningKey(authProperties.getApiKey().getSecret());
    }

    public String createToken(User user) {
        Claims claims = Jwts.claims()
                .setSubject(user.getId())
                .setIssuedAt(new Date());
        claims.put("userId", user.getId() );
        claims.put("createdBy", user.getName());
        String randomFactor = String.valueOf(new Random().nextLong(100000000L));
        return Jwts.builder()
                .setClaims(claims)
                .signWith(SignatureAlgorithm.HS256, authProperties.getApiKey().getSecret() + randomFactor)
                .compact();
    }

    private Claims parseJwtClaims(String token) {
        return jwtParser.parseClaimsJws(token).getBody();
    }

    public String resolveToken(HttpServletRequest request) {

        String bearerToken = request.getHeader(TOKEN_HEADER);
        if (bearerToken != null && bearerToken.startsWith(TOKEN_PREFIX)) {
            return bearerToken.substring(TOKEN_PREFIX.length());
        }
        return null;
    }


}