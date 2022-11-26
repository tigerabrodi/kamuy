import type { action } from './validateMemberToBeAdded'
import type { LinksFunction } from '@remix-run/node'
import type { User } from '~/types/firebase'

import { Dialog } from '@headlessui/react'
import {
  Form,
  Link,
  useFetcher,
  useNavigate,
  useParams,
} from '@remix-run/react'
import { useEffect, useState } from 'react'

import styles from './chats.$chatId.settings.members.css'

import { Close } from '~/icons'

const BACK_ROUTE = '..'
export const MEMBER = 'memberInput'
export const CHAT_ID = 'chatId'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function ChatSettingsMember() {
  const [members, setMembers] = useState<Array<User>>([])

  const navigate = useNavigate()
  const fetcher = useFetcher<typeof action>()
  const { chatId } = useParams<{ chatId: string }>()

  const fetchedUser =
    fetcher.data && 'user' in fetcher.data && fetcher.data.user

  useEffect(() => {
    if (fetchedUser) {
      const isFetchedUserInMembers = members.some(
        (member) => member.id === fetchedUser.id
      )

      if (!isFetchedUserInMembers) {
        setMembers([...members, fetchedUser])
      }
    }
  }, [fetchedUser, members])

  return (
    <Dialog open onClose={() => navigate(BACK_ROUTE)} className="members">
      <div className="members__backdrop" aria-hidden="true" />

      <Dialog.Panel className="members__panel">
        <Link
          to={BACK_ROUTE}
          aria-label="Close"
          className="members__panel-close"
        >
          <Close />
        </Link>

        <Dialog.Title as="h1">Members</Dialog.Title>
        <h2>Add members to your chat</h2>

        <fetcher.Form
          action="/validateMemberToBeAdded"
          method="post"
          className="members__search"
        >
          <label htmlFor={MEMBER}>Add people to chat</label>
          <p>
            Type either a valid username or email that doesn't exist in the chat
            yet.
          </p>

          <input type="hidden" name={CHAT_ID} value={chatId} />

          <div>
            <input
              type="text"
              id={MEMBER}
              name={MEMBER}
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
                </li>
              ))}
          </ul>
        </div>

        <div className="members__actions">
          <Link to={BACK_ROUTE}>Cancel</Link>
          <Form method="post">
            <button type="submit" disabled={members.length === 0}>
              Save
            </button>
          </Form>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}
