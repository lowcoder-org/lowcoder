import { test, expect } from '@playwright/test';
import TestConfigData from '../api/TestDataConfig';
import { Account } from '../api/account';
import Strings from '../api/Strings';

test('Login with success', async ({ page }) => {
  const host = TestConfigData.PortalHost;  
  await page.goto(host);

  // Register and then Login
  const username = 'openfloweruser1@bitwebsvc.net';
  const password = '12345password';
  
  await page.getByPlaceholder('Please enter your email').click();
  await page.getByPlaceholder('Please enter your email').fill(username);
  await page.getByPlaceholder('Please enter your email').press('Tab');
  await page.getByPlaceholder('Please enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  // await page.getByTitle('abc_1111@bitwebsvc.net').click();
  // await page.locator('polygon').click();
  // await page.getByRole('dialog').locator('line').nth(1).click();

  // const account = new Account(page);
  // const tempId = Strings.MakeId(4)
  // const tempPassword = Strings.MakeId(9);
  // const username = 'u_' + tempId  + '@bitwebsvc.net';
  // const name = 'Janis Herdez-'+tempId;
  // const companyName = 'Herdez-'+tempId;
  // await account.Signup(username, username,tempPassword,name,companyName);

  // await page.goto(host + 'auth-login');

  // //await page.getByRole('link', { name: 'Sign in' }).click();
  // // register an account, and then  activate account. then use the activated account to login
  // const login = new Account(page);
  // await login.Login(username,tempPassword,name);

  // // Expects page to have a heading with the name of Installation.
  // await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});