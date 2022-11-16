import { createNewUser } from '../support/factory'

const UNTITLED = 'Untitled'

const newUser = createNewUser()

beforeEach(() => {
  cy.clearCookies()
})

it('Should be able to sign up', () => {
  cy.visit('/')

  cy.login(newUser)

  cy.findByRole('button', { name: 'Sign In' }).click()

  // Create new chat
  cy.findByRole('button', { name: 'Create new chat' }).click()

  // Assert page after chat creation
  cy.findByRole('link', { name: `Settings of ${UNTITLED} chat` }).should(
    'be.visible'
  )
  cy.findByRole('link', { name: `${UNTITLED} chat` }).should('be.visible')

  cy.findByLabelText('Enter chat name').should('have.value', UNTITLED)
  cy.findByLabelText('Enter chat name').should('be.focused')

  cy.findByLabelText('type a message').should('be.visible')
  cy.findByRole('button', { name: 'Send message' }).should('be.visible')
})
