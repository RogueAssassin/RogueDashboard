FROM python:3.13-alpine

ARG RGDASH_VERSION=2.0.1

LABEL org.opencontainers.image.title="RogueDashboard" \
      org.opencontainers.image.description="Local-first service dashboard" \
      org.opencontainers.image.source="https://github.com/RogueAssassin/RogueDashboard" \
      org.opencontainers.image.url="https://github.com/RogueAssassin/RogueDashboard" \
      org.opencontainers.image.version="${RGDASH_VERSION}"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
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

# Used by plain `docker run`; compose/Quadlet can override it. Fails when the monitor has stalled.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "/app/dashboard.py", "healthcheck"]

ENTRYPOINT ["python", "/app/dashboard.py"]
