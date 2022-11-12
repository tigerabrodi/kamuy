import { expect, test } from '@playwright/test'

import { createNewUser } from './factory'

const UNTITLED = 'Untitled'

const newUser = createNewUser()

test('User can create a chat and do operations', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()

  await page.getByLabel('Email').type(newUser.email)
  await page.getByLabel('Username').type(newUser.username)
  await page.getByLabel('Password').type(newUser.password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Create new chat
  await page.getByRole('button', { name: 'Create new chat' }).click()

  // Assert page after chat creation
  await expect(page.getByRole('heading', { name: UNTITLED })).toBeVisible()
  await expect(
    page.getByRole('button', { name: `Settings of ${UNTITLED} chat` })
  ).toBeVisible()

  await expect(page.getByLabel('Enter chat name')).toHaveValue(UNTITLED)
  await expect(page.getByLabel('Enter chat name')).toBeFocused()

  await expect(page.getByLabel('type a message')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible()
})
