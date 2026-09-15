#!/usr/bin/env bash
#
# Deploy Reloop SMS frontend from your Mac to production EC2.
#
# Server (ubuntu@172.31.18.155):
#   ~/reloop-backend/reloopsms-backend  — Django API (gunicorn → reloopsms-backend.sock)
#   ~/reloop-sms                        — frontend git clone
#   /var/www/dist                       — nginx static root (channels.reloop.pro)
#
# SSH (from ~/Downloads):
#   ssh -i "reloop.pem" ubuntu@ec2-3-104-43-187.ap-southeast-2.compute.amazonaws.com
#
# Setup (once):
#   cp deploy.env.example deploy.env
#   # PEM path defaults to ~/Downloads/reloop.pem
#
# Usage (from Frontend/reloop-sms):
#   npm run deploy
#   ./deploy.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}==>${NC} $*"; }
warn()  { echo -e "${YELLOW}==>${NC} $*"; }
fail()  { echo -e "${RED}==>${NC} $*" >&2; exit 1; }

if [[ ! -f deploy.env ]]; then
  fail "deploy.env not found. Run: cp deploy.env.example deploy.env"
fi

# shellcheck disable=SC1091
source deploy.env

: "${DEPLOY_USER:?Set DEPLOY_USER in deploy.env}"
: "${DEPLOY_HOST:?Set DEPLOY_HOST in deploy.env}"
: "${REMOTE_STAGING_DIR:=/home/ubuntu/reloop-sms/dist}"
: "${REMOTE_WWW_DIR:=/var/www/dist}"
: "${DEPLOY_URL:=https://channels.reloop.pro}"
: "${SKIP_BUILD:=0}"

# Expand ~ in key path
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY/#\~/$HOME}"
  [[ -f "$DEPLOY_SSH_KEY" ]] || fail "SSH key not found: $DEPLOY_SSH_KEY"
fi

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

RSYNC_SSH="ssh ${SSH_OPTS[*]}"

info "Target: ${REMOTE}"
info "Staging: ${REMOTE_STAGING_DIR} → nginx: ${REMOTE_WWW_DIR}"

if [[ "$SKIP_BUILD" != "1" ]]; then
  if [[ ! -f .env.production ]]; then
    fail ".env.production missing (need VITE_API_URL for production build)"
  fi
  info "Building production bundle (vite build)..."
  npm run build
else
  warn "SKIP_BUILD=1 — uploading existing dist/ without rebuilding"
fi

[[ -d dist ]] || fail "dist/ folder not found. Run npm run build first."

info "Uploading dist/ to server staging directory..."
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  dist/ \
  "${REMOTE}:${REMOTE_STAGING_DIR}/"

info "Publishing to nginx root and reloading nginx..."
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<EOF
set -euo pipefail
sudo rsync -av --delete "${REMOTE_STAGING_DIR}/" "${REMOTE_WWW_DIR}/"
sudo systemctl reload nginx
echo "Published to ${REMOTE_WWW_DIR} and reloaded nginx."
EOF

info "Deploy complete — ${DEPLOY_URL}/"
info "Hard-refresh the browser (Cmd+Shift+R) if you still see the old UI."
