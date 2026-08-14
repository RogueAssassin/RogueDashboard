# Reverse proxy

Run the reverse proxy on an application network shared with the Rogue Dashboard **dashboard service**. The upstream remains plain HTTP on container port `8080` regardless of whether the host uses Docker or Podman.

| Setting | Value |
| --- | --- |
| Scheme | `http` |
| Host | `rogue-dashboard` |
| Port | `8080` |
| WebSockets | enabled/recommended |

Do not proxy to the private engine agent. Do not point a proxy container at `localhost`; inside a container, `localhost` refers to that container.

For Nginx Proxy Manager, attach NPM and Rogue Dashboard to the same external network such as `media-net`, then use `rogue-dashboard:8080` as the forward host and port.

When using Cloudflare Tunnel, keep Cloudflared on a network that can reach the chosen local origin and route through NPM or directly to the dashboard according to your security design.
