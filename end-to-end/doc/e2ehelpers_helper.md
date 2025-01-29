## 🧩 **Complete documentation for e2ehelpers**

The `e2ehelpers` utility class, provides numerous utility methods to simplify and enhance test implementation. Below is a comprehensive list of all available methods, along with examples for each.


### 1. Wait
Pause the test execution for a specified time.

```typescript
await e2e.wait(5000); // Pauses for 5 seconds
```

You can also use predefined durations from the `Wait` enum:

```typescript
await e2e.wait(Wait.WAIT_SHORT);
await e2e.wait(Wait.WAIT_MEDIUM);
```

### 2. Reset application
Resets the application to its initial state.

```typescript
await e2e.resetApp();
```

### 3. Take screenshot
Capture the current state of the application for debugging or reporting.

```typescript
await e2e.takeScreenshot();
```

### 4. Set geo-location
Set the device’s geographical location.

```typescript
await e2e.setGeoLocation({ latitude: 48.856667, longitude: 2.352222, altitude: 0 });
```

### 5. Tap at coordinates (will not work on different resolutions)
Simulates a tap gesture at specific screen coordinates.

```typescript
await e2e.tapAtCoordinates({ x: 100, y: 200 });
```

### 6. Swipe
Perform a swipe gesture from one point to another.

```typescript
await e2e.swipe({ start: { x: 100, y: 500 }, end: { x: 100, y: 100 }, duration: 500 });
```

### 7. Scroll to element
Scroll and wait for a specific element.

```typescript
await e2e.scrollAndWaitFor('elementId', { up: false });
await e2e.scrollAndWaitFor('textBox2', { waitDisplayed: true });
```

### 8. Restart application
Restart the application to verify lifecycle behaviors.

```typescript
await e2e.restartApp();
```

### 9. Open deep link
Open a specific deep link in the application.

```typescript
await e2e.openDeepLink('myapp://mysection/identifier');
```

### 10. Verify toast message
Check if a specific toast message is displayed.

```typescript
await e2e.thenShouldbeAbleToSeeToastMsg('Biometrics was deactivated');
```

### 11. Background app
Send the application to the background for a specific duration.

```typescript
await e2e.background(5); // Background for 5 seconds
```

### 12. Open URL in browser
Opens a given URL in the device's default browser.

```typescript
await e2e.openUrlInBrowser('https://example.com');
```

### 13. Switch to webview context
Switch the context to interact with webview elements.

```typescript
await e2e.openUrlInBrowser('https://example.com');
await e2e.switchToWebviewContext();
```

### 14. Scroll to page beginning
Scroll to the top of the current page.

```typescript
await e2e.scrollToPageBeginning();
```

### 15. Scroll to Page end
Scroll to the bottom of the current page.

```typescript
await e2e.scrollToPageEnd();
```

### 16. Get device time
Retrieve the current time on the device.

```typescript
const deviceTime = await e2e.getDeviceTime();
console.log(deviceTime);
```

### 17. Change system time
Change the system time on the device for testing purposes.

```typescript
await e2e.changeTime('2025-01-01T00:00:00Z');
```

### 18. Click backspace key
Simulate pressing the backspace key on a given element.

```typescript
await e2e.clickBackspaceKey(3, element); // Presses backspace 3 times
```

### 19. Type key
Simulate typing text using the keyboard.

```typescript
await e2e.typeKey('Hello World');
```

### 20. Annotate
Add annotations to test results for better debugging and logs on BrowserStack.

```typescript
e2e.annotate('Test annotation for debugging');
```

### 21. Open deep link (alternative implementation)
Open a deep link using an alternative method.

```typescript
await e2e.openDeepLink2('myapp://settings');
```

Refer to the `e2ehelpers.ts` file for further details on these methods and their usage.
