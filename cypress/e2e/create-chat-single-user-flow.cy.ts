import { createNewUser } from '../support/factory'

const UNTITLED = 'Untitled'
const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'
const SEND_MESSAGE = 'Send message'

const newUser = createNewUser()

beforeEach(() => {
  cy.clearCookies()
})

it('Should be able to create a chat, write messages and edit the chat.', () => {
  cy.visit('/')

  cy.login(newUser)

  cy.findByRole('button', { name: 'Sign In' }).click()

  // Create new chat
  cy.findByRole('button', { name: 'Create new chat' }).click()

  // Assert pending UI during submission
  cy.findByRole('link', { name: `Settings of ${UNTITLED} chat` }).should(
    'not.exist'
  )
  cy.findByText('...').should('be.visible')

  cy.findByLabelText(ENTER_CHAT_NAME).should('be.disabled')
  cy.findByLabelText(TYPE_A_MESSAGE).should('be.disabled')
  cy.findByRole('button', { name: SEND_MESSAGE }).should('be.disabled')

  // Assert page after chat creation
  cy.findByRole('link', { name: `Settings of ${UNTITLED} chat` }).should(
    'be.visible'
  )
  cy.findByRole('link', { name: `${UNTITLED} chat` }).should('be.visible')

  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', UNTITLED)
  cy.findByLabelText(ENTER_CHAT_NAME).should('be.focused')

  cy.findByLabelText(TYPE_A_MESSAGE).should('be.visible')
  cy.findByRole('button', { name: SEND_MESSAGE }).should('be.visible')
})
