
import fs from 'fs';
import path from 'path';

/**
* Script to download build artifacts from CI/CD platforms like CodeMagic and Bitrise.
*
* The script retrieves artifacts based on a provider, application ID, and branch.
*
* Usage:
* ```bash
* node downloadArtifacts.mjs <provider> <app_id> <app_branch>
* ```
* Example:
* ```bash
* node downloadArtifacts.mjs codemagic 123456 acceptance/1.0.0 
* ```
*/

let CODEMAGIC_TOKEN = '';
let BITRISE_TOKEN = '';
let APP_ID = '';
let APP_BRANCH = '';
let PROVIDER = '';
let APP_WORKFLOW = '';

/**
* Logs messages with a timestamp.
*
* @param {string} message - The message to log.
*/
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};


/**
* Obfuscates a token by masking the middle part of the string.
*
* @param {string} token - The token to obfuscate.
* @param {number} limit - The number of characters to keep visible at the start and end of the token.
* @returns {string} - The obfuscated token with the middle part replaced by asterisks.
*/
const obfuscateToken = (token, limit) => {
  if (token.length <= 8) {
    return token.replace(/./g, '*');
  }
  
  const start = token.slice(0, limit);
  const end = token.slice(-limit);
  const masked = '*'.repeat(token.length - start.length - end.length);
  return `${start}${masked}${end}`;
};

/**
* Obfuscates sensitive data in a URL by masking tokens and IDs.
*
* @param {string} url - The URL to obfuscate.
* @param {Array<string>} keysToMask - Keys in the query parameters to obfuscate.
* @returns {string} - The obfuscated URL.
*/
const obfuscateUrl = (url, keysToMask = ['appId', 'workflowId', 'token', 'branch']) => {
  const urlObj = new URL(url);
  keysToMask.forEach((key) => {
    if (urlObj.searchParams.has(key)) {
      const value = urlObj.searchParams.get(key);
      urlObj.searchParams.set(key, obfuscateToken(value, 3));
    }
  });
  return urlObj.toString();
};

/**
* Determines the workflow based on the branch name.
*
* Logic:
* - If the branch is named "acceptance" or starts with "acceptance/", the workflow will be "acceptance".
* - For any other branch, the workflow will match the full branch name.
*
* @param {string} branch - The name of the branch.
* @returns {string} - The corresponding workflow name.
*/
const getAppWorkflow = (branch) => {
  // Use regex to extract the workflow from the branch name
  const workflowRegex = /^(\w+)(\/.*)?$/; // Matches "prod", "prod/*", "test", "test/*", etc.
  
  const match = branch.match(workflowRegex);
  if (match) {
    return match[1]; // Extract the first part of the branch name as the workflow
  }
  
  // Fallback to the full branch name if no match is found
  return branch;
};

