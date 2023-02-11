import type { action as ValidateAction } from './validateMemberToBeAdded'
import type { DataFunctionArgs, LinksFunction } from '@remix-run/node'
import type { User } from '~/types/firebase'

import { Dialog } from '@headlessui/react'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  useFetcher,
  useNavigate,
  useParams,
  useTransition,
} from '@remix-run/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import styles from './chats.$chatId.settings.members.css'

import { Spinner } from '~/components/Spinner'
import { addMembersToChat, getServerFirebase } from '~/firebase'
import { CHAT_ID } from '~/firebase/constants'
import { Close } from '~/icons'
import { authGetSession } from '~/sessions/auth.server'
import {
  validationCommitSession,
  validationGetSession,
} from '~/sessions/validationStates.server'
import {
  ACCESS_TOKEN,
  INTENT,
  SET_COOKIE,
  VALIDATION_STATE_SUCCESS,
} from '~/types'
import { getCookie } from '~/utils/getCookie'

const BACK_ROUTE = '..'
export const MEMBER = 'memberInput'
const MEMBER_IDS = 'memberIds'
const SAVE_ACTION = 'save'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export default function ChatSettingsMember() {
  const [members, setMembers] = useState<Array<User>>([])

  const navigate = useNavigate()
  const transition = useTransition()
  const fetcher = useFetcher<typeof ValidateAction>()
  const formRef = useRef<HTMLFormElement | null>(null)
  const { chatId } = useParams<{ chatId: string }>()

  const isSubmittingSave =
    transition.state === 'submitting' &&
    transition.submission.formData.get(INTENT) === SAVE_ACTION

  const isAddingNewMember =
    fetcher.state === 'loading' || fetcher.state === 'submitting'

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

  useEffect(() => {
    if (fetcher.type === 'done') {
      formRef.current?.reset()
    }
  }, [fetcher.type])

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

        {isSubmittingSave && (
          <Spinner label="adding members" class="members__panel-spinner" />
        )}

        <Dialog.Title as="h1">Members</Dialog.Title>
        <h2>Add members to your chat</h2>

        <fetcher.Form
          action="/validateMemberToBeAdded"
          method="post"
          className="members__search"
          ref={formRef}
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
            <button type="submit" disabled={isAddingNewMember}>
              {isAddingNewMember ? 'Adding...' : 'Add'}
            </button>
          </div>
        </fetcher.Form>

        <div className="members__list">
          <h3>New members</h3>

          <ul>
            {members &&
              members.map(({ id, username, email }) => (
                <motion.li animate={{ scale: [0, 1] }} key={id}>
                  <h4>~ {username}</h4>
                  <p>{email}</p>
                </motion.li>
              ))}
          </ul>
        </div>

        <div className="members__actions">
          <Link to={BACK_ROUTE}>Cancel</Link>
          <Form method="post">
            <button
              type="submit"
              disabled={members.length === 0}
              name={INTENT}
              value={SAVE_ACTION}
            >
              Save
            </button>

            <input type="hidden" name={CHAT_ID} value={chatId} />

            {members.length > 0 &&
              members.map(({ id }) => (
                <input type="hidden" name={MEMBER_IDS} value={id} key={id} />
              ))}
          </Form>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}

const FormSchema = zfd.formData(
  z.object({
    [MEMBER_IDS]: zfd.repeatable(z.array(z.string())),
    [CHAT_ID]: z.string(),
  })
)

export const action = async ({ request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()

  const [authSession, validationSession, formData] = await Promise.all([
    authGetSession(getCookie(request)),
    validationGetSession(getCookie(request)),
    request.formData(),
  ])

  const { memberIds, chatId } = FormSchema.parse(formData)

  const token = authSession.get(ACCESS_TOKEN)

  try {
    await firebaseAdminAuth.verifySessionCookie(token)
    await addMembersToChat({ chatId, memberIds })
    validationSession.flash(
      VALIDATION_STATE_SUCCESS,
      'New members added successfully!'
    )

    return redirect(`/chats/${chatId}/settings`, {
      headers: {
        [SET_COOKIE]: await validationCommitSession(validationSession),
      },
    })
  } catch (error) {
    throw json({ error: 'You are unauthenticated.' }, { status: 401 })
  }
}
