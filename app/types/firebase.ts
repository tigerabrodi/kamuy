import type { DocumentReference } from 'firebase/firestore'

import { z } from 'zod'

import { CREATED_AT, OWNER_ID, PARTICIPANT_IDS } from '~/firebase/constants'

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
  name: z.string(),
  [OWNER_ID]: z.string(),
  [CREATED_AT]: TimestampSchema,
  imageUrl: z.string(),
  [PARTICIPANT_IDS]: z.array(z.string()),
})

export type Chat = z.infer<typeof ChatSchema>

export const ParticipantSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  addedAt: TimestampSchema,
})

export type Participant = z.infer<typeof ParticipantSchema>

export const FirebaseOptionsSchema = z.object({
  apiKey: z.string().optional(),
  authDomain: z.string().optional(),
  databaseURL: z.string().optional(),
  projectId: z.string().optional(),
  storageBucket: z.string().optional(),
  messagingSenderId: z.string().optional(),
  appId: z.string().optional(),
  measurementId: z.string().optional(),
})

export type Status = 'idle' | 'loading' | 'success' | 'error'
