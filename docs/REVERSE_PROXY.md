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

## Client addresses and login throttling

Failed-login throttling is applied per client address. When `RGDASH_TRUST_PROXY_HEADERS=true` and the
request comes from a private address (your proxy), the dashboard uses the last `X-Forwarded-For` entry,
which is the address your first proxy saw. Behind a second proxy tier (for example Cloudflare in front of
Nginx Proxy Manager) configure the inner proxy to overwrite `X-Forwarded-For` with the real client address.

## Publishing the port

If the proxy runs on the same host, set `RGDASH_BIND=127.0.0.1` so the direct port is not reachable from
the LAN. Docker publishes ports around host firewalls such as ufw.
