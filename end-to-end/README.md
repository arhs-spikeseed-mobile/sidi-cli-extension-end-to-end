
# 🚀 **End-to-End testing starter pack**

Imagine a world where setting up end-to-end testing for mobile apps is not a daunting task but an effortless, streamlined experience. **End-to-End testing starter pack** makes this dream a reality, empowering developers and teams to build robust, cross-platform test environments with minimal effort.

**End-to-End testing starter pack** simplifies **mobile end-to-end (E2E) testing** with a streamlined collection of scripts and configurations. Designed for both **local usage** and seamless integration with **sidi-cli**, it enables you to quickly set up a robust testing environment.

This starter pack leverages **WebDriverIO (WDIO)** with **Appium** as its core stack, allowing you to write test scripts in **TypeScript (TS)**. With a single codebase, you can efficiently cover **iOS** and **Android** platforms, eliminating the need for separate, fully native implementations.

## 🌟 **Key highlights**
- **From zero to hero in couple of hours**: 
Kickstart your testing journey with an intuitive setup process designed to save you time and energy.

- **Write once, conquer both platforms**: 
Enjoy the power of TypeScript to write reusable test scripts for both iOS and Android. No more duplicating efforts for native platforms.

- **Seamless CI/CD integration**: 
Supercharge your workflows with automated test execution built to work with popular platforms like Codemagic.

- **Future-ready**: 
Built to grow with your tech stack—whether you’re using React Native, Flutter, or other frameworks.

Ready to test beyond limits?
👉 Let’s build something extraordinary. Together.

---

### Supported platforms

| **Platform**    | **Description**                                                      | **Status**             |
|------------------|----------------------------------------------------------------------|------------------------|
| Simulator        | Run tests locally using device simulators or emulators for iOS and Android. | ✅ Supported           |
| BrowserStack     | Perform scalable, cloud-based testing on real devices using BrowserStack.   | ✅ Supported           |
| SauceLabs        | Cloud-based testing platform for web and mobile applications.              | ❌ Not supported yet   |

---

### Technology compatibility

This project is designed to work with **a variety of technologies**:

| **Technology**     | **Status**            |
|---------------------|-----------------------|
| Native iOS          | ✅ Supported          |
| Native Android      | ✅ Supported          |
| Flutter             | 🛠️ Work in Progress  |
| React Native        | ✅ Supported          |
| Mendix              | 🛠️ Work in Progress  |
| Others              | ✅ Supported          |

---

### CI/CD integration

This project is designed to integrate seamlessly into your CI/CD pipeline to automate test execution. 

| **CI/CD Platform** | **Description**                                     | **Status**             |
|---------------------|-----------------------------------------------------|------------------------|
| Codemagic           | Fully supported for managing builds and deployments. | 🛠️ Work in Progress    |
| Bitrise             | CI/CD platform for mobile app development.           | ❌ Not Supported Yet   |

---

### Key benefits

- **Quick setup:** Get started with local testing in just a few hours.
- **CI/CD integration:** Easily integrate with your pipeline for automated execution, ensuring consistent and reliable test runs.
- **Cross-platform efficiency:** Write once in TypeScript and test across iOS and Android with minimal effort.
- **Scalable testing:** Seamlessly bridge local testing with cloud testing on BrowserStack.

---

🧪 **Happy testing!** 🚀

---

# 🛠️ How to run locally end-to-end with BrowserStack

## 🚀 Getting started
To set up your local end-to-end tests with Simulators or BrowserStack, follow the steps outlined in the [Getting Started Guide](doc/getting_started.md).

---

## 🔧 Simplify testing with `e2ehelpers`
Make your test implementation easier and more efficient by leveraging the `e2ehelpers` utility class. It offers numerous utility methods to streamline your workflow.

👉 [Learn more about `e2ehelpers` here](doc/e2ehelpers_helper.md).

---

# 🛠️ **How to configure `sidi-cli` on BrowserStack**



To enable the execution of test suites on BrowserStack, the `sidi-cli` requires a properly structured `browserstack_config.json` file. This configuration file will be read by the CI/CD pipeline to set up test execution.

[CI/CD Configuration Documentation](https://github.com/arhs-spikeseed-mobile/sidi-cli/blob/develop/docs/end-to-end-setup.md)

---

✅ **Follow these steps to streamline your E2E mobile testing process with BrowserStack.**

🧪 **Happy testing!** 🚀

# 🛠️ **Commands list**

### **Install dependencies**
Run the following command to install all necessary dependencies:

```bash
npm install
```

---

### **Download the latest app**
To download the latest app version, use:

```bash
yarn e2e:download_last_apps_with codemagic $MY_TOKEN $APP_ID acceptance/1.0.0  
```

- `<provider>` → The CI/CD platform to use (e.g., `codemagic` or `bitrise`).
- `<token>` → Your authentication token for the selected provider.
- `<app_id>` → The unique identifier of the app on the CI/CD platform.
- `<app_branch>` → The target branch. This will retrieve the **latest build** from either the specified branch (e.g., `acceptance` or `acceptance/*.*.*`)

If you are not using Codemagic or Bitrise, you will need to manually manage your application artifacts. Ensure they are saved in the following locations:
- `build/mobile-app(.aab/.apk)`
- `build/mobile-app.ipa`

---

### **(Optional) Launch BrowserStack local**

If you need to launch BrowserStack Local, ensure `.env.local` is correctly configured, then run:

```bash
yarn e2e:browserstack:software:browserstacklocal $BS_ACCESS_KEY
```

### **Run the local test prompt**

To trigger an interactive prompt for selecting the platform, and script(s), use:

```bash
yarn e2e:browserstack:run:local:prompt
```

---

### **Run Android tests**

Run a specific script on **Android** in the acceptance environment:

```bash
yarn e2e:browserstack:run:local android "**/my_test.e2e.ts"
```

---

### **Run iOS tests**

Run a specific script on **iOS** in the acceptance environment:

```bash
yarn e2e:browserstack:run:local ios "**/my_test.e2e.ts"
```

---

### **Run on iOS and Android tests**

Run a specific script on **iOS/Android** in the acceptance environment:

```bash
yarn e2e:browserstack:run:local both "**/my_test.e2e.ts"
```

---

### **Run the local test on a simulator**

To trigger an interactive prompt on a simulator, and script(s), use:

```bash
yarn e2e:simulator:run:local android "**/my_test.e2e.ts"
```

---

### **Generate html/pdf report**

To generate a reports based on last runs

```bash
yarn e2e:browserstack:run:local:report_html_pdf
```

---

---

### **Run Multiple Scripts or Use Wildcards**

To execute **multiple scripts** or use **wildcards** for pattern matching, follow these examples:

#### **Example 1: Run multiple specific scripts**
To run two specific scripts:

```bash
yarn e2e:browserstack:run:local ios "['**/my_test1.e2e.ts', '**/my_test2.e2e.ts']"
```

#### **Example 2: Use a wildcard to match a pattern**
You can use wildcards to select multiple scripts with similar names. For example:

- To run a single script:
  ```bash
  yarn e2e:browserstack:run:local both "**/my_test.e2e.ts"
  ```

- To run **all scripts starting with `my_`**:
  ```bash
  yarn e2e:browserstack:run:local android "**/my_*.e2e.ts"
  ```

This is especially useful for running batches of related test scripts without needing to list each file individually.

---
