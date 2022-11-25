import type { DocumentReference } from 'firebase/firestore'
import type { Chat, Member, Timestamp, User } from '~/types/firebase'

import { collection, getDocs } from 'firebase/firestore'
import { runTransaction, serverTimestamp } from 'firebase/firestore'
import { doc, setDoc } from 'firebase/firestore'
import { v4 } from 'uuid'

import {
  CHATS_COLLECTION,
  MEMBERS_COLLECTION,
  UNTITLED,
  USERS_COLLECTION,
} from './constants'
import { getServerFirebase } from './firebase.server'

import { ChatSchema } from '~/types/firebase'

export async function createUserWithUserData(user: User) {
  const { firebaseDb } = getServerFirebase()
  const userDoc = doc(
    firebaseDb,
    `/${USERS_COLLECTION}/${user.id}`
  ) as DocumentReference<User>

  await setDoc(userDoc, user)
}

export async function createChatForUserWithId(userId: string): Promise<Chat> {
  const { firebaseDb } = getServerFirebase()

  return await runTransaction(firebaseDb, async (transaction) => {
    const userDoc = doc(
      firebaseDb,
      `/${USERS_COLLECTION}/${userId}`
    ) as DocumentReference<User>
    const userSnapshot = await transaction.get(userDoc)
    const user = userSnapshot.data()

    if (!user) {
      throw new Error('User does not exist')
    }

    const newChat: Chat = {
      id: v4(),
      name: UNTITLED,
      ownerId: userId,
      imageUrl: '',
      createdAt: serverTimestamp() as unknown as Timestamp,
      memberIds: [userId],
    }
    const chatDoc = doc(firebaseDb, `/${CHATS_COLLECTION}/${newChat.id}`)

    const member: Member = {
      id: userId,
      username: user.username,
      email: user.email,
      addedAt: serverTimestamp() as unknown as Timestamp,
    }
    const memberDoc = doc(
      firebaseDb,
      `/${CHATS_COLLECTION}/${newChat.id}/${MEMBERS_COLLECTION}/${userId}`
    )

    transaction.set(chatDoc, newChat)
    transaction.set(memberDoc, member)

    return newChat
  })
}

export async function deleteChatWithId({
  chatId,
  userId,
}: {
  chatId: string
  userId: string
}) {
  const { firebaseDb } = getServerFirebase()

  await runTransaction(firebaseDb, async (transaction) => {
    const chatDoc = doc(firebaseDb, `/${CHATS_COLLECTION}/${chatId}`)
    const membersDoc = collection(
      firebaseDb,
      `/${CHATS_COLLECTION}/${chatId}/${MEMBERS_COLLECTION}`
    )

    const [membersSnapshot, chatSnapshot] = await Promise.all([
      getDocs(membersDoc),
      transaction.get(chatDoc),
    ])

    const chat = ChatSchema.parse(chatSnapshot.data())

    if (chat.ownerId !== userId) {
      throw new Error('User is not the owner of the chat')
    }

    membersSnapshot.docs.forEach((memberDoc) => {
      transaction.delete(memberDoc.ref)
    })
    transaction.delete(chatDoc)
  })
}
