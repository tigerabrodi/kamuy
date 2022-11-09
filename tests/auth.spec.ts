import type { TestUser } from './types'

import { expect, test } from '@playwright/test'

import { createNewUser } from './factory'

const SIGNED_IN_SUCCESS_MESSAGE = 'Signed in successfully!'
const SIGNED_UP_SUCCESS_MESSAGE = 'Signed up successfully!'
const SOMETHING_WENT_WRONG_MESSAGE =
  'Something went wrong, please fill in the values again!'

const newUser = createNewUser()

const existingUser: TestUser = {
  email: 'tiger@gmail.com',
  username: 'tiger123',
  password: 'tiger123',
}

test('User can sign up', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Kamuy' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()

  await expect(
    page.getByText(
      "If your account doesn’t exist, we'll create one, otherwise you just sign in."
    )
  ).toBeVisible()

  await page.getByLabel('Email').type(newUser.email)
  await page.getByLabel('Username').type(newUser.username)
  await page.getByLabel('Password').type(newUser.password)

  await page.getByRole('button', { name: 'Sign In' }).click()

  const signUpToast = page.getByRole('status')

  await expect(signUpToast.getByText(SIGNED_UP_SUCCESS_MESSAGE)).toBeVisible()
})

test('User can sign in', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Email').type(existingUser.email)
  await page.getByLabel('Username').type(existingUser.username)
  await page.getByLabel('Password').type(existingUser.password)

  await page.getByRole('button', { name: 'Sign In' }).click()

  const signInToast = page.getByRole('status')

  await expect(signInToast.getByText(SIGNED_IN_SUCCESS_MESSAGE)).toBeVisible()

  await page.waitForNavigation()

  await expect(page.getByRole('heading', { name: 'Kamuy' })).toBeVisible()

  await expect(page.getByText(existingUser.username)).toBeVisible()

  await expect(page.getByText('No chats yet.')).toBeVisible()

  await expect(
    page.getByText(
      'Chat with multiple friends and stay connected with people all over the world.'
    )
  ).toBeVisible()
})

test('Error when trying to sign in with existing user but wrong password.', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByLabel('Email').type(existingUser.email)
  await page.getByLabel('Username').type(existingUser.username)
  await page.getByLabel('Password').type('NLKSNKLSNKLSNF')

  await page.getByRole('button', { name: 'Sign In' }).click()

  const signInErrorToast = page.getByRole('status')

  await expect(
    signInErrorToast.getByText(SOMETHING_WENT_WRONG_MESSAGE)
  ).toBeVisible()
})
