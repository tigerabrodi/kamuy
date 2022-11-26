import type { CollectionReference, DocumentReference } from 'firebase/firestore'
import type { Chat, Member, User } from '~/types/firebase'

import { orderBy } from 'firebase/firestore'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { doc, getDoc } from 'firebase/firestore'
import { z } from 'zod'

import {
  CHATS_COLLECTION,
  MEMBERS_COLLECTION,
  USERS_COLLECTION,
  CREATED_AT,
  MEMBER_IDS,
} from './constants'
import { getServerFirebase } from './firebase.server'

import { UserSchema } from '~/types/firebase'
import { ChatSchema, MemberSchema } from '~/types/firebase'

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

  return UserSchema.parse(user)
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
    where(MEMBER_IDS, 'array-contains', uid),
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

  // TODO: handle this in the catch boundary
  if (!chat) {
    throw new Error('Chat not found')
  }

  return chat
}

export async function getMembersWithChatId(
  chatId: string
): Promise<Array<Member>> {
  const { firebaseDb } = getServerFirebase()

  const membersRef = collection(
    firebaseDb,
    `${CHATS_COLLECTION}/${chatId}/${MEMBERS_COLLECTION}`
  ) as CollectionReference<Member>

  const membersSnapshot = await getDocs(membersRef)

  const members = membersSnapshot.docs.map((doc) => doc.data())

  return z.array(MemberSchema).parse(members)
}
