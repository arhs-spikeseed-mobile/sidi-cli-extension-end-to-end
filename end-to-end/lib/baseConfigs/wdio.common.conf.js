const path = require('path');

const testSummary = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Exporting the common base configuration for WebdriverIO
exports.commonBaseConfig = {
  // BrowserStack user credentials
  user: process.env.BS_USER || 'NOT-SET',
  key: process.env.BS_KEY || 'NOT-SET',
  app: process.env.BS_PATH || 'NOT-SET',
  updateJob: false,
  exclude: [],
  services: [
    [
      'browserstack',
      {
        testObservability: process.env.BS_TEST_OBSERVABILITY,
        testObservabilityOptions: {
          projectName: process.env.PROJECT_NAME,
          buildName: process.env.BUILD_BRANCH + " - " + process.env.TEAM_NAME,
        }
      }
    ]
  ],
  
  // Logging and timeout configurations
  logLevel: 'trace',
  coloredLogs: true,
  baseUrl: '',
  waitforTimeout: parseInt(process.env.WAIT_FOR_TIMEOUT), // Maximum time to wait for an element
  connectionRetryTimeout: parseInt(process.env.CONNECTION_RETRY_TIMEOUT), // Time to wait for connection retry
  connectionRetryCount: parseInt(process.env.CONNECTION_RETRY_COUNT), // Number of connection retry attempts
  maxInstances: parseInt(process.env.MAX_INSTANCES), // Max parallel instances
  
  // Framework and mocha-specific settings
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd', // Behavior driven development style
    timeout: 720000, // Test timeout in milliseconds
  },
  
  // Reporters for test results
  reporters: [
    ['junit', {
      outputDir: './build/reports/appium-junit',
      outputFileFormat: function (options) {
        return `appium-junit-results-${options.cid}.xml`;
      }
    }],
    ['html-nice', {
      outputDir: './build/reports/wdio-html-nice-reporter-results/',
      filename: `nice_reporter_results_${process.env.PLATFORM}_${process.env.TEAM_NAME}_${Date.now()}.html`,
      reportTitle: 'E2E Reports',
      linkScreenshots: true,
      showInBrowser: false,
      collapseTests: true,
      useOnAfterCommandForScreenshot: true
    }]
  ],
  
  /**
  * Function to be executed before a test (in Mocha/Jasmine) starts.
  */
  beforeTest: function (test, context) {
    console.log(`LOG running: ${test.title} ...`);
    
    const rtitle = context._runnable.parent.title.replace(/"/g, "'");
    browser.executeScript(
      'browserstack_executor: {"action": "setSessionName", "arguments": {"name":"' + rtitle + '"}}', []
    );
    
    // Default test status is set to failed
    browser.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason":"unknown"}}', []
    );
  },
  
  /**
  * Function to be executed after a test (in Mocha/Jasmine only)
  * @param {Object}  test             test object
  * @param {Object}  context          scope object the test was executed with
  * @param {Error}   result.error     error object in case the test fails, otherwise `undefined`
  * @param {Any}     result.result    return object of test function
  * @param {Number}  result.duration  duration of test
  * @param {Boolean} result.passed    true if test has passed, otherwise false
  * @param {Object}  result.retries   informations to spec related retries, e.g. `{ attempts: 0, limit: 0 }`
  */
  afterTest: function (test, context, { error, result, duration, passed }) {
    if (passed) testSummary.passed++;
    else testSummary.failed++;
    console.log(`\tℹ️--> [test]:`, test);
    console.log(`\tℹ️--> [duration]:`, duration);
    console.log(`\tℹ️--> [passed]:`, passed);
    
    const rtitle = context._runnable.parent.title.replace(/"/g, "'");
    let lresult = 'failed';
    let message = 'OK';
    
    if (passed) {
      lresult = 'passed';
      console.log(`\t${test.title} --> [STATUS]: ✅ PASSED`);
    } else {
      if (!error) {
        console.log(`\t${test.title} -->  CATCH UGLY ERROR WHEN WE REINSTALL THE APP`);
        return;
      }
      browser.takeScreenshot();
      console.log(`\t${test.title} --> [STATUS]: 🚨 FAILED`);
      message = error.toString().replace(/["'\x1B\[\7m`\\]/g, "").replace(/\n/g, "");
    }
    
    browser.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"' +
      lresult +
      '","reason":"' + message + '"}}', []
    );
  },
  
  /**
  * Gets executed once before all workers get launched.
  * @param {Object} config wdio configuration object
  * @param {Array.<Object>} capabilities list of capabilities details
  */
  onPrepare: (config, capabilities) => {
    if (process.env.LOCAL_MODE == true){
      console.log('Connecting local');
      return new Promise((resolve, reject) => {
        const browserstack = require('browserstack-local');
        exports.bs_local = new browserstack.Local();
        exports.bs_local.start({
          key: process.env.BS_KEY,
          localIdentifier: process.env.LOCAL_IDENTIFIER,
        }, error => {
          if (error) {
            console.log(`🚨: ${error}. Did you run "yarn/npm e2e:browserstack:software:browserstacklocal?"`);
            reject(error);
          } else {
            console.log('✅ browserstack-local connected. Now testing...');
            resolve();
          }
        });
      });
    }
  },
  
  /**
  * Gets executed after all workers got shut down and the process is about to exit. An error
  * thrown in the onComplete hook will result in the test run failing.
  * @param {Object} exitCode 0 - success, 1 - fail
  * @param {Object} config wdio configuration object
  * @param {Array.<Object>} capabilities list of capabilities details
  * @param {<Object>} results object containing test results
  */
  onComplete: (capabilities, specs) => {
    if (process.env.LOCAL_MODE == true){
      console.log('Closing local tunnel');
      return new Promise((resolve, reject) => {
        exports.bs_local.stop(error => {
          if (error) return reject(error);
          console.log('Stopped BrowserStackLocal');
          resolve();
        });
      });
    }
    console.log(`Test Summary: ${JSON.stringify(testSummary)}`);
  }
};