# 🔧 **Getting started**

0. **To ensure easier upgrades to newer versions of the `end-to-end` starter pack**
   - 🚨 Avoid modifying the contents of the `end-to-end` folder directly. This makes it easier to pull updates and benefit from new features or fixes in future versions of the starter pack.

1. **📂 Copy-paste the project:**
   - Copy the entire starter pack into your repository. 
   - Place it in the **root folder** of your project.

2. **🗂 Folder naming:**
   - Keep the folder name `end-to-end` exactly as it is.
   - Create & write all your test files inside the `__e2e__` folder in the **root folder** of your project.

3. **⚙️ Configure BrowserStack credentials (optional)**
   - You can set up Browserstack credentials by defining the following environment variables: `E2E_BS_USER` and `E2E_BS_KEY` or with `.env.browserstack` explained in the Optional section below

4. **⚙️ Configure Proxy (optional)**
   - Create `.env.proxy` as explained in the Optional section below.

5. **🔧 Add custom commands at the root level:**
   - Add your custom commands to the `package.json` file at the root of your project. These commands can handle tokens, force prettier formatting, or any other project-specific needs.
   - Example commands:
     ```json
     {
       "e2e:proj:install": "cd end-to-end && npm install",
       "e2e:proj:download_last_apps_with": "cd end-to-end && npm run e2e:proj:download_last_apps_with codemagic $YOUR_CM_TOKEN $YOUR_CM_APP_ID",
       "e2e:browserstack:run:local": "cd end-to-end && npm run e2e:browserstack:run:local",
       "e2e:simulator:run:local": "cd end-to-end && npm run e2e:simulator:run:local",
       "e2e:simulator:ios_list": "cd end-to-end && npm run e2e:simulator:ios_list",
       "e2e:simulator:android_list": "cd end-to-end && npm run e2e:simulator:android_list",
       "e2e:simulator:android_start_emulator": "cd end-to-end && npm run e2e:simulator:android_start_emulator",
       "e2e:dev:prettier": "cd end-to-end && npm run dev:prettier",
       "e2e:dev:prettier:check": "cd end-to-end && npm run dev:prettier:check",
       "e2e:dev:prettier:fix": "cd end-to-end && npm run dev:prettier:fix",
       "e2e:browserstack:software:browserstacklocal": "cd end-to-end && npm run e2e:browserstack:software:browserstacklocal $BS_ACCESS_KEY"
     }
     ```

6. **📦 Auto-install `end-to-end` packages: (optional)**
   - To ensure `end-to-end` dependencies are installed automatically, add the following `postinstall` script in the root `package.json`:
     ```json
     {
       "scripts": {
         "postinstall": "npm run e2e:proj:install"
       }
     }
     ```
   - This script ensures that whenever the root dependencies are installed, the `end-to-end` folder dependencies are installed as well.
   - ⚠️ This script is not recommend if you are using it with Sidi-cli

7. **Install dependencies:**
   - Run the following command to install the necessary dependencies for the `end-to-end` project:
     ```bash
     npm run e2e:proj:install
     ```

8. **📥 Download the application artifacts:**
   - To download the latest application artifacts (`.apk`, `.aab`, `.ipa`), execute the following command:
     ```bash
     npm run e2e:proj:download_last_apps_with acceptance/1.2.3
     ```
   - If you are not using Codemagic or Bitrise, you will need to manually manage your application artifacts. Ensure they are saved in the following locations:
      - `build/mobile-app(.aab/.apk)`
      - `build/mobile-app.ipa`
   - If you are not using Codemagic or Bitrise, to simplify the process of retrieving application artifacts, create a script that will:
      1. Retrieve `(.aab/.apk)`/`.ipa` files from the builds folder or a remote server (e.g., an S3 bucket or CI/CD artifact repository).
      2. Automatically save the files into the `build` directory with the correct names (`mobile-app.aab`, `mobile-app.ipa`).

