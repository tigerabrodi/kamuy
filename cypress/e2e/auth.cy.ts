import { createNewUser } from '../support/factory'
import { TestUser } from '../support/types'

const SIGNED_IN_SUCCESS_MESSAGE = 'Signed in successfully!'
const SIGNED_UP_SUCCESS_MESSAGE = 'Signed up successfully!'
const SOMETHING_WENT_WRONG_MESSAGE =
  'Something went wrong, please fill in the values again!'

const existingUser: TestUser = {
  email: 'tiger@gmail.com',
  password: 'tiger123',
  username: 'tiger123',
} as const

const newUser = createNewUser()

beforeEach(() => {
  cy.clearCookies()
})

it('Should be able to sign up', () => {
  cy.visit('/')

  cy.findByRole('link', { name: 'Kamuy' }).should('be.visible')
  cy.findByRole('heading', { name: 'Sign In' }).should('be.visible')

  cy.findByText(
    "If your account doesn’t exist, we'll create one, otherwise you just sign in."
  ).should('be.visible')

  cy.login(newUser)

  cy.findByRole('button', { name: 'Sign In' }).click()

  cy.findByRole('status')
    .findByText(SIGNED_UP_SUCCESS_MESSAGE)
    .should('be.visible')
})

it('Should be able to sign in', () => {
  cy.visit('/')

  cy.login(existingUser)

  cy.findByRole('button', { name: 'Sign In' }).click()

  cy.findByRole('status')
    .findByText(SIGNED_IN_SUCCESS_MESSAGE)
    .should('be.visible')
  cy.findByRole('heading', { name: 'Kamuy' }).should('be.visible')
  cy.findByText(existingUser.username).should('be.visible')
  cy.findByText('No chats yet.').should('be.visible')
})

it('Should show error message when user tries to sign in with existing user but wrong password', () => {
  cy.visit('/')

  cy.login({ ...existingUser, password: 'wrong password' })

  cy.findByRole('button', { name: 'Sign In' }).click()

  cy.findByRole('status')
    .findByText(SOMETHING_WENT_WRONG_MESSAGE)
    .should('be.visible')
})
