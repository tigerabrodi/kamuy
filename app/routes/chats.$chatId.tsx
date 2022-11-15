import type { DataFunctionArgs, LinksFunction } from '@remix-run/node'
import type { Chat } from '~/types/firebase'

import { Form, Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'

import styles from './chats.$chatId.css'

import { getChatById, getParticipantsWithChatId } from '~/firebase'
import { DefaultChat, RightFeather, Setting } from '~/icons'

const TYPE_A_MESSAGE = 'type a message'
const ENTER_CHAT_NAME = 'Enter chat name'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
}

export const loader = async ({ params }: DataFunctionArgs) => {
  const chatId = z.string().parse(params.chatId)

  const chat = await getChatById(chatId)
  const participants = await getParticipantsWithChatId(chatId)

  return {
    chat,
    participants,
  }
}

function shouldShowDefaultChatImg(chat: Chat) {
  return chat.imageUrl === ''
}

export default function ChatDetail() {
  const { chat, participants } = useLoaderData<typeof loader>()

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