/**
* Fetches data from a URL with retry logic.
*
* @param {string} url - The URL to fetch.
* @param {object} options - Fetch options including method and headers.
* @param {number} [maxRetries=3] - Maximum number of retry attempts.
* @param {number} [retryDelay=3000] - Delay between retries in milliseconds.
* @returns {Promise<object>} The JSON response.
*/
const fetchWithRetry = async (url, options = {}, maxRetries = 3, retryDelay = 3000) => {
  const { fetch, ProxyAgent } = await import('undici');
  if (process.env.HTTPS_PROXY) {
    options.dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
  }
  
  const obfuscatedUrl = obfuscateUrl(url);
  
  for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
    try {
      log(`Fetching URL: ${obfuscatedUrl} (Attempt ${retryCount})`);
      const response = await fetch(url, options);
      if (response.ok) {
        log(`✅ Successful response from ${obfuscatedUrl}`);
        return response.json();
      } else {
        log(`🚨 Response error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      log(`❌ Attempt ${retryCount} failed: ${error.message}`);
    }
    if (retryCount < maxRetries) {
      log(`🚨 Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error(`🚨 Failed to fetch data from ${url} after ${maxRetries} attempts.`);
};

/**
* Fetches build artifacts from CodeMagic with cursor pagination and retry logic, ensuring it checks up to 5 pages.
*
* @returns {Promise<object[]>} An array of artifacts or an empty array if none are found.
*/
const getCodeMagicArtifacts = async () => {
  log('Fetching artifacts from CodeMagic...');

  let url;
  const options = {
    method: 'GET',
    headers: {}
  };

  // Check if CODEMAGIC_TOKEN starts with "dashboards/"
  if (CODEMAGIC_TOKEN.startsWith("dashboards/")) {
    const dashboardId = CODEMAGIC_TOKEN.split('/')[1]; // Extract dashboard ID
    url = `https://codemagic.io/api/v3/dashboards/${dashboardId}/builds?page_size=100`;
  } else {
    url = `https://api.codemagic.io/builds?appId=${APP_ID}&workflowId=${APP_WORKFLOW}&branch=${APP_BRANCH}&status=finished`;
    options.headers['x-auth-token'] = CODEMAGIC_TOKEN; // Auth token for the old endpoint
  }

  let allArtifacts = [];
  let retries = 0;
  let cursor = null;

  // Loop through pagination, retry up to 5 pages if no results are found initially
  while (retries < 10 && cursor !== undefined) {
    let paginatedUrl = cursor ? `${url}&cursor=${cursor}` : url;

    const response = await fetchWithRetry(paginatedUrl, options);
    log('CodeMagic API response received.');

    if (response) {
      let artifactsInPage = 0;

      if (url.includes("dashboards/")) {
        if (response.data && response.data.length > 0) {
          const filteredBuilds = response.data.filter(build => build.branch === APP_BRANCH);
          
          if (filteredBuilds.length > 0) {
            const lastBuild = filteredBuilds[0];
            log(`✅ Found ${lastBuild.artifacts.length} artifact(s) in this page.`);
            artifactsInPage = lastBuild.artifacts.length;
            allArtifacts = allArtifacts.concat(lastBuild.artifacts || []);
            cursor = response.cursor;  // Set cursor for the next page

            // Stop pagination if artifacts are found
            if (artifactsInPage > 0) {
              log(`ℹ️ Stopping further fetches as the branch ${APP_BRANCH} artifacts have been found.`);
              break;
            }
          }
        }
      } else {
        if (response.builds && response.builds.length > 0) {
          const lastBuild = response.builds[0];
          log(`✅ Found ${lastBuild.artefacts.length} artifact(s) in this page.`);
          artifactsInPage = lastBuild.artefacts.length;
          allArtifacts = allArtifacts.concat(lastBuild.artefacts || []);
          cursor = response.cursor;

          // Stop pagination if artifacts are found
          if (artifactsInPage > 0) {
            log(`ℹ️ Stopping further fetches as the branch ${APP_BRANCH} artifacts have been found.`);
            break;
          }
        }
      }

      log(`Total artifacts retrieved so far: ${allArtifacts.length}`);

      // Retry pagination if no artifacts were found on this page
      if (cursor === undefined || allArtifacts.length >= 500) {
        log(`🚨 Stopping pagination. Total artifacts: ${allArtifacts.length}.`);
        break;
      }

      retries++;
      log(`ℹ️ Retries left: ${5 - retries}`);
    }
  }

  if (allArtifacts.length === 0) {
    log('🚨 No builds or artifacts found on CodeMagic.');
  }
  
  return allArtifacts;
};



/**
* Fetches build artifacts from Bitrise.
*
* @returns {Promise<object[]>} An array of artifacts or an empty array if none are found.
*/
const getBitriseArtifacts = async () => {
  log('Fetching artifacts from Bitrise...');
  const buildsUrl = `https://api.bitrise.io/v0.1/apps/${APP_ID}/builds?branch=${APP_BRANCH}&status=1`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: BITRISE_TOKEN,
    },
  };
  const buildsResponse = await fetchWithRetry(buildsUrl, options);
  log('Bitrise builds API response received.');
  if (buildsResponse && buildsResponse.data && buildsResponse.data.length > 0) {
    const buildSlug = buildsResponse.data[0].slug;
    const artifactsUrl = `https://api.bitrise.io/v0.1/apps/${APP_ID}/builds/${buildSlug}/artifacts`;
    log(`Fetching artifacts from Bitrise using build slug: ${buildSlug}`);
    const artifactsResponse = await fetchWithRetry(artifactsUrl, options);
    log('Bitrise artifacts API response received.');
    if (artifactsResponse && artifactsResponse.data) {
      log('✅ Bitrise artifacts list retrieved successfully.');
      return artifactsResponse.data.map((artifact) => ({
        name: artifact.title,
        url: artifact.expiring_download_url,
      }));
    }
  }
  log('🚨 No builds or artifacts found on Bitrise.');
  return [];
};

/**
* Downloads a single artifact to the `build/` directory.
*
* @param {object} artifact - The artifact to download.
* @param {string} artifact.name - The name of the artifact.
* @param {string} artifact.url - The URL of the artifact.
* @returns {Promise<void>} Resolves when the download is complete.
*/
import { pipeline } from 'stream';
import { promisify } from 'util';
const streamPipeline = promisify(pipeline);

const downloadArtifact = async (artifact) => {
  // Skip invalid artifact file types
  if (!/\.(ipa|aab|apk)$/.test(artifact.name)) {
    log(`❎ Skipping artifact: ${artifact.name} (not a .ipa, .aab, or .apk file)`);
    return;
  }
  
  const headers = PROVIDER === 'codemagic'
  ? { 'x-auth-token': CODEMAGIC_TOKEN }
  : { Authorization: BITRISE_TOKEN };
  
  const { fetch, ProxyAgent } = await import('undici');
  const options = { headers };
  
  if (process.env.HTTPS_PROXY) {
    options.dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
  }

  log(`⬇️  Downloading artifact: ${artifact.name || artifact.short_lived_download_url}`);
  const response = await fetch(artifact.url || artifact.short_lived_download_url, options);
  
  if (!response.ok) {
    throw new Error(`Failed to download ${artifact.name}: ${response.statusText}`);
  }
  
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }
  
  // Construct the new file name
  const fileExtension = path.extname(artifact.name);
  const newFileName = `mobile-app${fileExtension}`;
  const filePath = `build/${newFileName}`;
  const fileStream = fs.createWriteStream(filePath);
  
  await streamPipeline(response.body, fileStream);
  
  log(`✅ Download completed and renamed to: ${newFileName}`);
};

