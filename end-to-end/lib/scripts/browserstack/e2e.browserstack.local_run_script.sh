#!/bin/bash
set -e

# Load common
. lib/scripts/browserstack/common-func.sh

# Validate required environment variables
if [[ -z "$BS_USER" || -z "$BS_KEY" ]]; then
  log_error "BrowserStack credentials (BS_USER and BS_KEY) are missing."
  exit 1
fi

# Variables
MD5_FILE=".browserstack.lastuploadmd5"
IMAGE_BS_ID_FILE=".browserstack.bspath"
MODE=$1
PLATFORM=$2

# Validate mode
if [[ "$MODE" != "simulator" && "$MODE" != "browserstack" ]]; then
  log_error "Invalid mode specified. Use 'local' or 'browserstack'."
  exit 1
fi

if [[ "$MODE" == "simulator" ]]; then

  # Set configuration path
  if [[ "$PLATFORM" == "ios" ]]; then
    WDIO_CONFIG_PATH="lib/baseConfigs/wdio.local.ios.conf.js"
  elif [[ "$PLATFORM" == "android" ]]; then
    WDIO_CONFIG_PATH="lib/baseConfigs/wdio.local.android.conf.js"
  elif [[ "$PLATFORM" == "both" ]]; then
    WDIO_CONFIG_PATH="lib/baseConfigs/wdio.local.both.conf.js"
  else
    log_error "Invalid platform specified. Use 'ios', 'android', or 'both'."
    exit 1
  fi
else

  if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    if [[ ! -f "$MD5_FILE.ios" ]]; then touch "$MD5_FILE.ios"; fi
    if [[ ! -f "$IMAGE_BS_ID_FILE.ios" ]]; then touch "$IMAGE_BS_ID_FILE.ios"; fi
  fi

  if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    if [[ ! -f "$MD5_FILE.android" ]]; then touch "$MD5_FILE.android"; fi
    if [[ ! -f "$IMAGE_BS_ID_FILE.android" ]]; then touch "$IMAGE_BS_ID_FILE.android"; fi
  fi
  # Original BrowserStack configuration path logic
  if [[ "$PLATFORM" == "ios" ]]; then
    WDIO_CONFIG_PATH="lib/baseConfigs/wdio.local.browserstack.ios.conf.js"
  elif [[ "$PLATFORM" == "android" ]]; then
    WDIO_CONFIG_PATH="lib/baseConfigs/wdio.local.browserstack.android.conf.js"
  elif [[ "$PLATFORM" == "both" ]]; then
    WDIO_CONFIG_PATH="lib/baseConfigs/wdio.local.browserstack.both.conf.js"
  else
    log_error "Invalid platform specified. Use 'ios', 'android', or 'both'."
    exit 1
  fi
fi

# Function to upload app files
upload_image() {
  local input_file=$1
  RESULT=$(curl -k -u "$BS_USER:$BS_KEY" -X POST "https://api-cloud.browserstack.com/app-automate/upload" -F "file=@$input_file")
  
  if [[ $? -ne 0 || -z "$RESULT" ]]; then
    echo "App upload failed for $input_file!"
    exit 1
  fi
  
  local app_url=$(echo "$RESULT" | node -pe 'try { JSON.parse(process.argv[1]).app_url } catch (e) { console.error("Invalid JSON:", e); process.exit(1); }' "$RESULT")
  echo "$app_url"
}

# Function to handle app uploads and caching
handle_app_upload() {
  local platform=$1
  local app_file=$2
  local app_md5=$(md5sum "$app_file" | awk '{print $1}')
  local stored_md5=$(cat "$MD5_FILE.$platform" 2>/dev/null || echo "")

  if [[ "$MODE" == "browserstack" ]]; then
    if [[ "$app_md5" == "$stored_md5" ]]; then
    log_info "$platform app already uploaded, skipping." >&2
      echo $(cat "$IMAGE_BS_ID_FILE.$platform")
    else
      log_info "Uploading $platform app..." >&2
      local app_url=$(upload_image "$app_file")
      echo "$app_url" >"$IMAGE_BS_ID_FILE.$platform"
      echo "$app_md5" >"$MD5_FILE.$platform"
      echo "$app_url"
    fi
  else
    echo "$app_file"
  fi
}

# Upload apps and retrieve URLs
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
  IOS_APP_FILE="build/mobile-app.ipa"
  if [[ ! -f "$IOS_APP_FILE" ]]; then
    log_error "iOS app file not found: $IOS_APP_FILE"
    exit 1
  fi
  export BS_PATH_IOS=$(handle_app_upload "ios" "$IOS_APP_FILE")
  export BS_PATH=$BS_PATH_IOS
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
  ANDROID_APP_FILE="build/mobile-app.aab"
  ANDROID_APK_FILE="build/mobile-app.apk"

  if [[ -f "$ANDROID_APP_FILE" ]]; then
    export BS_PATH_ANDROID=$(handle_app_upload "android" "$ANDROID_APP_FILE")
  elif [[ -f "$ANDROID_APK_FILE" ]]; then
    log_warning ".aab file not found. Falling back to .apk file: $ANDROID_APK_FILE"
    export BS_PATH_ANDROID=$(handle_app_upload "android" "$ANDROID_APK_FILE")
  else
    log_error "No Android app file found (.aab or .apk). Checked paths: $ANDROID_APP_FILE, $ANDROID_APK_FILE"
    exit 1
  fi

  export BS_PATH=$BS_PATH_ANDROID
fi

WDIO_CONFIG_TEMP_PATH="lib/baseConfigs/.lastlocal.conf.js"

# Cleanup - Remove existing temporary file
if [[ -f "$WDIO_CONFIG_TEMP_PATH" ]]; then
  log_info "Removing existing temporary file."
  rm "$WDIO_CONFIG_TEMP_PATH"
fi

# Copy the configuration file
log_info "Copying configuration file to temporary location."
cp "$WDIO_CONFIG_PATH" "$WDIO_CONFIG_TEMP_PATH"

# Handle specs path
if [[ -z "$3" ]]; then
  CLEANED_SPECS_PATH="**/*.e2e.*"
else
  CLEANED_SPECS_PATH="$3"
fi

if [[ "$CLEANED_SPECS_PATH" == "['"* ]]; then
  FORMATTED_SPECS_PATH="$CLEANED_SPECS_PATH"
else
  FORMATTED_SPECS_PATH="['$CLEANED_SPECS_PATH']"
fi

log_info "Specs path set to: ${FORMATTED_SPECS_PATH}"

# Apply specs path to the configuration file
log_info "Applying specs path to configuration file."
WDIO_CONFIG_SPECS_CORRECT_PATH=$(echo "$FORMATTED_SPECS_PATH" | sed "s#'\\(\\*\\*/[^']*\\)'#path.resolve(cleanedPath, '\\1')#g")
sed "s#process.env.E2E_SPECS_PATTERN#$WDIO_CONFIG_SPECS_CORRECT_PATH#g" "$WDIO_CONFIG_TEMP_PATH" > "${WDIO_CONFIG_TEMP_PATH}.modified"
mv "${WDIO_CONFIG_TEMP_PATH}.modified" "$WDIO_CONFIG_TEMP_PATH"

# Run tests
log_info "Starting WDIO tests with configuration: $WDIO_CONFIG_TEMP_PATH"
npx wdio "$WDIO_CONFIG_TEMP_PATH" --logLevel=debug

if [[ $? -eq 0 ]]; then
  log_success "WDIO tests executed successfully!"
else
  log_error "WDIO tests failed. Check the logs for more details."
  exit 1
fi
