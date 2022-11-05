import type { DocumentReference } from 'firebase/firestore'
import type { User } from '~/types/firebase'

import { doc, setDoc } from 'firebase/firestore'

import { getServerFirebase } from './firebase.server'

export async function createUserWithUser(user: User) {
  const { firebaseDb } = getServerFirebase()
  const userDoc = doc(
    firebaseDb,
    `/users/${user.id}`
  ) as DocumentReference<User>

  await setDoc(userDoc, user)
}
