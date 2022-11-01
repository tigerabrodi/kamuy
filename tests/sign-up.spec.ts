import type { TestUser } from './types'

import { faker } from '@faker-js/faker'
import { test } from '@playwright/test'

const user: TestUser = {
  email: faker.internet.email(),
  username: faker.internet.userName(),
  password: faker.internet.password(),
}

test('User can sign up', async ({ page }) => {
  await page.goto('/')

  page.getByRole('link', { name: 'Kamuy' })
  page.getByRole('heading', { name: 'Sign In', level: 1 })

  page.getByText(
    'If your account doesn’t exist, we’ll create one, otherwise you just sign in.'
  )

  await page.getByLabel('Email').type(user.email)
  await page.getByLabel('Username').type(user.username)
  await page.getByLabel('Password').type(user.password)

  await page.getByRole('button', { name: 'Sign In' }).click()

  const signUpToast = page.getByRole('status')

  signUpToast.getByText('You have signed up successfully.')

  await page.waitForNavigation()

  page.getByRole('heading', { name: 'Chats', level: 1 })
  page.getByRole('heading', { name: user.username, level: 2 })

  page.getByText('No chats yet.')
  page.getByText(
    'Chat with multiple friends and stay connected with people all over the world.'
  )
  page.getByRole('heading', { name: 'Kamuy', level: 2 })
})
