import type { DataFunctionArgs } from '@remix-run/node'
import type { Chat, Status } from '~/types/firebase'

import { json } from '@remix-run/node'
import { Form, Link, Outlet, useLoaderData } from '@remix-run/react'
import { doc, updateDoc } from 'firebase/firestore'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { IS_NEWLY_CREATED } from './chats'

import { Spinner } from '~/components/Spinner'
import {
  getChatById,
  getParticipantsWithChatId,
  getServerFirebase,
} from '~/firebase'
import { CHATS_COLLECTION } from '~/firebase/constants'
import { useGetChatSubscription, useGetParticipantsSubscription } from '~/hooks'
import { DefaultChat, RightFeather, Setting } from '~/icons'
import { useFirebase } from '~/providers/FirebaseProvider'
import { authGetSession } from '~/sessions/auth.server'
import { ACCESS_TOKEN } from '~/types'
import { getCookie } from '~/utils/getCookie'

const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'

export const loader = async ({ params, request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()
  const { chatId } = zx.parseParams(params, { chatId: z.string() })
  const { isNewlyCreated } = zx.parseQuery(request, {
    [IS_NEWLY_CREATED]: zx.BoolAsString.optional(),
  })

  const authSession = await authGetSession(getCookie(request))
  const token = authSession.get(ACCESS_TOKEN)

  const decodedToken = await firebaseAdminAuth.verifySessionCookie(token)

  const [initialChat, initialParticipants] = await Promise.all([
    getChatById(chatId),
    getParticipantsWithChatId(chatId),
  ])

  const isUserAParticipantOfChat = initialParticipants.some(
    (participant) => participant.id === decodedToken.uid
  )

  if (!isUserAParticipantOfChat) {
    throw json(
      { message: "You're not a participant in this chat." },
      { status: 403 }
    )
  }

  return json({
    initialChat,
    initialParticipants,
    isNewlyCreated,
  })
}

function shouldShowDefaultChatImg(chat: Chat) {
  return chat.imageUrl === ''
}

export default function ChatDetail() {
  const { initialChat, initialParticipants, isNewlyCreated } =
    useLoaderData<typeof loader>()
  const firebaseContext = useFirebase()

  const { chat, setChat } = useGetChatSubscription({
    initialChat,
  })

  const { participants } = useGetParticipantsSubscription({
    initialParticipants,
    chat,
  })

  const [chatNameChangeStatus, setChatNameChangeStatus] =
    useState<Status>('idle')

  // useCallback is required for debounce to work
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleChatNameChange = useCallback(
    debounce(async (chatName: string) => {
      if (firebaseContext?.firebaseDb && chatName !== chat.name) {
        setChatNameChangeStatus('loading')
        const chatDoc = doc(
          firebaseContext.firebaseDb,
          `${CHATS_COLLECTION}/${chat.id}`
        )
        await updateDoc(chatDoc, { name: chatName })
        setChatNameChangeStatus('success')
      }
    }, 500),
    [firebaseContext]
  )

  useEffect(() => {
    handleChatNameChange(chat.name)?.catch((error) => {
      console.error(error)
      setChatNameChangeStatus('error')
    })
  }, [chat.name, handleChatNameChange])

  return (
    <>
      <div className="chat">
        <div className="chat__header">
          {shouldShowDefaultChatImg(chat) ? (
            <DefaultChat className="chat__header-default-image" />
          ) : (
            <img src={chat.imageUrl} alt="" />
          )}

          <div className="chat__header-input">
            <input
              type="text"
              id="title"
              name="title"
              placeholder={ENTER_CHAT_NAME}
              aria-label={ENTER_CHAT_NAME}
              autoFocus={isNewlyCreated}
              value={chat.name}
              onChange={(event) =>
                setChat((prevChat) => ({
                  ...prevChat,
                  name: event.target.value,
                }))
              }
            />
            {chatNameChangeStatus === 'loading' && (
              <Spinner label="Changing name" />
            )}
          </div>
          <Link
            to={`./settings`}
            aria-label={`Settings of ${chat.name} chat`}
            prefetch="intent"
          >
            <Setting />
          </Link>

          <p>
            {participants.map((participant) => (
              <span key={participant.id}>{participant.username},</span>
            ))}
          </p>
        </div>

        <div className="chat__chats">
          <div />
        </div>

        <Form className="chat__form">
          <input
            type="text"
            id="message"
            name="message"
            aria-label={TYPE_A_MESSAGE}
            placeholder={TYPE_A_MESSAGE}
          />

          <button type="submit" aria-label="Send message">
            <RightFeather />
          </button>
        </Form>
      </div>
      <Outlet />
    </>
  )
}

export function ChatDetailPlaceholder() {
  return (
    <div className="chat">
      <div className="chat__header">
        <DefaultChat className="chat__header-default-image" />

        <div className="chat__header-input">
          <input
            type="text"
            id="title"
            name="title"
            placeholder={ENTER_CHAT_NAME}
            aria-label={ENTER_CHAT_NAME}
            disabled
          />
        </div>

        <Link
          to={`./settings`}
          aria-label="Settings of pending chat"
          style={{ pointerEvents: 'none' }}
          prefetch="intent"
        >
          <Setting />
        </Link>

        <p>...</p>
      </div>

      <div className="chat__chats">
        <div />
      </div>

      <Form className="chat__form">
        <input
          type="text"
          id="message"
          name="message"
          aria-label={TYPE_A_MESSAGE}
          placeholder={TYPE_A_MESSAGE}
          disabled
        />

        <button type="submit" aria-label="Send message" disabled>
          <RightFeather />
        </button>
      </Form>
    </div>
  )
}

// TODO: Handle chat not found
