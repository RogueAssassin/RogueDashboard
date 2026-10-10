#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEFAULT_TEST_BRANCH="testing"
MODE=${1:-latest}
BRANCH=""

if [[ $MODE == branch ]]; then
  BRANCH=${2:-}
  [[ -n $BRANCH && $BRANCH =~ ^[A-Za-z0-9._/-]+$ ]] || { echo "Usage: ./update.sh branch <branch-name>" >&2; exit 2; }
  TARGET="branch:$BRANCH"
elif [[ $MODE == testing ]]; then
  BRANCH=${RGDASH_TEST_BRANCH:-$DEFAULT_TEST_BRANCH}
  TARGET="testing"
else
  TARGET=$MODE
  [[ $TARGET == v* ]] && TARGET=${TARGET#v}
  [[ $TARGET =~ ^([0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?|latest|main)$ ]] || {
    echo "Usage: ./update.sh [latest|main|testing|X.Y.Z|X.Y.Z-rcN] | ./update.sh branch <branch-name>" >&2
    exit 2
  }
fi

[[ $EUID -ne 0 ]] || { echo "Run as the container owner, not root/sudo." >&2; exit 1; }
for cmd in curl awk; do command -v "$cmd" >/dev/null || { echo "Missing runtime: $cmd" >&2; exit 2; }; done

cd "$INSTALL_DIR"
[[ -f compose.yaml && -f .env && -d data ]] || { echo "Incomplete RogueDashboard installation at $INSTALL_DIR" >&2; exit 2; }

# Only one update at a time.
if command -v flock >/dev/null; then
  exec 9>"$INSTALL_DIR/.update.lock"
  flock -n 9 || { echo "Another RogueDashboard update is already running." >&2; exit 1; }
fi

REF=main
IMAGE_TAG=latest
CHANNEL=production
if [[ $TARGET =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?$ ]]; then
  IMAGE_TAG="$TARGET"
elif [[ $TARGET == testing || $TARGET == branch:* ]]; then
  REF="$BRANCH"
  CHANNEL=testing
  if [[ $TARGET == testing ]]; then
    IMAGE_TAG=testing
  else
    SAFE_BRANCH=$(printf '%s' "$BRANCH" | tr '/_' '--' | tr -cd '[:alnum:].-')
    IMAGE_TAG="branch-$SAFE_BRANCH"
  fi
fi

env_value(){ awk -F= -v k="$1" '$1==k{sub(/^[^=]*=/,""); print}' .env | tail -n1 | tr -d '\r ' || true; }

BASE="https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/$REF"
STAMP=$(date +%Y%m%d-%H%M%S)
# Backups live next to the install (not /tmp, which is wiped on reboot). Last 10 are kept.
BACKUP_ROOT=${RGDASH_BACKUP_DIR:-${RGDASH_BACKUP_TMP:-$INSTALL_DIR/backups/update}}
mkdir -p "$BACKUP_ROOT"
BACKUP="$BACKUP_ROOT/$STAMP"
mkdir -p "$BACKUP"
cp -a compose.yaml .env "$BACKUP/"
[[ -f compose.override.yaml ]] && cp -a compose.override.yaml "$BACKUP/"
[[ -f update.sh ]] && cp -a update.sh "$BACKUP/"
[[ -d custom ]] && cp -a custom "$BACKUP/" 2>/dev/null || true
(cd "$BACKUP_ROOT" && ls -1dt ./[0-9]*-[0-9]*/ 2>/dev/null | tail -n +11 | xargs -r rm -rf) || true

deploy_engine=$(env_value RGDASH_RUNTIME)
if [[ $deploy_engine != podman && $deploy_engine != docker ]]; then
  if command -v podman >/dev/null && podman info >/dev/null 2>&1; then
    deploy_engine=podman
  elif command -v docker >/dev/null && docker info >/dev/null 2>&1; then
    deploy_engine=docker
  else
    echo "Unable to detect a working Podman or Docker runtime." >&2
    exit 2
  fi
fi

compose_files=(-f "$INSTALL_DIR/compose.yaml")
# Local customisations belong in compose.override.yaml; it survives updates.
[[ -f "$INSTALL_DIR/compose.override.yaml" ]] && compose_files+=(-f "$INSTALL_DIR/compose.override.yaml")

if [[ $deploy_engine == podman ]]; then
  podman compose version >/dev/null 2>&1 || { echo "Podman Compose provider is unavailable." >&2; exit 2; }
  compose_cmd=(podman compose --env-file "$INSTALL_DIR/.env" "${compose_files[@]}")
else
  if docker compose version >/dev/null 2>&1; then
    compose_cmd=(docker compose --env-file "$INSTALL_DIR/.env" "${compose_files[@]}")
  elif command -v docker-compose >/dev/null; then
    compose_cmd=(docker-compose --env-file "$INSTALL_DIR/.env" "${compose_files[@]}")
  else
    echo "Docker Compose provider is unavailable." >&2
    exit 2
  fi
fi

echo "RogueDashboard update target: $TARGET"
echo "Channel: $CHANNEL"
echo "Source ref: $REF"
echo "Deployment runtime: $deploy_engine"
echo "Image tag: $IMAGE_TAG"
echo "Backup: $BACKUP"

set_env(){
  local key=$1 value=$2
  if grep -q "^${key}=" .env; then sed -i "s#^${key}=.*#${key}=${value}#" .env
  else printf '%s=%s\n' "$key" "$value" >> .env
  fi
}

PORT=$(env_value RGDASH_PORT)
[[ $PORT =~ ^[0-9]+$ ]] || PORT=7805
BIND=$(env_value RGDASH_BIND)
[[ -z $BIND || $BIND == 0.0.0.0 ]] && BIND=127.0.0.1
PING_URL="http://$BIND:$PORT/api/ping"

HEALTH_FILE="${TMPDIR:-/tmp}/roguedashboard-health.$$"
trap 'rm -f "$HEALTH_FILE"' EXIT

wait_for_ping(){
  local attempt
  for attempt in {1..30}; do
    if curl -fsS --max-time 5 "$PING_URL" >"$HEALTH_FILE" 2>/dev/null; then return 0; fi
    sleep 2
  done
  return 1
}

# --- 1. Download deployment files (nothing is installed yet) -----------------
curl -fsSL "$BASE/compose.yaml" -o "$BACKUP/compose.download" || { echo "RogueDashboard source ref '$REF' is unavailable." >&2; exit 3; }
curl -fsSL "$BASE/update.sh" -o "$BACKUP/update.download" || { echo "RogueDashboard updater is unavailable on '$REF'." >&2; exit 3; }

# --- 2. Back up the database -------------------------------------------------
RUNNING_IMAGE=$("$deploy_engine" inspect roguedashboard --format '{{.Image}}' 2>/dev/null || true)
mkdir -p "$BACKUP/data"
if [[ -n $RUNNING_IMAGE ]] && "$deploy_engine" exec roguedashboard python -c \
     "import sys; sys.path.insert(0,'/app'); import dashboard; sys.exit(0 if hasattr(dashboard,'backup_database') else 1)" >/dev/null 2>&1; then
  if DB_BACKUP=$("$deploy_engine" exec roguedashboard python /app/dashboard.py backup 2>/dev/null); then
    echo "Database backup (online, consistent): ${DB_BACKUP:-data/backups}"
  else
    echo "Warning: in-container database backup failed; copying files instead." >&2
    cp -a data/roguedashboard.sqlite* "$BACKUP/data/" 2>/dev/null || true
  fi
else
  # Older image or container not running: a plain copy is best-effort.
  cp -a data/roguedashboard.sqlite* "$BACKUP/data/" 2>/dev/null || true
  echo "Database files copied to $BACKUP/data"
fi

# --- 3. Pull FIRST so a missing tag cannot leave config half-updated ----------
IMAGE_REF="ghcr.io/rogueassassin/roguedashboard:$IMAGE_TAG"
"$deploy_engine" pull "$IMAGE_REF" || { echo "RogueDashboard image tag '$IMAGE_TAG' is not published in GHCR. Nothing was changed." >&2; exit 4; }
EXPECTED_IMAGE=$("$deploy_engine" image inspect "$IMAGE_REF" --format '{{.Id}}' 2>/dev/null || true)

ROLLBACK_REF=""
if [[ -n $RUNNING_IMAGE ]]; then
  ROLLBACK_REF="localhost/roguedashboard-rollback:$STAMP"
  "$deploy_engine" tag "$RUNNING_IMAGE" "$ROLLBACK_REF" 2>/dev/null || ROLLBACK_REF=""
fi

echo "Running image: ${RUNNING_IMAGE:-none}"
echo "Pulled image:  ${EXPECTED_IMAGE:-unknown}"

# --- 4. Install updated files ------------------------------------------------
if ! diff -q compose.yaml "$BACKUP/compose.download" >/dev/null 2>&1; then
  echo "compose.yaml will change (your previous copy is saved in $BACKUP). Differences:"
  diff -u compose.yaml "$BACKUP/compose.download" | head -60 || true
  echo "Put local customisations in compose.override.yaml so updates do not replace them."
fi
install -m 0644 "$BACKUP/compose.download" "$INSTALL_DIR/compose.yaml"
set_env RGDASH_IMAGE "$IMAGE_REF"
set_env RGDASH_INSTALL_DIR "$INSTALL_DIR"
set_env RGDASH_DATA_DIR "$INSTALL_DIR/data"
set_env RGDASH_CUSTOM_DIR "$INSTALL_DIR/custom"

rollback(){
  local reason=$1
  echo "Update failed: $reason" >&2
  if [[ -z $ROLLBACK_REF ]]; then
    echo "No previous container image was recorded, so automatic rollback is not possible. Backup: $BACKUP" >&2
    return 1
  fi
  echo "Rolling back to the previously running image..." >&2
  cp -a "$BACKUP/compose.yaml" "$BACKUP/.env" "$INSTALL_DIR/"
  set_env RGDASH_IMAGE "$ROLLBACK_REF"
  "$deploy_engine" rm -f roguedashboard >/dev/null 2>&1 || true
  if "${compose_cmd[@]}" up -d --remove-orphans && wait_for_ping; then
    echo "Rollback succeeded. RGDASH_IMAGE in .env now points at $ROLLBACK_REF (the version you were running)." >&2
    echo "Set RGDASH_IMAGE back to a published tag when you are ready to try again. Backup: $BACKUP" >&2
  else
    echo "Rollback did not restore a healthy service. Backup: $BACKUP" >&2
    "${compose_cmd[@]}" ps >&2 || true
    "$deploy_engine" logs --tail 100 roguedashboard >&2 || true
  fi
  return 1
}

# --- 5. Recreate and verify --------------------------------------------------
if [[ -n $EXPECTED_IMAGE && -n $RUNNING_IMAGE && "$EXPECTED_IMAGE" != "$RUNNING_IMAGE" ]]; then
  echo "RogueDashboard image changed; replacing existing container..."
  "$deploy_engine" rm -f roguedashboard >/dev/null
fi

if ! "${compose_cmd[@]}" up -d --remove-orphans; then
  rollback "compose could not recreate the container" || exit 5
  exit 5
fi

NEW_IMAGE=$("$deploy_engine" inspect roguedashboard --format '{{.Image}}' 2>/dev/null || true)
if [[ -n "$EXPECTED_IMAGE" && "$NEW_IMAGE" != "$EXPECTED_IMAGE" ]]; then
  echo "Expected image: $EXPECTED_IMAGE" >&2
  echo "Running image:  ${NEW_IMAGE:-missing}" >&2
  rollback "the running image is not the one that was pulled" || exit 6
  exit 6
fi

if wait_for_ping; then
  echo
  cat "$HEALTH_FILE"
  echo
  echo "RogueDashboard $CHANNEL update complete."
  [[ $CHANNEL == testing ]] && echo "TESTING BUILD ACTIVE: $REF ($IMAGE_TAG)"
  install -m 0755 "$BACKUP/update.download" "$INSTALL_DIR/update.sh"
  echo "Updater refreshed for the next run."
  exit 0
fi

rollback "health check did not pass" || true
"$deploy_engine" logs --tail 100 roguedashboard >&2 || true
exit 1
