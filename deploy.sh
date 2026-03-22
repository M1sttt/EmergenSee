#!/usr/bin/env bash
set -Eeuo pipefail

# ----------------------------
# Config
# ----------------------------
BRANCH="main"
API_PM2_NAME="emergensee-api"
NGINX_WEB_ROOT="/var/www/html/emergensee"
DEPLOY_BRANCH=""

# Treat script location as repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "${REPO_ROOT}/apps/api" && -d "${REPO_ROOT}/apps/web" ]]; then
  SERVER_DIR="${REPO_ROOT}/apps/api"
  CLIENT_DIR="${REPO_ROOT}/apps/web"
  SHARED_DIR="${REPO_ROOT}/packages/shared"
  API_FILTER="@emergensee/api"
  WEB_FILTER="@emergensee/web"
  USE_PNPM_WORKSPACE="true"
else
  SERVER_DIR="${REPO_ROOT}/server"
  CLIENT_DIR="${REPO_ROOT}/client"
  SHARED_DIR=""
  API_FILTER=""
  WEB_FILTER=""
  USE_PNPM_WORKSPACE="false"
fi

if [[ -f "${REPO_ROOT}/pnpm-lock.yaml" ]]; then
  PKG_MGR="pnpm"
else
  PKG_MGR="npm"
fi

