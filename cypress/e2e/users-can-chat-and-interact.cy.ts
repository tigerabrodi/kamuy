import { createNewUser, createChat } from '../support/factory'

const UNTITLED = 'Untitled'
const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'
const SEND_MESSAGE = 'Send message'
const CHANGING_NAME = 'Changing name'
const UPLOAD_IMAGE = 'Upload image'
const DEMO_AVATAR = 'demo-avatar.webp'
const DELETE_CHAT = 'Delete chat'

const ownerUser = createNewUser()
const participantUser = createNewUser()

const ownerChat = createChat()

beforeEach(() => {
  cy.clearCookies()
})

it('Should be able to interact with other users, chat and invite as participant.', () => {
  cy.visit('/')
  //  Participant creates account
  cy.login(participantUser)
  cy.findByRole('button', { name: 'Sign In' }).click()
  cy.findByRole('button', { name: 'Create new chat' }).should('be.visible')

  // Logout participant and login owner who will invite participant to chat
  cy.clearCookies().visit('/')

  cy.login(ownerUser)
  cy.findByRole('button', { name: 'Sign In' }).click()

  // Create new chat
  cy.findByRole('button', { name: 'Create new chat' }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(ownerChat.name)

  cy.findByRole('alert', { name: CHANGING_NAME }).should('be.visible')
  cy.findByRole('link', { name: `Settings of ${ownerChat.name} chat` }).click()

  cy.findByRole('link', { name: 'Add new participants' }).click()

  cy.findByRole('dialog', { name: 'Participants' }).within(() => {
    cy.findByRole('heading', { name: 'Participants', level: 1 }).should(
      'be.visible'
    )
  })
})
