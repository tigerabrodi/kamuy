import type { DataFunctionArgs } from '@remix-run/node'
import type { Chat } from '~/types/firebase'

import { json } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { zx } from 'zodix'

import { IS_NEWLY_CREATED } from './chats'

import { getChatById, getParticipantsWithChatId } from '~/firebase'
import { DefaultChat, RightFeather, Setting } from '~/icons'

const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'

export const loader = async ({ params, request }: DataFunctionArgs) => {
  const { chatId } = zx.parseParams(params, { chatId: z.string() })
  const { isNewlyCreated } = zx.parseQuery(request, {
    [IS_NEWLY_CREATED]: zx.BoolAsString.optional(),
  })

  const chat = await getChatById(chatId)
  const participants = await getParticipantsWithChatId(chatId)

  return json({
    chat,
    participants,
    isNewlyCreated,
  })
}

function shouldShowDefaultChatImg(chat: Chat) {
  return chat.imageUrl === ''
}

export default function ChatDetail() {
  const { chat, participants, isNewlyCreated } = useLoaderData<typeof loader>()

  return (
    <div className="chat">
      <div className="chat__header">
        {shouldShowDefaultChatImg(chat) ? (
          <DefaultChat />
        ) : (
          <img src={chat.imageUrl} alt="" />
        )}

        <input
          type="text"
          id="title"
          name="title"
          placeholder={ENTER_CHAT_NAME}
          aria-label={ENTER_CHAT_NAME}
          defaultValue={chat.name}
          autoFocus={isNewlyCreated}
        />

        <Link to={`./settings`} aria-label={`Settings of ${chat.name} chat`}>
          <Setting />
        </Link>

        <p>
          {participants.map((participant) => (
            <span key={participant.id}>{participant.username},</span>
          ))}
        </p>
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
  )
}

export function ChatDetailPlaceholder() {
  return (
    <div className="chat">
      <div className="chat__header">
        <DefaultChat />

        <input
          type="text"
          id="title"
          name="title"
          placeholder={ENTER_CHAT_NAME}
          aria-label={ENTER_CHAT_NAME}
          disabled
        />

        <Link
          to={`./settings`}
          aria-label="Settings of pending chat"
          style={{ pointerEvents: 'none' }}
        >
          <Setting />
        </Link>

        <p>...</p>
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
