FROM python:3.13-alpine

ARG RGDASH_VERSION=1.1.3

LABEL org.opencontainers.image.title="Rogue Dashboard" \
      org.opencontainers.image.description="Local-first service dashboard" \
      org.opencontainers.image.source="https://github.com/RogueAssassin/rogue-dashboard" \
      org.opencontainers.image.url="https://github.com/RogueAssassin/rogue-dashboard" \
      org.opencontainers.image.version="${RGDASH_VERSION}"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DATA_DIR=/data \
    STATIC_DIR=/app/static \
    CUSTOM_DIR=/custom

WORKDIR /app

RUN addgroup -g 10001 dashboard \
    && adduser -D -u 10001 -G dashboard dashboard \
    && mkdir -p /data \
    && chown dashboard:dashboard /data

COPY --chown=dashboard:dashboard app/ /app/

USER dashboard
EXPOSE 8080
STOPSIGNAL SIGTERM

ENTRYPOINT ["python", "/app/dashboard.py"]
