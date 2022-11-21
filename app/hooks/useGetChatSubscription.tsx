import type { DocumentReference } from 'firebase/firestore'
import type { Chat } from '~/types/firebase'

import { doc } from 'firebase/firestore'
import { onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { CHATS_COLLECTION } from '~/firebase/constants'
import { useFirebase } from '~/providers/FirebaseProvider'
import { ChatSchema } from '~/types/firebase'

export function useGetChatSubscription({ initialChat }: { initialChat: Chat }) {
  const firebaseContext = useFirebase()
  const [chat, setChat] = useState(initialChat)

  useEffect(() => {
    if (firebaseContext?.firebaseDb) {
      const chatDocRef = doc(
        firebaseContext?.firebaseDb,
        `${CHATS_COLLECTION}/${chat.id}`
      ) as DocumentReference<Chat>

      const unsubscribe = onSnapshot(chatDocRef, (chatSnapshot) => {
        const newChat = chatSnapshot.data()
        setChat(ChatSchema.parse(newChat))
      })

      return unsubscribe
    }
  }, [firebaseContext?.firebaseDb, chat.id, chat.ownerId])

  return { chat, setChat }
}
