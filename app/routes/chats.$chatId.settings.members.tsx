import type { LinksFunction } from '@remix-run/node'
import type { Member } from '~/types/firebase'

import { Dialog } from '@headlessui/react'
import { Form, Link, useFetcher, useNavigate } from '@remix-run/react'
import { useState } from 'react'

import styles from './chats.$chatId.settings.members.css'

import { Close } from '~/icons'

const BACK_ROUTE = '..'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function ChatSettingsMember() {
  const [members, setMembers] = useState<Array<Member> | null>(null)

  const navigate = useNavigate()
  const fetcher = useFetcher()

  function onRemoveMember(id: string) {
    if (members) {
      setMembers(members.filter((member) => member.id !== id))
    }
  }

  return (
    <Dialog open onClose={() => navigate(BACK_ROUTE)} className="members">
      <div className="members__backdrop" aria-hidden="true" />

      <Dialog.Panel className="members__panel">
        <Dialog.Title as="h1">Members</Dialog.Title>
        <h2>Add members to your chat</h2>

        <fetcher.Form
          action="/validateMemberToBeAdded"
          method="post"
          className="members__search"
        >
          <label htmlFor="member">Add people to chat</label>
          <p>
            Type either a valid username or email that doesn't exist in the chat
            yet.
          </p>

          <div>
            <input
              type="text"
              id="member"
              name="member"
              placeholder="john@gmail.com"
            />
            <button type="submit">Add</button>
          </div>
        </fetcher.Form>

        <div className="members__list">
          <h3>New members</h3>

          <ul>
            {members &&
              members.map(({ id, username, email }) => (
                <li key={id}>
                  <h4>~ {username}</h4>
                  <p>{email}</p>
                  <button
                    type="button"
                    onClick={() => onRemoveMember(id)}
                    aria-label={`Remove member ${username}`}
                  >
                    <Close />
                  </button>
                </li>
              ))}
          </ul>
        </div>

        <div className="members__actions">
          <Link to={BACK_ROUTE}>Cancel</Link>
          <Form method="post">
            <button type="submit" disabled={!members}>
              Save
            </button>
          </Form>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}