# Use sudo only when needed
if [[ "${EUID}" -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

# ----------------------------
# Helpers
# ----------------------------
log() {
  echo "[deploy] $*"
}

fail() {
  echo "[deploy][error] $*" >&2
  exit 1
}

on_error() {
  local exit_code=$?
  local line_no=$1
  echo "[deploy][error] Failed at line ${line_no} (exit code: ${exit_code})" >&2
  exit "${exit_code}"
}
trap 'on_error $LINENO' ERR

require_clean_git() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    fail "Git working tree is not clean. Commit or stash changes before deploying."
  fi
}

get_env_value() {
  local env_file="$1"
  local key="$2"
  local line

  line="$(grep -E "^${key}=" "${env_file}" | tail -n1 || true)"
  if [[ -z "${line}" ]]; then
    echo ""
    return
  fi

  echo "${line#*=}"
}

validate_required_env_var() {
  local env_file="$1"
  local key="$2"
  local value

  value="$(get_env_value "${env_file}" "${key}")"
  if [[ -z "${value}" ]]; then
    fail "Missing required env var ${key} in ${env_file}"
  fi
}

validate_env_files() {
  local api_env="${SERVER_DIR}/.env"
  local web_env="${CLIENT_DIR}/.env"

  [[ -f "${api_env}" ]] || fail "Missing ${api_env}"
  [[ -f "${web_env}" ]] || fail "Missing ${web_env}"

  validate_required_env_var "${api_env}" "MONGODB_URI"
  validate_required_env_var "${api_env}" "JWT_SECRET"
  validate_required_env_var "${api_env}" "JWT_REFRESH_SECRET"
  validate_required_env_var "${api_env}" "GOOGLE_CLIENT_ID"
  validate_required_env_var "${web_env}" "VITE_API_URL"
  validate_required_env_var "${web_env}" "VITE_GOOGLE_CLIENT_ID"
}

detect_deploy_branch() {
  local configured_branch="$1"
  local remote_head_branch=""
  local local_branch=""

  if git ls-remote --exit-code --heads origin "${configured_branch}" >/dev/null 2>&1; then
    echo "${configured_branch}"
    return
  fi

  remote_head_branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  if [[ -n "${remote_head_branch}" ]]; then
    remote_head_branch="${remote_head_branch#origin/}"
    if git ls-remote --exit-code --heads origin "${remote_head_branch}" >/dev/null 2>&1; then
      echo "${remote_head_branch}"
      return
    fi
  fi

  for fallback_branch in master main; do
    if git ls-remote --exit-code --heads origin "${fallback_branch}" >/dev/null 2>&1; then
      echo "${fallback_branch}"
      return
    fi
  done

  local_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [[ -n "${local_branch}" ]] && git ls-remote --exit-code --heads origin "${local_branch}" >/dev/null 2>&1; then
    echo "${local_branch}"
    return
  fi

  fail "Could not detect a deploy branch on origin. Set BRANCH to an existing remote branch."
}

install_deps() {
  if [[ "${PKG_MGR}" == "pnpm" ]]; then
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm install --frozen-lockfile
    else
      pnpm install
    fi
    return
  fi

  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
}

run_build_api() {
  if [[ "${USE_PNPM_WORKSPACE}" == "true" ]]; then
    if [[ -n "${SHARED_DIR}" && -d "${SHARED_DIR}" ]]; then
      log "Building shared dependencies + API..."
      pnpm --dir "${REPO_ROOT}" --filter "${API_FILTER}"... run build
    else
      log "Shared package directory not found; building API only..."
      pnpm --dir "${REPO_ROOT}" --filter "${API_FILTER}" run build
    fi
    return
  fi

  cd "${SERVER_DIR}"
  install_deps
  if [[ "${PKG_MGR}" == "pnpm" ]]; then
    pnpm run build
  else
    npm run build
  fi
}

run_build_web() {
  if [[ "${USE_PNPM_WORKSPACE}" == "true" ]]; then
    pnpm --dir "${REPO_ROOT}" --filter "${WEB_FILTER}" run build
    return
  fi

  cd "${CLIENT_DIR}"
  install_deps
  if [[ "${PKG_MGR}" == "pnpm" ]]; then
    pnpm run build
  else
    npm run build
  fi
}

detect_frontend_build_dir() {
  if [[ -d dist ]]; then
    echo "dist"
  elif [[ -d build ]]; then
    echo "build"
  else
    return 1
  fi
}

detect_backend_start_script() {
  if [[ "${PKG_MGR}" == "pnpm" ]]; then
    if pnpm run | grep -qE '^[[:space:]]*start:prod'; then
      echo "start:prod"
    elif pnpm run | grep -qE '^[[:space:]]*start'; then
      echo "start"
    else
      return 1
    fi
    return
  fi

  if npm run | grep -qE '^[[:space:]]*start:prod'; then
    echo "start:prod"
  elif npm run | grep -qE '^[[:space:]]*start'; then
    echo "start"
  else
    return 1
  fi
}

# ----------------------------
# Preflight checks
# ----------------------------
command -v git >/dev/null 2>&1 || fail "git is not installed"
command -v node >/dev/null 2>&1 || fail "node is not installed"
command -v pm2 >/dev/null 2>&1 || fail "pm2 is not installed"
command -v nginx >/dev/null 2>&1 || fail "nginx is not installed"

if [[ "${PKG_MGR}" == "pnpm" ]]; then
  command -v pnpm >/dev/null 2>&1 || fail "pnpm is not installed"
else
  command -v npm >/dev/null 2>&1 || fail "npm is not installed"
fi

[[ -d "${SERVER_DIR}" ]] || fail "Missing server directory at ${SERVER_DIR}"
[[ -d "${CLIENT_DIR}" ]] || fail "Missing client directory at ${CLIENT_DIR}"

if [[ -n "${SUDO}" ]]; then
  command -v sudo >/dev/null 2>&1 || fail "sudo is not installed"
  sudo -n true >/dev/null 2>&1 || fail "sudo requires a password. Run as root or configure passwordless sudo for deploy user."
fi

# ----------------------------
# 1) Git pull
# ----------------------------
cd "${REPO_ROOT}"
require_clean_git
DEPLOY_BRANCH="$(detect_deploy_branch "${BRANCH}")"
log "Updating repository from origin/${DEPLOY_BRANCH}..."
git fetch origin "${DEPLOY_BRANCH}"
git pull --ff-only origin "${DEPLOY_BRANCH}"

if [[ "${PKG_MGR}" == "pnpm" ]]; then
  log "Installing workspace dependencies at repo root..."
  install_deps
fi

log "Validating environment files..."
validate_env_files

# ----------------------------
# 2) Backend deploy
# ----------------------------
log "Deploying backend from ${SERVER_DIR}..."
run_build_api

if pm2 describe "${API_PM2_NAME}" >/dev/null 2>&1; then
  log "Restarting existing PM2 process: ${API_PM2_NAME} (with updated env)..."
  if ! pm2 restart "${API_PM2_NAME}" --update-env; then
    log "PM2 restart failed; deleting stale process and starting clean..."
    pm2 delete "${API_PM2_NAME}" || true
    pm2 start "${SERVER_DIR}/dist/main.js" --name "${API_PM2_NAME}" --cwd "${SERVER_DIR}" --time
  fi
else
  if [[ -f "${SERVER_DIR}/dist/main.js" ]]; then
    log "Starting new PM2 process: ${API_PM2_NAME} from dist/main.js..."
    pm2 start "${SERVER_DIR}/dist/main.js" --name "${API_PM2_NAME}" --cwd "${SERVER_DIR}" --time
  else
    START_SCRIPT="$(detect_backend_start_script)" || fail "No usable start script found (expected start:prod or start)"
    if [[ "${PKG_MGR}" == "pnpm" ]]; then
      log "Starting new PM2 process: ${API_PM2_NAME} using pnpm run ${START_SCRIPT}..."
      pm2 start pnpm --name "${API_PM2_NAME}" --cwd "${SERVER_DIR}" -- run "${START_SCRIPT}"
    else
      log "Starting new PM2 process: ${API_PM2_NAME} using npm run ${START_SCRIPT}..."
      pm2 start npm --name "${API_PM2_NAME}" --cwd "${SERVER_DIR}" -- run "${START_SCRIPT}"
    fi
  fi
fi

pm2 save

# ----------------------------
# 3) Frontend deploy
# ----------------------------
log "Deploying frontend from ${CLIENT_DIR}..."
run_build_web

cd "${CLIENT_DIR}"

BUILD_DIR="$(detect_frontend_build_dir)" || fail "No frontend output directory found (expected dist or build)"

log "Syncing ${CLIENT_DIR}/${BUILD_DIR} to ${NGINX_WEB_ROOT}..."
${SUDO} mkdir -p "${NGINX_WEB_ROOT}"

if command -v rsync >/dev/null 2>&1; then
  ${SUDO} rsync -a --delete "${CLIENT_DIR}/${BUILD_DIR}/" "${NGINX_WEB_ROOT}/"
else
  # Fallback without rsync
  ${SUDO} rm -rf "${NGINX_WEB_ROOT:?}/"*
  ${SUDO} cp -a "${CLIENT_DIR}/${BUILD_DIR}/." "${NGINX_WEB_ROOT}/"
fi

log "Reloading Nginx..."
${SUDO} systemctl reload nginx

# ----------------------------
# 4) Done
# ----------------------------
log "Deployment completed successfully."
echo
pm2 status