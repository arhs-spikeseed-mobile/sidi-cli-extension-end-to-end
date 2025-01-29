#!/bin/bash

# Load common
. lib/scripts/browserstack/common-func.sh

# Cross-platform compatibility for determining OS type
OS_TYPE=$(uname -s | awk '{print tolower($0)}')
FILE="../build/BrowserStackLocal"
DOWNLOAD_URL=""
ZIP_FILE="../build/BrowserStackLocal-darwin-x64.zip"

# Validate input parameters
if [[ -z "$1" ]]; then
  echo "Error: BrowserStack key is required as the first argument."
  echo "Usage: $0 <browserstack_key>"
  exit 1
fi

BROWSERSTACK_KEY="$1"

# Determine the appropriate download URL based on OS
if [[ "$OS_TYPE" == *"mingw32_nt"* ]] || [[ "$OS_TYPE" == *"mingw64_nt"* ]]; then
  # Windows
  DOWNLOAD_URL="https://www.browserstack.com/browserstack-local/BrowserStackLocal-win32.zip"
elif [[ "$OS_TYPE" == "darwin" ]]; then
  # macOS
  DOWNLOAD_URL="https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-x64.zip"
else
  echo "Unsupported OS: $OS_TYPE"
  exit 1
fi

# Ensure the BrowserStackLocal binary exists
if [[ ! -f "$FILE" ]]; then
  echo "$FILE does not exist. Downloading..."

  # Download the appropriate binary
  curl -k -o "$ZIP_FILE" "$DOWNLOAD_URL"
  if [[ $? -ne 0 ]]; then
    echo "Error downloading BrowserStackLocal from $DOWNLOAD_URL"
    exit 1
  fi

  # Unzip the binary
  unzip -q "$ZIP_FILE" -d "../build"
  if [[ $? -ne 0 ]]; then
    echo "Error extracting $ZIP_FILE"
    exit 1
  fi

  # Clean up the zip file
  rm -f "$ZIP_FILE"
fi

# Run the BrowserStackLocal binary
exec "$FILE" --key "$BROWSERSTACK_KEY" --local-identifier $LOCAL_IDENTIFIER
