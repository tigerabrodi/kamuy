import type { loader as chatsLoader } from './chats'
import type { DataFunctionArgs } from '@remix-run/node'
import type { Chat, Member, Status } from '~/types/firebase'

import { json } from '@remix-run/node'
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useTransition,
} from '@remix-run/react'
import { doc, updateDoc } from 'firebase/firestore'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { IS_NEWLY_CREATED } from './chats'

import { Image } from '~/components'
import { Spinner } from '~/components/Spinner'
import {
  getChatById,
  getMembersWithChatId,
  getServerFirebase,
} from '~/firebase'
import { CHATS_COLLECTION } from '~/firebase/constants'
import {
  useGetChatSubscription,
  useGetMembersSubscription,
  useLoaderRouteData,
} from '~/hooks'
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

  const [initialChat, initialMembers] = await Promise.all([
    getChatById(chatId),
    getMembersWithChatId(chatId),
  ])

  const isUserAMemberOfChat = initialMembers.some(
    (member) => member.id === decodedToken.uid
  )

  // TODO: handle not a member of the chat in catch boundary
  if (!isUserAMemberOfChat) {
    throw json(
      { message: "You're not a member in this chat." },
      { status: 403 }
    )
  }

  return json({
    initialChat,
    initialMembers,
    isNewlyCreated,
  })
}

export type ContextType = {
  members: Array<Member>
  chat: Chat
}

export default function ChatDetail() {
  const { initialChat, initialMembers, isNewlyCreated } =
    useLoaderData<typeof loader>()
  const firebaseContext = useFirebase()
  const transition = useTransition()

  const { chat, setChat } = useGetChatSubscription({
    initialChat,
  })

  const data = useLoaderRouteData<typeof chatsLoader>('routes/chats')

  const { members } = useGetMembersSubscription({
    initialMembers,
    chat,
  })

  const [chatNameChangeStatus, setChatNameChangeStatus] =
    useState<Status>('idle')

  // useCallback is required for debounce to work
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleChatNameChange = useCallback(
    debounce(async (chatName: string) => {
      if (firebaseContext?.firebaseDb) {
        setChatNameChangeStatus('loading')
        const chatDoc = doc(
          firebaseContext.firebaseDb,
          // Using initial id here because chat.id could be stale
          `${CHATS_COLLECTION}/${initialChat.id}`
        )
        await updateDoc(chatDoc, { name: chatName })
        setChatNameChangeStatus('success')
      }
    }, 500),
    [firebaseContext]
  )

  const isNavigatingToAnotherChat = transition.state === 'loading'
  const isSubscribedChatStale = chat.id !== initialChat.id
  const isChatNameTheSame = initialChat.name === chat.name

  const shouldNotUpdateChatName =
    isNavigatingToAnotherChat || isChatNameTheSame || isSubscribedChatStale

  useEffect(() => {
    if (shouldNotUpdateChatName) {
      return
    }

    handleChatNameChange(chat.name)?.catch((error) => {
      console.error(error)
      setChatNameChangeStatus('error')
    })
  }, [chat.name, handleChatNameChange, shouldNotUpdateChatName])

  const context: ContextType = { chat, members: members }

  const isOwner = data?.user.id === chat.ownerId

  return data?.user ? (
    <>
      <div className="chat">
        <div
          className={`chat__header ${!isOwner ? 'chat__header-member' : ''}`}
        >
          <Image
            chat={chat}
            defaultChatClassName="chat__header-default-image"
            placeholderClassName="chat__header-image-placeholder"
          />

          <div className="chat__header-input">
            {isOwner ? (
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
            ) : (
              <h3>{chat.name}</h3>
            )}
            {chatNameChangeStatus === 'loading' && (
              <Spinner label="Changing name" />
            )}
          </div>
          {isOwner && (
            <Link
              to={`./settings`}
              aria-label={`Settings of ${chat.name} chat`}
              prefetch="intent"
            >
              <Setting />
            </Link>
          )}

          <p>
            {members.map((member) => (
              <span key={member.id}>{member.username},</span>
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
      <Outlet context={context} />
    </>
  ) : null
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
