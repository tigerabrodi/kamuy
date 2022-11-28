import { slowCypressDown } from 'cypress-slow-down'
import { createNewUser, createChat } from '../support/factory'

const ENTER_CHAT_NAME = 'Enter chat name'
const CHANGING_NAME = 'Changing name'
const UNTITLED = 'Untitled'
const ADD_PEOPLE_TO_CHAT = 'Add people to chat'

const ownerUser = createNewUser()
const memberUser = createNewUser()

const ownerChat = createChat()

beforeEach(() => {
  cy.clearCookies()
})

slowCypressDown(50)

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
  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', UNTITLED)
  cy.findByText(`${ownerUser.username},`).should('be.visible')

  cy.findByLabelText(ENTER_CHAT_NAME).clear()
  // debounce is 500ms
  cy.wait(500)

  cy.findByLabelText(ENTER_CHAT_NAME).should('have.value', '')
  cy.findByLabelText(ENTER_CHAT_NAME).type(ownerChat.name)

  cy.findByRole('alert', { name: CHANGING_NAME }).should('be.visible')
  cy.findByRole('link', { name: `Settings of ${ownerChat.name} chat` }).click()
  cy.findByRole('link', { name: 'Add new members' }).click()

  cy.findByRole('dialog', { name: 'Members' }).within(() => {
    cy.findByRole('heading', { name: 'Members' }).should('be.visible')
    cy.findByRole('heading', { name: 'Add members to your chat' }).should(
      'be.visible'
    )
    cy.findByRole('link', { name: 'Cancel' }).should('be.visible')
    cy.findByRole('link', { name: 'Close' }).should('be.visible')
    cy.findByRole('button', { name: 'Save' }).should('be.disabled')

    cy.findByText(
      "Type either a valid username or email that doesn't exist in the chat yet."
    ).should('be.visible')
    cy.findByLabelText(ADD_PEOPLE_TO_CHAT).type(memberUser.username)

    // add new member
    cy.findByRole('button', { name: 'Add' }).click()
    cy.findByRole('list').within(() => {
      cy.findByRole('listitem').within(() => {
        cy.findByText(memberUser.email).should('be.visible')
        cy.findByRole('heading', { name: `~ ${memberUser.username}` }).should(
          'be.visible'
        )
      })
    })

    cy.findByRole('button', { name: 'Save' }).click()
    cy.findByRole('alert', { name: 'adding members' }).should('be.visible')
  })

  cy.findByRole('dialog', { name: 'Settings' }).within(() => {
    cy.findByText('2 members').should('be.visible')

    cy.findByRole('list').within(() => {
      cy.findByRole('heading', { name: `~ ${memberUser.username}` }).should(
        'be.visible'
      )
      cy.findByRole('heading', { name: `~ ${ownerUser.username}` }).should(
        'be.visible'
      )

      // delete member
      cy.findByRole('button', {
        name: `Remove member ${memberUser.username}`,
      }).click()
      cy.findByRole('heading', { name: `~ ${memberUser.username}` }).should(
        'not.exist'
      )
    })
  })
})
