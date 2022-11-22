import type { Chat } from '~/types/firebase'

export function shouldShowDefaultChatImg(chat: Chat) {
  return chat.imageUrl === ''
}