9. **🖊 Write your first test:**
   - Create a new class for your test in the `__e2e__` folder. A good strategy to maintain a clean folder structure is to split by feature (create a subfolder for each feature).
   - Example:
     ```
     __e2e__/
         └── buy/
         │    ├── tickets.e2e.ts         # Test file: Describes test cases for buying tickets.
         │    ├── smartphones.e2e.ts         
         │    ├── actions/               # Contains reusable user interaction logic for the "buy" feature.
         │    │   └── tickets.actions.ts # Actions specific to "buy tickets" functionality.
         │    │   └── smartphones.actions.ts  
         │    └── pageobjects/           # Contains UI selectors (locators) for the "buy" feature.
         │        └── tickets.pageobjects.ts # Page objects for "buy tickets".
         │        └── smartphones.pageobjects.ts
         │── .../
         │    ├── ....ts
     ```

   ### Explanation of key parts:

   - **`.pageobjects.`**:
     - This folder contains files where all **selectors** (locators for UI elements) are defined.
     - By centralizing selectors here, you can easily update them when UI elements change without modifying the test logic.
     - Example: The `tickets.pageobjects.ts` file contains selectors like buttons or labels for the "buy tickets" page.

   - **`.actions.`**:
     - This folder contains **reusable actions or workflows** that interact with the selectors from `.pageobjects.`.
     - Actions abstract business logic (e.g., clicking buttons, validating text), ensuring that test cases remain clean and easy to read.
     - Example: The `tickets.actions.ts` file defines how to click a button or verify a label for the "buy tickets" functionality.

   **Benefits of this Structure**:
   - **📁 Separation of Concerns**: Keeps selectors, actions, and tests independent, reducing duplication and making code maintenance easier.
   - **🔄 Reusability**: Both actions and selectors can be reused across multiple tests or features.
   - **📖 Readability**: Test files focus solely on test cases, making them concise and straightforward.

