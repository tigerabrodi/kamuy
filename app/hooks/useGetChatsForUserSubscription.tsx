import type { CollectionReference } from 'firebase/firestore'
import type { Chat, User } from '~/types/firebase'

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import {
  CHATS_COLLECTION,
  CREATED_AT,
  PARTICIPANT_IDS,
} from '~/firebase/constants'
import { useFirebase } from '~/providers/FirebaseProvider'

export function useGetChatsForUserSubscription({
  user,
  initialUserChats,
}: {
  user: User
  initialUserChats: Array<Chat>
}) {
  const firebaseContext = useFirebase()
  const [userChats, setUserChats] = useState(initialUserChats)

  useEffect(() => {
    if (firebaseContext?.firebaseDb) {
      const chatsRef = collection(
        firebaseContext?.firebaseDb,
        CHATS_COLLECTION
      ) as CollectionReference<Chat>

      const chatsQuery = query<Chat>(
        chatsRef,
        where(PARTICIPANT_IDS, 'array-contains', user.id),
        orderBy(CREATED_AT, 'desc')
      )

      const unsubscribe = onSnapshot(chatsQuery, (chatsSnapshot) => {
        const chats = chatsSnapshot.docs.map((doc) => doc.data())
        setUserChats(chats)
      })

      return unsubscribe
    }
  }, [firebaseContext?.firebaseDb, user.id])

  return { userChats }
}
