import type { ContextType } from './chats.$chatId'
import type { LinksFunction } from '@remix-run/node'
import type { ChangeEvent } from 'react'
import type { Status } from '~/types/firebase'

import { Dialog } from '@headlessui/react'
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

import styles from './chats.$chatId.settings.css'

import { Spinner } from '~/components/Spinner'
import { Close, DefaultChat, Delete, Plus } from '~/icons'
import { useFirebase } from '~/providers/FirebaseProvider'
import { getExtensionOfFile, shouldShowDefaultChatImg } from '~/utils'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

const BACK_ROUTE = '..'

const PARTICIPANT_INPUT_NAME = 'participantId'

export default function Settings() {
  const navigate = useNavigate()
  const fetcher = useFetcher()
  const firebaseContext = useFirebase()

  const [status, setStatus] = useState<Status>('idle')
  const [hasLoadedImage, setHasLoadedImage] = useState(false)

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

  function onLoadImage() {
    setHasLoadedImage(true)
  }

  console.log(hasLoadedImage)

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
              <>
                <img
                  src={chat.imageUrl}
                  alt=""
                  onLoad={onLoadImage}
                  className={hasLoadedImage ? '' : 'sr-only'}
                />
                <div
                  className={hasLoadedImage ? 'sr-only' : 'img-placeholder'}
                />
              </>
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
