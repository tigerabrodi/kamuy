import { createNewUser, createChat } from '../support/factory'
import { slowCypressDown } from 'cypress-slow-down'

const UNTITLED = 'Untitled'
const ENTER_CHAT_NAME = 'Enter chat name'
const CHANGING_NAME = 'Changing name'

const newUser = createNewUser()

const chat = createChat()
const secondChat = createChat()
const thirdChat = createChat()

beforeEach(() => {
  cy.clearCookies()
})

slowCypressDown(100)

it('Should be able to create multiple chats, change their names and navigate around them seeing consistent data.', () => {
  cy.visit('/')
  cy.login(newUser)

  cy.findByRole('button', { name: 'Sign In' }).click()

  // Create new chat
  cy.findByRole('button', { name: 'Create new chat' }).click()

  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', UNTITLED)
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(chat.name)
  cy.findByRole('alert', { name: CHANGING_NAME }).should('not.exist')
  cy.findByRole('link', { name: `${chat.name} chat` }).should('be.visible')

  cy.findByRole('button', { name: 'Create new chat' }).click()

  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(secondChat.name)
  cy.findByRole('link', { name: `${secondChat.name} chat` }).should(
    'be.visible'
  )

  cy.findByRole('link', { name: `${chat.name} chat` }).click()

  cy.findByRole('button', { name: 'Create new chat' }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', UNTITLED)
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(thirdChat.name)

  cy.findByRole('link', { name: `${chat.name} chat` }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', chat.name)

  cy.findByRole('link', { name: `${secondChat.name} chat` }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', secondChat.name)

  cy.findByRole('link', { name: `${thirdChat.name} chat` }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', thirdChat.name)
})
