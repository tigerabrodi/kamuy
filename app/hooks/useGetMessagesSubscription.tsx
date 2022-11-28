import type { CollectionReference } from 'firebase/firestore'
import type { Message } from '~/types/firebase'

import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { CHATS_COLLECTION, MESSAGES_COLLECTION } from '~/firebase/constants'
import { useFirebase } from '~/providers/FirebaseProvider'

export function useGetMessagesSubscription({ chatId }: { chatId: string }) {
  const firebaseContext = useFirebase()
  const [messages, setMessages] = useState<Array<Message>>([])

  useEffect(() => {
    if (firebaseContext?.firebaseDb) {
      const messagesRef = collection(
        firebaseContext?.firebaseDb,
        `${CHATS_COLLECTION}/${chatId}/${MESSAGES_COLLECTION}`
      ) as CollectionReference<Message>

      const unSubscribe = onSnapshot(messagesRef, (messagesSnapshot) => {
        const newMessages = messagesSnapshot.docs.map((doc) => doc.data())
        if (newMessages) {
          setMessages(newMessages)
        }
      })

      return () => {
        unSubscribe()
      }
    }
  }, [firebaseContext?.firebaseDb, chatId])

  return { messages }
}
