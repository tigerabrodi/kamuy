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
const memberUser = createNewUser()

const ownerChat = createChat()

beforeEach(() => {
  cy.clearCookies()
})

it('Should be able to interact with other users, chat and invite as member.', () => {
  cy.visit('/')
  //  Member creates account
  cy.login(memberUser)
  cy.findByRole('button', { name: 'Sign In' }).click()
  cy.findByRole('button', { name: 'Create new chat' }).should('be.visible')

  // Logout member and login owner who will invite member to chat
  cy.clearCookies().visit('/')

  cy.login(ownerUser)
  cy.findByRole('button', { name: 'Sign In' }).click()

  // Create new chat
  cy.findByRole('button', { name: 'Create new chat' }).click()
  cy.findByLabelText(ENTER_CHAT_NAME).should('not.be.disabled')
  cy.findByLabelText(ENTER_CHAT_NAME).clear().type(ownerChat.name)

  cy.findByRole('alert', { name: CHANGING_NAME }).should('be.visible')
  cy.findByRole('link', { name: `Settings of ${ownerChat.name} chat` }).click()
  cy.findByRole('link', { name: 'Add new members' }).click()

  cy.findByRole('dialog', { name: 'Members' }).within(() => {
    cy.findByRole('heading', { name: 'Members' }).should('be.visible')
    cy.findByRole('heading', { name: 'Add members to your chat' }).should(
      'be.visible'
    )
    cy.findByRole('button', { name: 'Save' }).should('be.disabled')

    cy.findByText(
      "Type either a valid username or email that doesn't exist in the chat yet."
    ).should('be.visible')
    cy.findByLabelText('Add people to chat').type(memberUser.username)

    // add new member
    cy.findByRole('button', { name: 'Add' }).click()
    cy.findByRole('list').within(() => {
      cy.findByRole('listitem').within(() => {
        cy.findByText(memberUser.email).should('be.visible')
        cy.findByRole('heading', { name: `~ ${memberUser.username}` }).should(
          'be.visible'
        )
        // remove member
        cy.findByRole('button', {
          name: `Remove member ${memberUser.username}`,
        }).click()
      })
    })

    // add member again
    cy.findByRole('listitem').should('not.exist')
    cy.findByLabelText('Add people to chat').clear().type(memberUser.username)
    cy.findByRole('button', { name: 'Add' }).click()
  })
})
