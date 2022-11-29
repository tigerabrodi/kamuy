import type { loader as chatsLoader } from './chats'
import type { DataFunctionArgs } from '@remix-run/node'
import type { Chat, Member, Status } from '~/types/firebase'

import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Form,
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
  useTransition,
} from '@remix-run/react'
import { doc, updateDoc } from 'firebase/firestore'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { IS_NEWLY_CREATED } from './chats'

import { Image } from '~/components'
import { Spinner } from '~/components/Spinner'
import {
  getChatById,
  getMembersWithChatId,
  getMessagesOfChatWithId,
  getServerFirebase,
} from '~/firebase'
import { CHATS_COLLECTION, CHAT_ID } from '~/firebase/constants'
import {
  useGetChatSubscription,
  useGetMembersSubscription,
  useLoaderRouteData,
} from '~/hooks'
import { useGetMessagesSubscription } from '~/hooks/useGetMessagesSubscription'
import { DefaultChat, RightFeather, Setting } from '~/icons'
import { useFirebase } from '~/providers/FirebaseProvider'
import { authGetSession } from '~/sessions/auth.server'
import {
  validationCommitSession,
  validationGetSession,
} from '~/sessions/validationStates.server'
import { ACCESS_TOKEN, SET_COOKIE, VALIDATION_STATE_ERROR } from '~/types'
import { getDateWithTimestamp } from '~/utils'
import { getCookie } from '~/utils/getCookie'

const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'
export const MESSAGE = 'message'
export const OWNER_USERNAME = 'ownerUsername'

export const loader = async ({ params, request }: DataFunctionArgs) => {
  const { firebaseAdminAuth } = getServerFirebase()
  const { chatId } = zx.parseParams(params, { chatId: z.string() })
  const { isNewlyCreated } = zx.parseQuery(request, {
    [IS_NEWLY_CREATED]: zx.BoolAsString.optional(),
  })

  const authSession = await authGetSession(getCookie(request))
  const token = authSession.get(ACCESS_TOKEN)

  try {
    const [
      initialChat,
      initialMembers,
      decodedToken,
      validationSession,
      initialMessages,
    ] = await Promise.all([
      getChatById(chatId),
      getMembersWithChatId(chatId),
      firebaseAdminAuth.verifySessionCookie(token),
      validationGetSession(getCookie(request)),
      getMessagesOfChatWithId(chatId),
    ])

    const isUserAMemberOfChat = initialMembers.some(
      (member) => member.id === decodedToken.uid
    )

    if (!isUserAMemberOfChat) {
      validationSession.flash(
        VALIDATION_STATE_ERROR,
        'You are not a member of this chat!'
      )
      return redirect(`/chats`, {
        headers: {
          [SET_COOKIE]: await validationCommitSession(validationSession),
        },
      })
    }

    return json({
      initialChat,
      initialMembers,
      isNewlyCreated,
      initialMessages,
    })
  } catch (error) {
    const validationSession = await validationGetSession(getCookie(request))
    validationSession.flash(
      VALIDATION_STATE_ERROR,
      'Something went wrong, maybe this chat does not exist?'
    )
    return redirect(`/chats`, {
      headers: {
        [SET_COOKIE]: await validationCommitSession(validationSession),
      },
    })
  }
}

export type ContextType = {
  members: Array<Member>
  chat: Chat
}

export default function ChatDetail() {
  const { initialChat, initialMembers, isNewlyCreated, initialMessages } =
    useLoaderData<typeof loader>()
  const firebaseContext = useFirebase()
  const transition = useTransition()
  const messageFetcher = useFetcher()
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const formRef = useRef<HTMLFormElement>(null)

  const { chat, setChat } = useGetChatSubscription({
    initialChat,
  })

  const { messages } = useGetMessagesSubscription({
    chatId: initialChat.id,
    initialMessages,
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

  const isSubmitting = messageFetcher.state === 'submitting'

  useEffect(() => {
    if (shouldNotUpdateChatName) {
      return
    }

    handleChatNameChange(chat.name)?.catch((error) => {
      console.error(error)
      setChatNameChangeStatus('error')
    })
  }, [chat.name, handleChatNameChange, shouldNotUpdateChatName])

  useEffect(() => {
    if (isSubmitting) {
      formRef.current?.reset()
    }
  }, [isSubmitting])

  useEffect(() => {
    if (scrollElementRef) {
      scrollElementRef.current?.scrollIntoView()
    }
  }, [isSubmitting])

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
          {messages.length > 0 &&
            messages.map(({ id, owner, text, createdAt }) => (
              <div
                className={`chat__chats-message ${
                  data.user.id === owner.id ? 'chat__chats-message--owner' : ''
                }`}
                key={id}
              >
                <div className="chat__chats-message-wrapper">
                  <div>
                    <h4>~ {owner.username}</h4>
                    <p>{text}</p>
                  </div>

                  <p
                    className={`chat__chats-message-date ${
                      data.user.id === owner.id
                        ? 'chat__chats-message-date--owner'
                        : ''
                    }`}
                  >
                    {getDateWithTimestamp(createdAt)}
                  </p>
                </div>
              </div>
            ))}

          <div
            tabIndex={-1}
            style={{ marginTop: '-20px' }}
            ref={scrollElementRef}
          />
        </div>

        <messageFetcher.Form
          className="chat__form"
          method="post"
          action="/addMessageToChat"
          ref={formRef}
        >
          <input
            type="text"
            id={MESSAGE}
            name={MESSAGE}
            aria-label={TYPE_A_MESSAGE}
            placeholder={TYPE_A_MESSAGE}
          />

          <input
            type="hidden"
            name={OWNER_USERNAME}
            value={data.user.username}
          />
          <input type="hidden" name={CHAT_ID} value={initialChat.id} />

          <button type="submit" aria-label="Send message">
            <RightFeather />
          </button>
        </messageFetcher.Form>
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
          id={MESSAGE}
          name={MESSAGE}
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
