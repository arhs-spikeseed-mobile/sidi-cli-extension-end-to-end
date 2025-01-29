(async () => {
  if (process.env.HTTPS_PROXY) {
    const { setGlobalDispatcher, ProxyAgent } = await import("undici");
    setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
    console.log(`Proxy set to: ${process.env.HTTPS_PROXY}`);
  } else {
    console.log("No HTTPS_PROXY environment variable set. Skipping proxy setup.");
  }
})();

const { commonBaseConfig } = require("./wdio.common.conf");
const path = require("path");
const suffixToRemove = path.normalize("end-to-end/lib/baseConfigs");
const filePath = path.resolve(__dirname);
const normalizedFilePath = path.normalize(filePath);

const cleanedPath = normalizedFilePath.endsWith(suffixToRemove)
? normalizedFilePath.slice(0, -suffixToRemove.length)
: normalizedFilePath;

exports.config = {
  ...commonBaseConfig,
  specs: process.env.E2E_SPECS_PATTERN,
  capabilities: [
    {
      "bstack:options": {
        projectName: process.env.PROJECT_NAME,
        buildName: process.env.BUILD_BRANCH + " (" + process.env.BUILD_NUMBER + ") (" + process.env.BUILD_NUMBER + ") - iOS16 - " + process.env.TEAM_NAME + " - " + new Date().toDateString() + "-*-" + new Date().getHours() + "h" + new Date().getMinutes(),
        debug: process.env.DEBUG,
        networkLogs: process.env.NETWORK_LOG,
        midSessionInstallApps: [process.env.BS_PATH],
        timezone: process.env.TIMEZONE,
        idleTimeout: "300",
        appiumVersion: process.env.APPIUM_VERSION,
        /*localIdentifier: process.env.LOCAL_IDENTIFIER,
        local: process.env.LOCAL_MODE,*/
        networkLogsOptions: {
          captureContent: "true",
        },
        interactiveDebugging: true
      },
      "appium:maxInstances": 1,
      "appium:platformVersion": "16.0",
      "appium:deviceName": "iPhone 14 Pro Max",
      "appium:app": process.env.BS_PATH,
      "appium:settings[snapshotMaxDepth]": "100",
      "appium:settings[customSnapshotTimeout]": "50000",
      platformName: "iOS",
      "appium:ensureWebviewsHavePages": true,
      "appium:nativeWebScreenshot": true,
      "appium:newCommandTimeout": 3600,
      "appium:connectHardwareKeyboard": true,
      "proj:options": {
        build_url: process.env.BUILD_URL,
        build_number: process.env.BUILD_NUMBER,
        git_branch: process.env.BUILD_BRANCH,
        team_name: process.env.TEAM_NAME,
      },
    },
  ],
};