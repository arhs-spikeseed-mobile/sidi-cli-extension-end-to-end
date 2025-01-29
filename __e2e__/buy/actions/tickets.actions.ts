import * as e2e from '../../../end-to-end/lib/e2ehelpers';
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
  await expect($(e2e.selectorText('Desc'))).toBeDisplayed();
}
