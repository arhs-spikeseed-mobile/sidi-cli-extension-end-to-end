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
