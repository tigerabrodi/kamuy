import { createNewUser, createChat } from '../support/factory'
import { slowCypressDown } from 'cypress-slow-down'

const ENTER_CHAT_NAME = 'Enter chat name'
const CREATE_NEW_CHAT = 'Create new chat'

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
  cy.findByRole('button', { name: CREATE_NEW_CHAT }).click()

  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(chat.name)
  cy.findByRole('link', { name: `${chat.name} chat` }).should('be.visible')

  // second chat
  cy.findByRole('button', { name: CREATE_NEW_CHAT }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(secondChat.name)
  cy.findByRole('link', { name: `${secondChat.name} chat` }).should(
    'be.visible'
  )

  // click on first chat
  cy.findByRole('link', { name: `${chat.name} chat` }).click()

  // Create third chat
  cy.findByRole('button', { name: CREATE_NEW_CHAT }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(thirdChat.name)

  // Click around and make sure things work
  cy.findByRole('link', { name: `${chat.name} chat` }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', chat.name)

  cy.findByRole('link', { name: `${secondChat.name} chat` }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', secondChat.name)

  cy.findByRole('link', { name: `${thirdChat.name} chat` }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', thirdChat.name)
})