/**
* Main execution script to fetch and download artifacts.
*/
(async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 4) {
      throw new Error(
        `🚨 Usage: node downloadArtifacts.js <provider> <token> <app_id> <app_branch>, received: ${args}`
      );
    }
    
    const [provider, token, appID, appBranch] = args;
    const tokenObsfucate = await obfuscateToken(token,8);
    const appIDObsfucate = await obfuscateToken(appID,3);
    log(`ℹ️ Starting script with provider: ${provider}, token: ${tokenObsfucate}, app id ${appIDObsfucate}, branch: ${appBranch}`);
    
    if (!provider || !token || !appBranch || !appID) {
      throw new Error('🚨 Invalid arguments. Ensure all arguments are provided in the correct order.');
    }
    
    PROVIDER = provider.toLowerCase();
    APP_ID = appID;
    APP_BRANCH = appBranch;
    APP_WORKFLOW = getAppWorkflow(APP_BRANCH);
    log(`ℹ️ Derived APP_WORKFLOW: ${APP_WORKFLOW}`);
    
    if (PROVIDER !== 'codemagic' && PROVIDER !== 'bitrise') {
      throw new Error('🚨 Unsupported provider. Use "codemagic" or "bitrise".');
    }
    
    if (PROVIDER === 'codemagic') {
      CODEMAGIC_TOKEN = token;
    } else if (PROVIDER === 'bitrise') {
      BITRISE_TOKEN = token;
    }
    
    const artifacts =
    PROVIDER === 'codemagic'
    ? await getCodeMagicArtifacts()
    : await getBitriseArtifacts();
    
    if (artifacts.length > 0) {
      log(`ℹ️ Found ${artifacts.length} artifact(s). Starting download...`);
      for (const artifact of artifacts) {
        await downloadArtifact(artifact);
      }
    } else {
      log('❌ No artifacts found.');
    }
  } catch (error) {
    log(`🚨 Unexpected error occurred: ${error.message}`);
  }
})();