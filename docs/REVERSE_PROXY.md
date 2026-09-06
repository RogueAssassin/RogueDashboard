# Reverse proxy

RogueDashboard listens on container port `8080`. Keep the reverse proxy and RogueDashboard on the same external application network, then use:

| Setting | Value |
| --- | --- |
| Scheme | `http` |
| Forward host | `roguedashboard` |
| Forward port | `8080` |
| WebSockets | optional; safe to enable |

Do not proxy to `localhost` from another container; inside a container, `localhost` refers to that container.

## Nginx Proxy Manager

Attach NPM and RogueDashboard to the same external network such as `media-net`, then create a Proxy Host pointing to `roguedashboard:8080`.

When the public endpoint is HTTPS, set:

```env
SECURE_COOKIES=true
RGDASH_TRUST_PROXY_HEADERS=true
```

## Cloudflare Tunnel

Cloudflared can route directly to `http://roguedashboard:8080` when it shares the same network, or it can route through Nginx Proxy Manager if NPM remains your central reverse proxy.

RogueDashboard does not require a Docker or Podman socket for either design.
