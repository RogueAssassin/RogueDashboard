# Reverse proxy

RogueDashboard listens on container port `8080`.

When the reverse proxy shares `media-net`, forward to:

```text
http://roguedashboard:8080
```

Do not use `localhost` from another container; it refers to that container itself.

## Nginx Proxy Manager

Use:

| Setting | Value |
| --- | --- |
| Scheme | `http` |
| Forward host | `roguedashboard` |
| Forward port | `8080` |

When the public endpoint uses HTTPS:

```env
SECURE_COOKIES=true
RGDASH_TRUST_PROXY_HEADERS=true
```

## Cloudflare Tunnel

Cloudflared can route directly to `http://roguedashboard:8080` when it shares the same network, or through Nginx Proxy Manager when NPM is your central reverse proxy.

Neither deployment requires RogueDashboard to access the Docker or Podman socket.
