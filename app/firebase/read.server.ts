import type { DocumentReference } from 'firebase/firestore'
import type { User } from '~/types/firebase'

import { doc, getDoc } from 'firebase/firestore'

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
