import { MockResponse } from 'react-native-netwatch/lib/Components/Mocking/utils';
import { driver } from '@wdio/globals'
import { error } from 'console';
import fetch from 'node-fetch';
import {HttpsProxyAgent } from 'https-proxy-agent';
const apiTestdata = require('../../__e2e__/common/data/APITestdata.json');

/**
* Enum representing different wait durations in milliseconds.
* WAIT_VERY_SHORT: 2 seconds
* WAIT_SHORT: 5 seconds
* WAIT_MEDIUM: 12 seconds
* WAIT_LONG: 20 seconds
* WAIT_EXTRA_LONG: 30 seconds
* WAIT_TOO_LONG: 50 seconds
*/
export enum Wait {
  WAIT_VERY_SHORT = 2000,
  WAIT_SHORT = 5000,
  WAIT_MEDIUM = 12000,
  WAIT_LONG = 20000,
  WAIT_EXTRA_LONG = 30000,
  WAIT_TOO_LONG = 50000,
}

/**
* Number of retry attempts for certain operations.
* Default: 1
*/
export const RETRY_COUNT = 1;

/**
* Pauses execution for a specified number of milliseconds.
* @param {number} [seconds=10000] - Time in milliseconds to wait.
* @returns {Promise<void>}
*/
export async function wait(seconds = 10 * 1000) {
  await new Promise((r) => setTimeout(r, seconds));
}

/**
* Sets the geographical location for testing using Appium.
* 
* If the `accuracy` parameter is not provided, it defaults to `100`.
* 
* @param {Object} coordinates - An object containing latitude, longitude, and optional accuracy.
* @param {number} coordinates.latitude - Latitude of the location.
* @param {number} coordinates.longitude - Longitude of the location.
* @param {number} [coordinates.altitude=0] - Altitude of the location (optional, defaults to 0).
* @returns {Promise<void>}
*/
export async function setGeoLocation(coordinates: { latitude: number; longitude: number; altitude?: number }) {
  const { latitude, longitude, altitude = 0 } = coordinates;
  // not working
  //await driver.setGeoLocation({ latitude, longitude, altitude });
}

/**
* Simulates a tap gesture at specific screen coordinates.
* ⚠️ Using pixel locations is not recommended. Use element selectors instead.
* @deprecated This method relies on specific screen coordinates and is prone to errors. 
* Consider using element selectors with methods like `driver.elementClick` for more robust interactions.
* 
* @param {number} x - X coordinate on the screen.
* @param {number} y - Y coordinate on the screen.
* @returns {Promise<boolean>} Resolves to true if the tap is successful, false otherwise.
*/
export async function tapAtCoordinates({ x, y }) {
  try {
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
    
    return true;
  } catch (error) {
    console.warn(`Error performing tap at (${x}, ${y}):`, error.message);
    return false;
  }
}

/**
* Simulates a swipe gesture from one set of screen coordinates to another.
* ⚠️ Using pixel locations is not recommended. Use element selectors instead.
* @deprecated This method relies on specific screen coordinates, which can lead to brittle tests. 
* Consider using element selectors and gestures with methods like `driver.performActions` targeting elements directly.
* 
* @param {Object} start - Starting coordinates.
* @param {number} start.x - X coordinate of the starting point.
* @param {number} start.y - Y coordinate of the starting point.
* @param {Object} end - Ending coordinates.
* @param {number} end.x - X coordinate of the ending point.
* @param {number} end.y - Y coordinate of the ending point.
* @param {number} duration - Duration of the swipe in milliseconds.
* @returns {Promise<boolean>} - True if the swipe was successful, false otherwise.
*/
export async function swipe({ start, end, duration = 200 }) {
  try {
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: start.x, y: start.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration },
          { type: 'pointerMove', duration: 2000, origin: 'pointer', x: end.x, y: end.y },
          { type: 'pointerUp', button: 0 }
        ],
      },
    ]);
    return true;
  } catch (error) {
    console.warn(`Error performing swipe from (${start.x}, ${start.y}) to (${end.x}, ${end.y}):`, error.message);
    return false;
  }
}

