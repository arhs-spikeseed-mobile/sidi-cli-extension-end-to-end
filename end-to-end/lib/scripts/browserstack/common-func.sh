#!/bin/bash
set -e

# -------------------------
# Load environment variables from the .env file
# -------------------------
set -a  # Automatically export all variables
if [ -f .env.proxy ]; then
  source .env.proxy
else
  echo "Warning: .env.proxy file not found. Skipping."
fi
if [ -f .env.browserstack ]; then
  source .env.browserstack
else
  echo "Warning: .env.browserstack file not found. Skipping."
fi
source configs/.env.local
set +a  # Disable automatic export

# -------------------------
# Export the current user as an environment variable
# -------------------------
export WHOAMI=$(whoami)  # Store the username of the currently logged-in user in WHOAMI

# -------------------------
# Proxy Configuration Check and Logging
# -------------------------
if [ -n "$HTTPS_PROXY" ]; then
    # Logs for proxy configuration
    echo "🔐 HTTPS_PROXY: $HTTPS_PROXY"
    echo "🚀 Running the script..."
else
    # Warning if the proxy is not configured
    echo "⚠️  HTTPS_PROXY is not defined. Skipping proxy configuration logs."
fi

# -------------------------
# Logging with Emojis and Colors
# -------------------------
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

INFO_EMOJI="ℹ️"
SUCCESS_EMOJI="✅"
WARNING_EMOJI="⚠️"
ERROR_EMOJI="❌"
UPLOAD_EMOJI="📤"
CHECK_EMOJI="🔍"
CONFIG_EMOJI="⚙️"
CLEANUP_EMOJI="🧹"

# Log functions
log_info() { echo -e "${YELLOW} ${INFO_EMOJI} $1    ${RESET}"; }
log_success() { echo -e "${GREEN} ${SUCCESS_EMOJI} $1    ${RESET}"; }
log_warning() { echo -e "${YELLOW} ${WARNING_EMOJI} $1    ${RESET}"; }
log_error() { echo -e "${RED} ${ERROR_EMOJI} $1    ${RESET}"; }