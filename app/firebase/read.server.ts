import type { CollectionReference, DocumentReference } from 'firebase/firestore'
import type { Chat, User } from '~/types/firebase'

import { collection, getDocs, query, where } from 'firebase/firestore'
import { doc, getDoc } from 'firebase/firestore'

import { OWNER_ID } from './constants'
import { getServerFirebase } from './firebase.server'

export async function getUserWithUid(uid: string): Promise<User> {
  const { firebaseDb } = getServerFirebase()

  const userDoc = doc(firebaseDb, `users/${uid}`) as DocumentReference<User>
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

  const chatsRef = collection(firebaseDb, 'chats') as CollectionReference<Chat>
  const chatsQuery = query<Chat>(chatsRef, where(OWNER_ID, '==', uid))
  const chatsSnapshot = await getDocs(chatsQuery)
  const chats = chatsSnapshot.docs.map((doc) => doc.data())

  return chats
}
