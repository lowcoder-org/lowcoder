import { test, expect } from '@playwright/test';
import TestConfigData from '../api/TestDataConfig';
import { Account } from '../api/account';
import Strings from '../api/Strings';

test('Signup for account with success', async ({ page }) => {  
  const host = TestConfigData.PortalHost;  
  await page.goto(host);
  const account = new Account(page);
  const username = 'abc_11_' + Strings.MakeId(4) + '@bitwebsvc.net';
  const password = username + Strings.MakeId(18)
  await account.Signup(username,password);
  
  // Expects page to have a new button
  await expect(page.getByRole('button', { name: 'New' }).nth(1)).toBeVisible();
});

// TODO signup and assert the error fields
