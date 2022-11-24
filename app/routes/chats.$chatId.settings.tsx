import type { ContextType } from './chats.$chatId'
import type { DataFunctionArgs, LinksFunction } from '@remix-run/node'
import type { ChangeEvent } from 'react'
import type { Status } from '~/types/firebase'

import { Dialog } from '@headlessui/react'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Form,
  Link,
  useFetcher,
  useNavigate,
  useOutletContext,
} from '@remix-run/react'
import { doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useState } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import styles from './chats.$chatId.settings.css'

import { Image } from '~/components'
import { Spinner } from '~/components/Spinner'
import { getChatById, getServerFirebase } from '~/firebase'
import { Close, DefaultChat, Delete, Plus } from '~/icons'
import { useFirebase } from '~/providers/FirebaseProvider'
import { authGetSession } from '~/sessions/auth.server'
import {
  validationCommitSession,
  validationGetSession,
} from '~/sessions/validationStates.server'
import { ACCESS_TOKEN, SET_COOKIE, VALIDATION_STATE_ERROR } from '~/types'
import { getExtensionOfFile, shouldShowDefaultChatImg } from '~/utils'
import { getCookie } from '~/utils/getCookie'

const BACK_ROUTE = '..'
const PARTICIPANT_INPUT_NAME = 'participantId'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export const loader = async ({ params, request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()
  const { chatId } = zx.parseParams(params, { chatId: z.string() })

  const authSession = await authGetSession(getCookie(request))
  const token = authSession.get(ACCESS_TOKEN)

  const [validationSession, decodedToken, currentChat] = await Promise.all([
    validationGetSession(getCookie(request)),
    firebaseAdminAuth.verifySessionCookie(token),
    getChatById(chatId),
  ])

  const isNotOwnerOfChat = currentChat.ownerId !== decodedToken.uid

  if (isNotOwnerOfChat) {
    validationSession.flash(
      VALIDATION_STATE_ERROR,
      "You're not the owner of this chat."
    )

    return redirect(`/chats/${currentChat.id}`, {
      headers: {
        [SET_COOKIE]: await validationCommitSession(validationSession),
      },
    })
  }

  return null
}

export default function Settings() {
  const navigate = useNavigate()
  const fetcher = useFetcher()
  const firebaseContext = useFirebase()

  const [status, setStatus] = useState<Status>('idle')

  const { chat, participants } = useOutletContext<ContextType>()

  async function onImageUpload(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault()
    setStatus('loading')
    const file = event.target.files?.[0]

    if (
      file &&
      firebaseContext?.firebaseStorage &&
      firebaseContext?.firebaseDb
    ) {
      const extension = getExtensionOfFile(file)

      const avatarRef = ref(
        firebaseContext.firebaseStorage,
        `chats/${chat.id}.${extension}`
      )

      const snapshot = await uploadBytes(avatarRef, file)
      const imageUrl = await getDownloadURL(snapshot.ref)

      const chatDoc = doc(firebaseContext.firebaseDb, `chats/${chat.id}`)
      await updateDoc(chatDoc, { imageUrl })

      setStatus('success')
      return
    }
    setStatus('error')
  }

  return (
    <Dialog
      open={true}
      onClose={() => navigate(BACK_ROUTE)}
      className="settings"
    >
      <Dialog.Panel className="settings__panel">
        <div className="settings__panel-header">
          <Link to={BACK_ROUTE} aria-label="Close">
            <Close />
          </Link>
          <Dialog.Title as="h1">Settings</Dialog.Title>

          <Form>
            <button aria-label="Delete chat">
              <Delete />
            </button>
          </Form>
        </div>

        <div className="settings__panel-main">
          {status === 'loading' && (
            <Spinner
              label="uploading image"
              class="settings__panel-main-spinner"
            />
          )}
          <input
            type="file"
            className="sr-only"
            id="image"
            accept="image/*"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onChange={onImageUpload}
          />

          <label htmlFor="image">
            {shouldShowDefaultChatImg(chat) ? (
              <DefaultChat className="settings__panel-main-default-img" />
            ) : (
              <Image
                chat={chat}
                placeholderClassName="settings__panel-main-img-placeholder"
              />
            )}
            <span className="sr-only">Upload image</span>
          </label>

          <h2>{chat.name}</h2>

          <p>{participants.length} participants</p>
        </div>

        <div className="settings__panel-participants">
          <h3>Participants</h3>
          <Link to="./participants" aria-label="Add new participant">
            <Plus />
          </Link>

          <ul>
            {participants.map(({ id, username, email }) => (
              <li key={id}>
                <h4>~ {username}</h4>
                <p>{email}</p>

                <fetcher.Form method="post">
                  <input
                    type="hidden"
                    name={PARTICIPANT_INPUT_NAME}
                    value={id}
                  />

                  <button
                    aria-label={`Remove participant ${username}`}
                    disabled={id === chat.ownerId}
                  >
                    <Close />
                  </button>
                </fetcher.Form>
              </li>
            ))}
          </ul>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}
