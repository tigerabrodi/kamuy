import type { DocumentReference } from 'firebase/firestore'
import type { Chat, Participant, Timestamp, User } from '~/types/firebase'

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
