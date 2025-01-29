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
      platformName: "iOS",
      "appium:automationName": "XCUITest",
      "appium:platformVersion": "17.0", // Replace with your iOS simulator version
      "appium:deviceName": "iPhone 15", // Replace with your simulator"s name
      "appium:app": "./build/mobile-app.ipa",
      "appium:ensureWebviewsHavePages": true,
      "appium:nativeWebScreenshot": true,
      "appium:newCommandTimeout": 3600,
      "appium:connectHardwareKeyboard": true,
    },
  ],
  services: ["appium"],
  appium: {
    command: "appium",
  },
  baseUrl: "",
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },
};
