import { expect } from "@playwright/test";
import { Base } from "./base";
import Strings from "./Strings";

export class Account extends Base {
    // Add user test casae
    // SUT - Test Case
    Login = async (username: string, password: string, fullname: string) => {
        const loginPlaceholder = 'name@example.com';
        await this.page.getByPlaceholder(loginPlaceholder).click();
        await this.page.getByPlaceholder(loginPlaceholder).fill(username);
        await this.page.getByPlaceholder(loginPlaceholder).press('Tab');
        await this.page.getByPlaceholder('Password:').fill(password);
        await this.page.getByRole('button', { name: 'Login' }).click();
        //await expect(this.page.getByRole('button', { name: fullname })).toBeVisible();
    }

    Signup = async (username: string, password: string) => {
        await this.page.getByRole('link', { name: 'Sign Up' }).click();
        // await page.locator('div').filter({ hasText: /^Sign Up$/ }).click();
        await this.page.getByPlaceholder('Please enter your email').click();
        await this.page.getByPlaceholder('Please enter your email').fill(username);
        await this.page.getByPlaceholder('Please enter your email').press('Tab');
        await this.page.getByPlaceholder('Please Enter Password').fill(password);
        await this.page.getByPlaceholder('Please Enter Password').press('Tab');
        await this.page.getByPlaceholder('Please Confirm Password').fill(password);
        await this.page.getByRole('button', { name: 'Sign Up' }).click();
        await this.page.getByLabel('Skip').click();
    }
}