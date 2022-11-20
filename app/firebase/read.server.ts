import type { CollectionReference, DocumentReference } from 'firebase/firestore'
import type { Chat, Participant, User } from '~/types/firebase'

import { orderBy } from 'firebase/firestore'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { doc, getDoc } from 'firebase/firestore'
import { z } from 'zod'

import {
  CHATS_COLLECTION,
  PARTICIPANTS_COLLECTION,
  USERS_COLLECTION,
  CREATED_AT,
  PARTICIPANT_IDS,
} from './constants'
import { getServerFirebase } from './firebase.server'

import { ChatSchema, ParticipantSchema } from '~/types/firebase'

export async function getUserWithUid(uid: string): Promise<User> {
  const { firebaseDb } = getServerFirebase()

  const userDoc = doc(
    firebaseDb,
    `/${USERS_COLLECTION}/${uid}`
  ) as DocumentReference<User>
  const userSnapshot = await getDoc(userDoc)
  const user = userSnapshot.data()

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

export async function getChatsForUserWithUid(
  uid: string
): Promise<Array<Chat>> {
  const { firebaseDb } = getServerFirebase()

  const chatsRef = collection(
    firebaseDb,
    CHATS_COLLECTION
  ) as CollectionReference<Chat>
  const chatsQuery = query<Chat>(
    chatsRef,
    where(PARTICIPANT_IDS, 'array-contains', uid),
    orderBy(CREATED_AT, 'desc')
  )
  const chatsSnapshot = await getDocs(chatsQuery)
  const chats = chatsSnapshot.docs.map((doc) => doc.data())

  return z.array(ChatSchema).parse(chats)
}

export async function getChatById(id: string): Promise<Chat> {
  const { firebaseDb } = getServerFirebase()

  const chatRef = doc(
    firebaseDb,
    `${CHATS_COLLECTION}/${id}`
  ) as DocumentReference<Chat>
  const chatSnapshot = await getDoc(chatRef)
  const chat = chatSnapshot.data()

  if (!chat) {
    throw new Error('Chat not found')
  }

  return ChatSchema.parse(chat)
}

export async function getParticipantsWithChatId(
  chatId: string
): Promise<Array<Participant>> {
  const { firebaseDb } = getServerFirebase()

  const participantsRef = collection(
    firebaseDb,
    `${CHATS_COLLECTION}/${chatId}/${PARTICIPANTS_COLLECTION}`
  ) as CollectionReference<Participant>

  const participantsSnapshot = await getDocs(participantsRef)

  const participants = participantsSnapshot.docs.map((doc) => doc.data())

  return z.array(ParticipantSchema).parse(participants)
}