/**
* Sanitizes an array of mock responses by removing single quotes from the response strings.
* This can help to ensure that the responses are formatted consistently and avoid errors
* related to incorrect string formatting.
*
* @param {MockResponse[]} mocks - Array of mock response objects to be sanitized.
* @param {string} mocks[].response - Response string to be sanitized (optional).
* @returns {MockResponse[]} - The sanitized array of mock responses.
*/
function sanitizeMocks(mocks: MockResponse[]) {
  return mocks.map((mock) => {
    if (mock.response) {
      mock.response = mock.response.replace(/'/g, '');
    }
    return mock;
  });
}


/**
* Captures a screenshot of the current state of the application.
* Useful for debugging and visual regression testing.
* 
* Note: The screenshot is saved to the default directory specified by the driver configuration.
*
* @returns {Promise<void>} - Resolves when the screenshot is successfully taken.
*/
export async function takeScreenshot() {
  await driver.takeScreenshot();
}


/**
* Relaunches the application.
* Useful for resetting the app's state.
* @returns {Promise<void>}
*/
export async function relaunchApp(netwatchMocks?: MockResponse[]) {
  if (netwatchMocks) {
    try {
      if (isiOS()) {
        await driver.execute('mobile: terminateApp', {
          // @ts-ignore
          bundleId: driver.capabilities.bundleId,
        });
        await driver.execute('mobile: launchApp', {
          // @ts-ignore
          bundleId: driver.capabilities.bundleId,
          arguments: [
            '-e2e',
            'true',
            '-netwatchMocks',
            `${JSON.stringify(sanitizeMocks(netwatchMocks))}`,
          ], // the deep link
        });
      } else {
        await driver.terminateApp(driver.capabilities.appPackage);
        await driver.pause(1000);
        await driver.startActivity(
          driver.capabilities.appPackage,
          driver.capabilities.appActivity,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          `--es 'e2e' 'true' --es 'netwatchMocks' '${JSON.stringify(sanitizeMocks(netwatchMocks))}'`
        );
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  await wait(20 * 1000);
}

/**
* Resets the application to its initial state.
* This may include clearing data or restarting services.
* @returns {Promise<void>}
*/
export async function resetApp() {
  if (isiOS()) {
    // iOS (Browserstack)
    await driver.removeApp(driver.capabilities.bundleId!);
    await driver.installApp(process.env.BS_PATH || process.env.BS_PATH_IOS);
    await wait(Wait.WAIT_MEDIUM);
    await driver.activateApp(driver.capabilities.bundleId!);
    await driver.terminateApp(driver.capabilities.bundleId!);
    await driver.activateApp(driver.capabilities.bundleId!);
  } else {
    await driver.removeApp(driver.capabilities.bundleId!);
    await driver.installApp(process.env.BS_PATH || process.env.BS_PATH_ANDROID);
    await wait(Wait.WAIT_MEDIUM);
    await driver.activateApp(driver.capabilities.bundleId!);
  }
  
  await wait(20 * 1000);
}

/**
* Adds annotations for debugging or logging purposes.
* @param {string} message - Annotation message.
* @returns {void}
*/
export function annotate(msg: string) {
  driver.execute(
    'browserstack_executor: {"action": "annotate", "arguments": {"data":"' +
    msg +
    '","level": "info"}}'
  );
}

/**
* Retrieves the version of the operating system.
* @returns {string} OS version.
*/
export function getOSVersion() {
  return parseFloat(driver.capabilities.platformVersion);
}

/**
* Determines if the platform is Android.
* @returns {boolean} True if the platform is Android, otherwise false.
*/
export function isAndroid() {
  return driver.isAndroid;
}

/**
* Determines if the platform is iOS.
* @returns {boolean} True if the platform is iOS, otherwise false.
*/
export function isiOS() {
  return driver.isIOS;
}

/**
* Constant used for element selection.
*/
export const selector = (key: string) =>
  isAndroid() ? `//*[@resource-id="${key}"]` : `~${key}`;

/**
* Constant used for text-based element selection.
*/
export const selectorText = (text: string) =>
  isAndroid() ? `//*[contains(@text, "${text}")]` : `//*[contains(@label, "${text}")]`;

/**
* Constant used for webview text-based element selection.
*/
export const selectorTextInWebView = (text: string) =>`//*[contains(text(), "${text}")]`;

/**
 * Interface for scroll options used in handling scroll actions.
 * 
 * @typedef {Object} scrollOptions
 * @property {boolean} [up] - If true, scrolls upward; otherwise, scrolls downward.
 * @property {boolean} [reverse] - If true, reverses the scroll direction.
 * @property {boolean} [waitDisplayed] - If true, waits for the element to be displayed before scrolling.
 */
interface scrollOptions {
  up?: boolean;
  reverse?: boolean;
  waitDisplayed?: boolean;
}

/**
 * Scrolls the screen in a specified direction relative to the provided selector.
 * 
 * @param {string} selector - The selector for the element to scroll to.
 * @param {boolean} [up] - If true, scrolls up; otherwise, scrolls down.
 * 
 * @example
 * handleScroll('login-button', true); // Scrolls up to the element with selector 'login-button'.
 */
function handleScroll(selector: string, up?: boolean) {
  driver.execute('mobile: scroll', {
    direction: up ? 'up' : 'down',
    strategy: 'accessibility id',
    selector,
  });
}

/**
 * Retrieves a selector for an element by its `id` attribute, with platform-specific handling.
 * 
 * On Android, it uses an XPath query with the `resource-id` attribute.
 * On iOS, it uses the accessibility ID strategy.
 * 
 * @param {string} id - The `id` of the desired element.
 * @returns {Promise<WebdriverIO.Element>} - A WebDriverIO element representing the selected element.
 * 
 * @example
 * const element = await getSelectorForId('login-button');
 */
function getSelectorForId(id: string) {
  return isAndroid() ? $(`//*[@resource-id="${id}"]`) : $(`~${id}`);
}

/**
 * Common options used across various operations like waiting, scrolling, etc.
 * 
 * @constant
 * @type {Object}
 * @property {number} timeout - Timeout duration in milliseconds (default: 180000ms).
 * @property {boolean} reverse - Indicates whether to reverse the action (default: false).
 * 
 * @example
 * console.log(commonOptions.timeout); // Outputs: 180000
 */
const commonOptions = {
  timeout: 180000,
  reverse: false,
};

/**
* Scrolls through the screen and waits for a specific element or condition.
* @param {string} element - The element to wait for.
* @returns {Promise<void>}
*/
export function scrollAndWaitFor(
  id: any,
  options: scrollOptions = { up: false, reverse: false, waitDisplayed: false }
) {
  const { up, reverse, waitDisplayed } = options;
  handleScroll(id, up);
  if (waitDisplayed) {
    getSelectorForId(id).waitForDisplayed({ ...commonOptions, reverse });
  } else {
    getSelectorForId(id).waitForExist({ ...commonOptions, reverse });
  }
}

/**
* Scrolls to a specific element using UI Automator and a text string.
* @param {string} text - Text to scroll to.
* @returns {Promise<void>}
*/
export async function scrollByUiAutomatorText(text: string) {
  if (isAndroid()) {
    await wait(5000);
    const bottomElementSelector = `new UiScrollable(new UiSelector().scrollable(false)).scrollIntoView(new UiSelector().text("${text}"))`;
    await expect($(`android=${bottomElementSelector}`)).toBeExisting();
  }
}

/**
* Retrieves the current device time.
* @returns {Promise<string>} A promise that resolves to the current device time in ISO format.
*/
export async function getDeviceTime() {
  return driver.getDeviceTime();
}

/**
* Changes the system time for testing purposes.
* @param {string} time - The new time to set.
* @returns {Promise<void>}
*/
export async function changeTime(time: string) {
  if (isAndroid()) {
    await driver.execute(
      `browserstack_executor: { "action": "updateAndroidDeviceSettings", "arguments": { "customTime" : "${time}"}}`
    );
  } else {
    await driver.execute(
      `browserstack_executor: { "action": "updateIosDeviceSettings", "arguments": { "customTime" : "${time}" }}`
    );
  }
}

/**
* Pauses the execution of the test for a specified number of milliseconds.
* 
* @param {number} milliseconds - The amount of time to pause the execution (in milliseconds).
* @returns {Promise<void>} A promise that resolves after the pause duration.
* 
* @example
* // Pause for 2 seconds
* await pause(2000);
*/
export async function pause(milliseconds: number) {
  driver.pause(milliseconds)
}

/**
* Sends the application to the background for a specified amount of time.
*
* @param {number} seconds - The duration to send the app to the background (in seconds).
* @returns {Promise<void>} A promise that resolves after the background duration.
*
* @example
* // Send the app to the background for 5 seconds
* await background(5);
*/
export async function background(seconds: number) {
  driver.execute('mobile: backgroundApp', { seconds })
}

/**
* Restarts the application.
* Useful for testing app lifecycle behaviors.
* @returns {Promise<void>}
*/
export async function restartApp() {
  const id = isAndroid() ? driver.capabilities.appPackage : driver.capabilities.bundleId;
  
  await wait(Wait.WAIT_MEDIUM);
  await driver.terminateApp(id);
  await wait(Wait.WAIT_SHORT);
  await driver.activateApp(id);
  
}

/**
* Closes the application.
* @returns {Promise<void>}
*/
export async function closeApp() {
  try {// @ts-ignore
    driver.isAndroid ? await driver.terminateApp(driver.capabilities.appPackage)
      // @ts-ignore  
      : await driver.execute('mobile: terminateApp', { bundleId: driver.capabilities.bundleId })
  } catch (e) {
    console.error("Not able to kill the app: " + e);
  }
}

/**
* Opens a deep link in the application.
* @param {string} deepLink - The deep link URL.
* @returns {Promise<void>}
*/
export async function openDeepLink2(url: string) {
  // @ts-ignore
  const id = isAndroid() ? driver.capabilities.appPackage : driver.capabilities.bundleId;
  
  await wait(Wait.WAIT_MEDIUM);
  
  if (isiOS()) {
    await driver.execute('mobile: launchApp', { bundleId: 'com.apple.mobilesafari' });
    
    const urlTabBarItemTitle = `type == "XCUIElementTypeTextField" && name CONTAINS "TabBarItemTitle"`;
    const urlFieldSelector = 'type == "XCUIElementTypeTextField" && name CONTAINS "URL"';
    const urlTab = await $(`-ios predicate string:${urlTabBarItemTitle}`);
    const urlField = await $(`-ios predicate string:${urlFieldSelector}`);
    
    await urlTab.waitForDisplayed({ timeout: 15000 });
    await urlTab.click();
    
    await urlField.setValue(`${url}\uE007`);
    
    const openSelector = 'type == "XCUIElementTypeButton" && name CONTAINS "Open"';
    const openButton = await $(`-ios predicate string:${openSelector}`);
    await openButton.waitForExist({ timeout: 15000 });
    await openButton.click();
  } else {
    await driver.execute('mobile:deepLink', {
      url: `${url}`,
      package: id,
    });
  }
  await wait(Wait.WAIT_MEDIUM);
}

/**
* Opens a deep link in the application.
* @param {string} deepLink - The deep link URL.
* @returns {Promise<void>}
*/
export async function openDeepLink(url: string) {
  // @ts-ignore
  const id = isAndroid() ? driver.capabilities.appPackage : driver.capabilities.bundleId;
  
  await wait(Wait.WAIT_MEDIUM);
  await background(null);

  await wait(Wait.WAIT_SHORT);
  if (isiOS()) {
    // await driver.execute('mobile: launchApp', { bundleId: 'com.apple.mobilesafari' });
    await driver.activateApp('com.apple.mobilesafari');
    
    const urlTabBarItemTitle = `type == "XCUIElementTypeTextField" && name CONTAINS "TabBarItemTitle"`;
    const urlFieldSelector = 'type == "XCUIElementTypeTextField" && name CONTAINS "URL"';
    const urlTab = await $(`-ios predicate string:${urlTabBarItemTitle}`);
    const urlField = await $(`-ios predicate string:${urlFieldSelector}`);
    
    await urlTab.waitForDisplayed();
    await urlTab.click();
    
    await urlField.setValue(`${url}\uE007`);
    
    const openSelector = 'type == "XCUIElementTypeButton" && name CONTAINS "Open"';
    const openButton = await $(`-ios predicate string:${openSelector}`);
    await openButton.waitForExist({ timeout: 15000 });
    await openButton.click();
  } else {
    await driver.execute('mobile:deepLink', {
      url: `${url}`,
      package: id,
    });
  }
  await wait(Wait.WAIT_MEDIUM);
}

/**
* Scrolls to the beginning of the page.
* @returns {Promise<void>}
*/
export async function scrollToPageBeginning() {
  if (isAndroid()) {
    await wait(Wait.WAIT_MEDIUM);
    await expect(
      $(
        `android=new UiScrollable(new UiSelector().resourceId("scrollContainer1")).flingToBeginning(1000)`
      )
    ).toBeDisplayed();
    await wait(Wait.WAIT_MEDIUM);
  }
}

/**
* Scrolls to the end of the page.
* @returns {Promise<void>}
*/
export async function scrollToPageEnd() {
  if (isAndroid()) {
    await wait(Wait.WAIT_MEDIUM);
    await expect(
      $(
        `android=new UiScrollable(new UiSelector().resourceId("scrollContainer1")).flingToEnd(1000)`
      )
    ).toBeDisplayed();
    await wait(Wait.WAIT_MEDIUM);
  }
}

/**
* Simulates pressing the backspace key.
* @returns {Promise<void>}
*/
export async function clickBackspaceKey(count: number, element: any) {
  for (let i = 0; i <= count; i++) {
    await element.setValue('\b');
  }
}

/**
* Simulates typing a key on the keyboard.
* @param {string} key - The key to type.
* @returns {Promise<void>}
*/
export async function typeKey(text: string) {
  let actions = [];
  
  for (const char of text) {
    actions.push({ type: 'keyDown', value: char }, { type: 'keyUp', value: char });
  }
  await driver.performActions([
    {
      type: 'key',
      id: 'keyboard',
      actions: [...actions],
    },
  ]);
}

/**
* Function to open URL in default browser
* @param url 
*/
export async function openUrlInBrowser(url: string) {
  // @ts-ignore
  const id = isAndroid() ? driver.capabilities.appPackage : driver.capabilities.bundleId;
  
  await wait(Wait.WAIT_MEDIUM);
  
  if (driver.isIOS) {
    await driver.execute('mobile: launchApp', { bundleId: 'com.apple.mobilesafari' });
    
    const urlTabBarItemTitle = `type == "XCUIElementTypeTextField" && name CONTAINS "TabBarItemTitle"`;
    const urlFieldSelector = 'type == "XCUIElementTypeTextField" && name CONTAINS "URL"';
    const urlTab = await $(`-ios predicate string:${urlTabBarItemTitle}`);
    const urlField = await $(`-ios predicate string:${urlFieldSelector}`);
    
    await urlTab.waitForDisplayed({ timeout: 15000 });
    await urlTab.click();
    
    await urlField.setValue(`${url}\uE007`);
  } else {
    await driver.setOrientation('PORTRAIT');
    await driver.execute('mobile: deepLink', {
      url: url,
      package: 'com.android.chrome',
    });
  }
  await wait(Wait.WAIT_MEDIUM);
}

/**
* Function to switch into available webview context
*/
export async function switchToWebviewContext() {
  await wait(Wait.WAIT_MEDIUM);
  try {
    let attempts = 0;
    let webViewContext = null;
    
    while (attempts < 5) {
      const contexts = await driver.getContexts();
      
      if (!contexts || contexts.length === 0) {
        throw new Error('No contexts found');
      } else {
        await annotate("Available contexts: ${JSON.stringify(contexts, null, 2)}");
        for (const context of contexts) {
          if (isAndroid()) {
            if (typeof context === 'string' && context.includes('WEBVIEW')) {
              webViewContext = context;
              break;
            }
          } else {
            if (typeof context === 'object' && context.id && context.id.includes('WEBVIEW')) {
              webViewContext = context.id;
              break;
            }
          }
        }
      }
      
      if (webViewContext) {
        await driver.switchContext(webViewContext);
        await annotate("Switched to webview context: ${webViewContext}");
        
        const currentContext = await driver.getContext();
        if (currentContext === webViewContext) {
          await annotate("Successfully switched to webview context: ${webViewContext}");
          break;
        } else {
          annotate("Context switch verification failed. Retrying...");
        }
      }
      attempts++;
      if (attempts < 5) {
        await driver.pause(2000);
      }
    }
    throw new Error('Failed to switch to webview context');
  } catch (error) {
    console.error(`Error while switching to webview context: ${error}`);
  }
}

/**
 * Selects a webview HTML element by its `id` attribute.
 *
 * This function uses WebDriverIO's `$()` method to find an element
 * by its `id` attribute. The returned element can then be interacted with
 * (e.g., clicked, typed into, or verified).
 *
 * @param {string} id - The `id` attribute of the desired HTML element.
 * @returns {Promise<WebdriverIO.Element>} - A promise that resolves to the WebDriverIO element.
 *
 * @example
 * const element = await selectWebviewHtmlElementById('login-button');
 * await element.click();
 */
export async function selectWebviewHtmlElementById(id: string) {
  return await driver.$(`#${id}`);
}

/**
 * Selects a webview HTML element by its `data-cy` attribute.
 *
 * This function uses WebDriverIO's `$()` method to find an element
 * by its `data-cy` attribute. This is particularly useful for test automation
 * as `data-cy` attributes are often used as stable selectors for testing purposes.
 *
 * @param {string} dataCy - The `data-cy` attribute of the desired HTML element.
 * @returns {Promise<WebdriverIO.Element>} - A promise that resolves to the WebDriverIO element.
 *
 * @example
 * const element = await selectWebviewHtmlElementByDataCy('submit-button');
 * await element.click();
 */
export async function selectWebviewHtmlElementByDataCy(dataCy: string) {
  return await $(`[data-cy="${dataCy}"]`);
}

/**
 * 
 * @param data_testid 
 * @returns 
 */
export async function selectWebviewHtmlElementByDataTestId(data_testid: string) {
  return await $(`[data-testid="${data_testid}"]`);
}


/**
* Function to verify toaster message
*/
export async function thenShouldbeAbleToSeeToastMsg(value:string,functionName:any) {
  if(driver.isAndroid){
    await driver.takeScreenshot();
  }else{
  let isDisplayed = false;
  let count = 0;
  do {
    functionName;
    await wait(Wait.WAIT_VERY_SHORT);
    let pageSource = await driver.getPageSource();
    if (pageSource.includes(value)) {
      isDisplayed = true;
      await annotate(value);
      await driver.takeScreenshot();
      break;
    }
    count++;
  } while (count < 10);
  
  if (isDisplayed == false) {
    throw new Error('Toaster message is not displayed');
  }
}
}

/**
 * Function to switch to NATIVE APP
 */
export async function switchToNativeContext() {
  try{
  await driver.switchContext('NATIVE_APP');
  await wait(Wait.WAIT_MEDIUM);
  await annotate("Switched to Native Context");
  }catch(e){
    console.error("Error while switching to Native Context: " + e);
  }
}

/**
* Scrolls vertically until the element is fully visible in the center of the screen.
* @param element - The WebdriverIO element to bring into view.
* @param direction - 'up' (default) or 'down' to specify scroll direction.
* @param maxScrolls - Maximum number of scroll attempts (default 10).
*/
export async function scrollToElementUntilVisible(
  element: WebdriverIO.Element | ChainablePromiseElement,
  direction: "up" | "down" = "up",
  maxScrolls: number = 10
): Promise<void> {
  const isIOS = driver.isIOS;
  let scrollAttempts = 0;

  while (!(await element.isDisplayed()) && scrollAttempts < maxScrolls) {
    const { height, width } = await driver.getWindowRect();

    const startX = width / 2;
    const startY = direction === "up" ? height * 0.7 : height * 0.3;
    const endY = direction === "up" ? height * 0.3 : height * 0.7;

    await driver.performActions([
      {
        type: "pointer",
        id: "finger1",
        parameters: { pointerType: "touch" },
        actions: [
          { type: "pointerMove", duration: 0, x: startX, y: startY },
          { type: "pointerDown", button: 0 },
          { type: "pause", duration: 100 },
          { type: "pointerMove", duration: 500, x: startX, y: endY },
          { type: "pointerUp", button: 0 },
        ],
      },
    ]);

    await driver.pause(500);
    scrollAttempts++;
  }

  if (await element.isDisplayed()) {
    await element.scrollIntoView();
  } else {
    throw new Error("Element not found after scrolling.");
  }
}

/**
* Scrolls to the very end of the current page or view.
* Works for both Android and iOS.
*/
export async function scrollToEnd(): Promise<void> {
  const MAX_SCROLL_ATTEMPTS = 15;
  let previousPageSource = "";
  let scrollAttempts = 0;
  let unchangedScrollCount = 0;
 
  while (scrollAttempts < MAX_SCROLL_ATTEMPTS) {
    const { height, width } = await driver.getWindowRect();
    const startX = width / 2;
    const startY = height * 0.75;
    const endY = height * 0.35; 
 
    await driver.performActions([
      {
        type: "pointer",
        id: "finger1",
        parameters: { pointerType: "touch" },
        actions: [
          { type: "pointerMove", duration: 0, x: startX, y: startY },
          { type: "pointerDown", button: 0 },
          { type: "pause", duration: 100 },
          { type: "pointerMove", duration: 500, x: startX, y: endY },
          { type: "pointerUp", button: 0 },
        ],
      },
    ]);
 
    await driver.pause(500);
    scrollAttempts++;
 
    const currentPageSource = await driver.getPageSource();
    if (currentPageSource === previousPageSource) {
      unchangedScrollCount++; 
    } else {
      unchangedScrollCount = 0;
    }
 
    if (unchangedScrollCount >= 2) {
      console.log("Reached the true end of the page.");
      break;
    }
 
    previousPageSource = currentPageSource;
  }
}

/**
 * Function to send push notification
 * @param payload - payload to send push notification
 * @param resource - resource to send push notification
 */
export async function fetchWithPayload(_url: any, _method: any, _headers: any, _payload: any, maxRetries = 3, retryDelay = 3000) {
  const url = _url;
  const options = {
    method: _method,
    headers: _headers,
    body: JSON.stringify(_payload),
    // agent: new HttpsProxyAgent(process.env.GLOBAL_AGENT_HTTPS_PROXY),
  };
  for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
    try {
      console.log(`Fetching URL: ${url} (Attempt ${retryCount})`);
      const response = await fetch(url, options);
      if (response.ok) {
        console.log(`✅ Successful response from ${url}`);
        return response.json();
      } else {
        console.log(`🚨 Response error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Attempt ${retryCount} failed: ${error.message}`);
    }
    if (retryCount < maxRetries) {
      console.log(`🚨 Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error(`🚨 Failed to fetch data from ${url} after ${maxRetries} attempts.`);
};

/**
  * Function to send push notification
  * @param payload - payload to send push notification
  * @param resource - resource to send push notification
  */
export async function fetchWithPayloadWithoutProxy(_url: any, _method: any, _headers: any, _payload: any, maxRetries = 3, retryDelay = 3000) {
  const url = _url;
  const options = {
    method: _method,
    headers: _headers,
    body: JSON.stringify(_payload)
  };
  for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
    try {
      console.log(`Fetching URL: ${url} (Attempt ${retryCount})`);
      const response = await fetch(url, options);
      if (response.ok) {
        console.log(`✅ Successful response from ${url}`);
        console.log(`Response Value :${response.status}`)
        return response;
      } else {
        console.log(`🚨 Response error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Attempt ${retryCount} failed: ${error.message}`);
    }
    if (retryCount < maxRetries) {
      console.log(`🚨 Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error(`🚨 Failed to fetch data from ${url} after ${maxRetries} attempts.`);
};

/**
 * Function to change device network
 */
export async function update_network(){
  const sessionId = driver.sessionId;
  const url =`${apiTestdata.browserStackBaseUrl}/app-automate/sessions/${sessionId}/update_network.json`;
  const headers ={
    'Content-Type': 'application/json',
    'Authorization': 'Basic '+Buffer.from(`${process.env.BS_USER}:${process.env.BS_KEY}`).toString('base64'),
  };
  const payload = JSON.stringify({
    networkProfile:'no-network',
  });

  try{
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: payload,
      agent: new HttpsProxyAgent(process.env.HTTPS_PROXY),
    });
    if(!response.ok){
      throw new Error(`Failed to update network profile: ${response.status} ${response.statusText}`);
    }
    const responseData = await response.json();
    annotate("Network profile updated successfully:"+JSON.stringify(responseData));
  }catch(error){
    throw new error(`Error updating network profile: ${error.message}`);
  }
}

/**
     * Locks the device and verifies its locked state
     * @param driver WebdriverIO browser instance
     * @param timeout Optional timeout in seconds to wait for the device to lock (default is 10 seconds)
     * @returns Promise<boolean> indicating whether the device was successfully locked
     */
export async function lockDevice(driver: WebdriverIO.Browser, timeout: number = 10): Promise<boolean> {
  try {
      if(isAndroid()) {
          await driver.lock();
          const isLocked = await driver.isLocked();
          if(!isLocked) {
              throw new Error('Device is not locked');
          }
      } else {
          await driver.execute('mobile: lock');
          const isLocked = await driver.execute('mobile: isLocked');
          if(!isLocked) {
              throw new Error('Device is not locked');
          }
      }
      return true;
  } catch (error) {
      console.error(`Error occurred while trying to lock the device: ${error}`);
      return false;
  }
}

/**
* Unlocks the device and verifies its unlocked state
* @param driver WebdriverIO browser instance
* @param timeout Optional timeout in seconds to wait for the device to unlock (default is 10 seconds)
* @returns Promise<boolean> indicating whether the device was successfully unlocked
*/
export async function unlockDevice(driver: WebdriverIO.Browser, timeout: number = 10): Promise<boolean> {
  try {
      if(isAndroid()) {
          await driver.unlock();
          await driver.waitUntil(
              async () => !(await driver.isLocked()),
              {
                  timeout: timeout * 1000,
                  timeoutMsg: 'Device failed to unlock within timeout',
              }
          );
      } else {
          await driver.execute('mobile: unlock');
          await driver.execute('mobile: waitUntil', [
              {
                  condition: 'mobile: isLocked',
                  timeout: timeout * 1000,
                  timeoutMsg: 'Device failed to unlock within timeout',
              },
          ]);
      }
      return true;
  } catch (error) {
      console.error(`Error occurred while trying to unlock the device: ${error}`);
      return false;
  }
}

/**
 * Function to update location services
 */
export async function updateLocationServices() {
  if (driver.isIOS) {
    await driver.execute(
      `browserstack_executor: { "action": "updateIosDeviceSettings", "arguments": { "LocationServices" : "OFF" }}`
    );
  } else {
    await driver.toggleLocationServices();
  }

}