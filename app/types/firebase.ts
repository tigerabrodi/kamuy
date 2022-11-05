import type { DocumentReference } from 'firebase/firestore'

import { z } from 'zod'

export type User = {
  email: string
  username: string
  id: string
  chats: Array<DocumentReference<Chat>>
}

export const TimestampSchema = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
})

export type Timestamp = z.infer<typeof TimestampSchema>

export const ChatSchema = z.object({
  id: z.string(),
  title: z.string(),
  ownerId: z.string(),
  createdAt: TimestampSchema,
})

export type Chat = z.infer<typeof ChatSchema>
