import type { DocumentReference } from 'firebase/firestore'
import type { Chat, Participant, Timestamp, User } from '~/types/firebase'

import { collection, getDocs } from 'firebase/firestore'
import { runTransaction, serverTimestamp } from 'firebase/firestore'
import { doc, setDoc } from 'firebase/firestore'
import { v4 } from 'uuid'

import {
  CHATS_COLLECTION,
  PARTICIPANTS_COLLECTION,
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
      participantIds: [userId],
    }
    const chatDoc = doc(firebaseDb, `/${CHATS_COLLECTION}/${newChat.id}`)

    const participant: Participant = {
      id: userId,
      username: user.username,
      email: user.email,
      addedAt: serverTimestamp() as unknown as Timestamp,
    }
    const participantDoc = doc(
      firebaseDb,
      `/${CHATS_COLLECTION}/${newChat.id}/${PARTICIPANTS_COLLECTION}/${userId}`
    )

    transaction.set(chatDoc, newChat)
    transaction.set(participantDoc, participant)

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
    const participantsDoc = collection(
      firebaseDb,
      `/${CHATS_COLLECTION}/${chatId}/${PARTICIPANTS_COLLECTION}`
    )

    const participantsSnapshot = await getDocs(participantsDoc)
    const chatSnapshot = await transaction.get(chatDoc)

    const chat = ChatSchema.parse(chatSnapshot.data())

    console.log('chat', chat)

    if (chat.ownerId !== userId) {
      throw new Error('User is not the owner of the chat')
    }

    participantsSnapshot.docs.forEach((participantDoc) => {
      transaction.delete(participantDoc.ref)
    })
    transaction.delete(chatDoc)
  })
}
