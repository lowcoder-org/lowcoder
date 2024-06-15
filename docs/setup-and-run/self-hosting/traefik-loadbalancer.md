# Traefik loadbalancer

Thanks to the amazing contribution of [https://github.com/timconsidine](https://github.com/timconsidine) Lowcoder can work smoothly with the Traefik as Loadbalancer.

This is a docker-compose.yaml file, which shows the necessary settings.

```yaml
version: "3"

services:
  ## Start Lowcoder (all-in-one)
  lowcoder-api-service:
    image: lowcoderorg/lowcoder-ce:latest
    container_name: lowcoder
    environment:
      REDIS_ENABLED: "true"
      MONGODB_ENABLED: "true"
      API_SERVICE_ENABLED: "true"
      NODE_SERVICE_ENABLED: "true"
      FRONTEND_ENABLED: "true"
      PUID: "1000"
      PGID: "1000"
      DEFAULT_ORGS_PER_USER: 100
      DEFAULT_ORG_MEMBER_COUNT: 1000
      DEFAULT_ORG_GROUP_COUNT: 100
      DEFAULT_ORG_APP_COUNT: 1000
      DEFAULT_DEVELOPER_COUNT: 50
      MONGODB_URL: "mongodb://localhost:27017/lowcoder?authSource=admin"
      REDIS_URL: "redis://localhost:6379"
      ENABLE_USER_SIGN_UP: "false"
      ENCRYPTION_PASSWORD: "somethingveryunique"
      ENCRYPTION_SALT: "somethingalsounique"
      CORS_ALLOWED_DOMAINS: "*"
      LOWCODER_API_KEY_SECRET: "b37717ee6de1003921c4445a3088af17ee316a6fad270737282a8ce2acf29832"
      LOWCODER_API_SERVICE_URL: "http://localhost:8080"
      LOWCODER_NODE_SERVICE_URL: "http://localhost:6060"
      LOWCODER_MAX_REQUEST_SIZE: 20m
      LOWCODER_MAX_QUERY_TIMEOUT: 120
    volumes:
      - ./lowcoder-stacks:/lowcoder-stacks
    restart: unless-stopped
    labels:
      - traefik.docker.network=traefik
      - traefik.port=3000
      - traefik.port=3443
      - "traefik.enable=true"
      - "traefik.http.routers.lowcoder.rule=Host(`lowcoder.domain.tld`)"
      - "traefik.http.routers.lowcoder.entrypoints=websecure"
      - "traefik.http.routers.lowcoder.tls.certresolver=letsencrypt"
      - "traefik.http.services.lowcoder.loadbalancer.server.port=3000"
    networks:
      - traefik

networks:
  traefik:
    external: true
```
