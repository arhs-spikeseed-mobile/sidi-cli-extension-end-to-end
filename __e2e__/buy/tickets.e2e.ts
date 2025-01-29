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
    await ticketsActions.clickOnPreviousTicketsMenu();
    await e2e.annotate('Sort tickets');
    await ticketsActions.clickOnSortButton();
    await ticketsActions.descLabelShouldBeVisible();

    // Then check content of the list of tickets
    // await expect(mobilityPage.getTbtInstructionText).toHaveText("Something..");
    // (...)
  });

  // it('User should see the detail of a previously bought ticket', async () => {
  // (...)
  // });
});