10. **Example test implementation**

   - **Test file (`__e2e__/buy/tickets.e2e.ts`)**
     This is where test cases are written. It uses actions to describe the user's journey or interactions.
     ```typescript
      import * as e2e from '../../end-to-end/lib/e2ehelpers';
      import * as ticketsActions from './actions/tickets.actions';

      describe('User should be able to buy ticket', () => {
          beforeEach(async () => {
              //
          });

          afterEach(async () => {
              await e2e.wait(20 * 1000);
          });

          it('User should see previous tickets and sort them', async () => {
              await ticketsActions.clickOnPreviousTicketsMenu()
              await e2e.annotate("Sort tickets")
              await ticketsActions.clickOnSortButton()
              await ticketsActions.descLabelShouldBeVisible()
              

              // Then check content of the list of tickets
              // await expect(mobilityPage.getTbtInstructionText).toHaveText("Something..");
              // (...)
          });

          // it('User should see the detail of a previously bought ticket', async () => {
          // (...)
          // });
      });
     ```

   - **Actions file (`__e2e__/buy/actions/tickets.actions.ts`)**
     Defines reusable functions for actions on the "buy tickets" page, interacting with `.pageobjects.`.
     ```typescript
      import * as e2e from "../../../end-to-end/lib/e2ehelpers";
      import { Wait } from '../../../end-to-end/lib/e2ehelpers';
      import { ticketsPageObjects } from '../pageobjects/tickets.pageobjects';

      export async function clickOnPreviousTicketsMenu() {
        await expect(ticketsPageObjects.menuPreviousTickets).toBeExisting();
        await expect(ticketsPageObjects.menuPreviousTickets).click();
      }

      export async function clickOnSortButton() {
          await expect(ticketsPageObjects.sortTickets).toBeExisting();
          await expect(ticketsPageObjects.sortTickets).click();
          await e2e.wait(Wait.WAIT_SHORT);
      }

      export async function descLabelShouldBeVisible() {
          await expect($(e2e.selectorText("Desc"))).toBeDisplayed();
      }

     ```

   - **Page objects file (`__e2e__/buy/pageobjects/tickets.pageobjects.ts`)**
     Contains selectors for all elements used in the "buy tickets" tests.
     ```typescript
      import * as e2e from '../../../end-to-end/lib/e2ehelpers';

      class PageHelpers {
          get menuPreviousTickets() {
              return $(
              e2e.isAndroid()
                  ? `//*[@resource-id="my_image"]`
                  : `//XCUIElementTypeOther[@name="my_image"]/XCUIElementTypeOther/XCUIElementTypeImage`
              );
          }

          get sortTickets() {
              return $(e2e.selector(`actionButtonSort`));
          }

          // (...)
      }

      export const ticketsPageObjects = new PageHelpers();
     ```

11. **Customize simulator device(s) list**

    - By default, the configuration for local execution on both platforms is set in the following files:

      - **Android configuration**:  
        **Path**: `lib/baseConfigs/wdio.local.android.conf.js`  
        **Default configuration**:
        ```json
        "appium:automationName": "UiAutomator2",
        "appium:platformVersion": "15.0", // Replace with your local emulator version
        "appium:deviceName": "end-to-end-device", // Replace with your emulator name
        "appium:app": "./build/mobile-app.apk",
        ```

      - **iOS configuration**:  
        **Path**: `lib/baseConfigs/wdio.local.ios.conf.js`  
        **Default configuration**:
        ```json
        "appium:platformVersion": "17.0", // Replace with your iOS simulator version
        "appium:deviceName": "iPhone 15", // Replace with your simulator"s name
        "appium:app": "./build/mobile-app.ipa",
        ```

      - **Unified configuration**:  
        **Path**: `wdio.local.both.conf.js`  
        - This file consolidates configurations for both **iOS** and **Android** platforms into a single location.  
        - Any changes made to the **iOS** or **Android** configurations (e.g., platform version, device name, app path) should be reflected in this file to ensure consistency across local executions.  

    ### Customizing devices
    - You can change the default device or add more devices for testing.
    - When modifying the configuration, ensure the structure remains consistent for each device.

12. **🚀 Execute the test on Simulator**

    - Run the following command to launch the test on BrowserStack:

      ```bash
      npm run e2e:simulator:run:local android "**/tickets.e2e.ts"
      ```

    - This command will trigger the test execution on an Android simulator device(s) for the specified test files.

13. **Customize BrowserStack device(s) list**

    - By default, the configuration for local execution on both platforms is set in the following files:

      - **Android configuration**:  
        **Path**: `lib/baseConfigs/wdio.local.browserstack.android.conf.js`  
        **Default configuration**:
        ```json
        "appium:platformVersion": "12.0",
        "appium:deviceName": "Google Pixel 6",
        ```

      - **iOS configuration**:  
        **Path**: `lib/baseConfigs/wdio.local.browserstack.ios.conf.js`  
        **Default configuration**:
        ```json
        "appium:platformVersion": "16.0",
        "appium:deviceName": "iPhone 14 Pro Max",
        ```

      - **Unified configuration**:  
        **Path**: `wdio.local.browserstack.both.conf.js`  
          - This file consolidates configurations for both **iOS** and **Android** platforms for BrowserStack execution into a single location.  
          - Any changes made to the **iOS** or **Android** configurations (e.g., platform version, device name) should be reflected in this file to ensure consistent execution on BrowserStack.  

    ### Customizing devices
    - You can change the default device or add more devices for testing.
    - When modifying the configuration, ensure the structure remains consistent for each device.
    - **Important**: Avoid modifying any `process.env.*` keys in the configuration files, as they may affect the execution pipeline or environment-specific setups.

14. **Execute the test on BrowserStack**

    - Run the following command to launch the test on BrowserStack:

      ```bash
      npm run e2e:browserstack:run:local android "**/tickets.e2e.ts"
      ```

    - This command will trigger the test execution on BrowserStack on an Android device(s) for the specified test files.

15. **Configure `.env.local` keys (optional)**
    - Ensure you configure the necessary keys in the `.env.local` file for your environment-specific settings.

---

# 🛠 **Optional**

---

## **🌐 Configure Browserstack credentials**

You can set up Browserstack credentials by defining the following environment variables: `E2E_BS_USER` and `E2E_BS_KEY`.

Alternatively, you can configure these credentials directly within the project:

### **🔑 Steps to configure Browserstack credentials:**

1. **📄 Create a `.env.browserstack` file** in the root directory of the project (if it doesn’t already exist).

2. **➕ Add the following keys with their corresponding values** to the file:

   - `E2E_BS_USER` – Your Browserstack username. For example:
     ```env
     E2E_BS_USER=MY_USER
     ```

   - `E2E_BS_KEY` – Your Browserstack access key. For example:
     ```env
     E2E_BS_KEY=MY_ACCESS_KEY
     ```

3. 💾 Save the file.

---

## **🌐 Configure Proxy settings**

If your network requires a proxy to access external services, you need to configure the `.env.proxy` file. This ensures that requests are routed through the specified proxy settings.

### **🔧 Steps to configure the proxy:**

1. **📄 Create a `.env.proxy` file** in the root directory of the project (if it doesn't already exist).

2. **➕ Add the following keys and their respective values** to the file:

   - `HTTP_PROXY` → Proxy URL for HTTP connections. Example:
     ```env
     HTTP_PROXY=http://your-proxy-address:port
     ```

   - `HTTPS_PROXY` → Proxy URL for HTTPS connections. Example:
     ```env
     HTTPS_PROXY=https://your-proxy-address:port
     ```

   - `NO_PROXY` → A comma-separated list of domains or IPs that should bypass the proxy. Example:
     ```env
     NO_PROXY=localhost,127.0.0.1
     ```

   - `NODE_TLS_REJECT_UNAUTHORIZED` → This setting disables SSL/TLS certificate validation. It can be used to bypass security checks in scenarios where certificates are self-signed or otherwise untrusted. Use with caution, as it reduces the security of your connection. Example:
     ```env
     NODE_TLS_REJECT_UNAUTHORIZED='0'
     ```

3. 💾 Save the file.

---

## **🔄 Configure BrowserStackLocal identifier**

BrowserStack Local is a tool that allows you to test your applications hosted on internal or staging environments, ensuring seamless integration with the BrowserStack cloud. To set up and configure BrowserStack Local with a unique identifier, follow the steps below.

---

### **🔧 Steps to configure BrowserStack Local:**

1. **🚀 Launch BrowserStack Local:**  
   Configure the following settings:
   - Set `LOCAL_IDENTIFIER` to your desired identifier.
   - Set `LOCAL_MODE` to `true`.
   - Ensure `.env.local` is correctly configured with all necessary variables.  

   Then run the following command to start BrowserStack Local (in a separate console):

   ```bash
   npm e2e:browserstack:software:browserstacklocal $BS_ACCESS_KEY
   ```

2. **💻 Run tests on BrowserStack:**  
   After starting BrowserStack Local, you can launch your tests on BrowserStack by running:

   ```bash
   npm run e2e:browserstack:run:local android "**/tickets.e2e.ts"
   ```

   This command will execute the test files matching the specified path on the `android` platform.

---

### **💡 Additional notes**

- Replace `$BS_ACCESS_KEY` with your actual BrowserStack access key.
- Ensure the `LOCAL_IDENTIFIER` is unique for each session if running multiple tests simultaneously.
- Check your `.env.local` file for other required configurations such as `BS_USER` and `BS_KEY`.
- For further details, refer to the [BrowserStack documentation](https://www.browserstack.com/docs/app-automate/appium/getting-started).
