import { createNewUser, createChat } from '../support/factory'

const UNTITLED = 'Untitled'
const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'
const SEND_MESSAGE = 'Send message'
const CHANGING_NAME = 'Changing name'

const newUser = createNewUser()

const chat = createChat()

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
  cy.findByRole('link', { name: 'Settings of pending chat' }).should(
    'be.visible'
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
  cy.findByRole('alert', { name: CHANGING_NAME }).should('not.exist')

  // Change chat name
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(chat.name)
  cy.findByRole('alert', { name: CHANGING_NAME }).should('be.visible')
  cy.findByRole('link', { name: `${chat.name} chat` }).should('be.visible')

  // Open chat settings and assert UI
  cy.findByRole('link', { name: `Settings of ${chat.name} chat` }).click()
  cy.findByRole('dialog', { name: 'Settings' }).within(() => {
    cy.findByRole('heading', { name: 'Settings', level: 1 }).should(
      'be.visible'
    )
    cy.findByRole('link', { name: 'Close' }).should('be.visible')

    cy.findByRole('button', { name: 'Delete chat' }).should('be.visible')
    cy.findByLabelText('Upload image').findByRole('img').should('not.exist')
    cy.findByRole('heading', { name: chat.name, level: 2 }).should('be.visible')

    cy.findByText('1 participants').should('be.visible')
    cy.findByRole('heading', { name: 'Participants', level: 3 }).should(
      'be.visible'
    )

    cy.findByRole('link', { name: 'Add new participant' }).should('be.visible')
    cy.findByRole('listitem').within(() => {
      cy.findByRole('heading', { name: newUser.username, level: 4 }).should(
        'be.visible'
      )
      cy.findByText(newUser.email).should('be.visible')

      cy.findByRole('button', {
        name: `Remove participant ${newUser.username}`,
      }).should('be.visible')
    })
  })
})
