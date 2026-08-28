FROM python:3.13-alpine

ARG RGDASH_VERSION=1.2.0

LABEL org.opencontainers.image.title="RogueDashboard" \
      org.opencontainers.image.description="Local-first service dashboard" \
      org.opencontainers.image.source="https://github.com/RogueAssassin/RogueDashboard" \
      org.opencontainers.image.url="https://github.com/RogueAssassin/RogueDashboard" \
      org.opencontainers.image.version="${RGDASH_VERSION}"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DATA_DIR=/data \
    STATIC_DIR=/app/static \
    CUSTOM_DIR=/custom

WORKDIR /app

RUN addgroup -g 10001 roguedashboard \
    && adduser -D -u 10001 -G roguedashboard roguedashboard \
    && mkdir -p /data \
    && chown roguedashboard:roguedashboard /data

COPY --chown=roguedashboard:roguedashboard app/ /app/

USER roguedashboard
EXPOSE 8080
STOPSIGNAL SIGTERM

ENTRYPOINT ["python", "/app/dashboard.py"]
